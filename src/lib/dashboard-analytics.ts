import { ref, set, get, update, push, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase';

// Analytics and Dashboard Data Interfaces
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activeClasses: number;
  activeEnrollments: number;
  totalRevenue: number;
  outstandingFees: number;
  monthlyExpenses: number;
  netBalance: number;
}

export interface EnrollmentData {
  month: string;
  students: number;
}

export interface FeeCollectionData {
  month: string;
  collected: number;
  outstanding: number;
}

export interface FeeBreakdownData {
  name: string;
  value: number;
  fill: string;
}

export interface RecentActivity {
  id: string;
  type: 'enrollment' | 'payment' | 'grade' | 'class' | 'user';
  title: string;
  description: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PendingTask {
  type: string;
  label: string;
  count: number;
  amount?: number;
}

export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  studentId?: string;
  date: string;
  status: 'pending' | 'completed' | 'overdue';
  createdAt: string;
}

// Dashboard Analytics Functions
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const [studentsSnapshot, teachersSnapshot, classesSnapshot, financialSnapshot, usersSnapshot] = await Promise.all([
      get(ref(rtdb, 'students')),
      get(ref(rtdb, 'teachers')),
      get(ref(rtdb, 'classes')),
      get(ref(rtdb, 'financial')),
      get(ref(rtdb, 'users'))
    ]);

    const students = studentsSnapshot.exists() ? Object.values(studentsSnapshot.val()) : [];
    const teachers = teachersSnapshot.exists() ? Object.values(teachersSnapshot.val()) : [];
    const users = usersSnapshot.exists() ? Object.values(usersSnapshot.val()) as any[] : [];
    const classes = classesSnapshot.exists() ? Object.values(classesSnapshot.val()) : [];
    const financial = financialSnapshot.exists() ? Object.values(financialSnapshot.val()) as FinancialRecord[] : [];

    // Calculate financial metrics
    const income = financial.filter(f => f.type === 'income');
    const expenses = financial.filter(f => f.type === 'expense');
    
    const totalRevenue = income.reduce((sum, f) => sum + f.amount, 0);
    const outstandingFees = income.filter(f => f.status === 'pending' || f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0);
    const monthlyExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      const currentMonth = new Date().getMonth();
      return expenseDate.getMonth() === currentMonth;
    }).reduce((sum, e) => sum + e.amount, 0);

    const activeEnrollments = students.filter((s: any) => s.status === 'active').length;

    return {
      totalStudents: students.length,
      totalTeachers: users.filter((u: any) => u.role === 'teacher').length || teachers.length,
      activeClasses: classes.length,
      activeEnrollments,
      totalRevenue,
      outstandingFees,
      monthlyExpenses,
      netBalance: totalRevenue - outstandingFees - monthlyExpenses
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return default values on error
    return {
      totalStudents: 0,
      totalTeachers: 0,
      activeClasses: 0,
      activeEnrollments: 0,
      totalRevenue: 0,
      outstandingFees: 0,
      monthlyExpenses: 0,
      netBalance: 0
    };
  }
};

export const getEnrollmentGrowthData = async (): Promise<EnrollmentData[]> => {
  try {
    const studentsSnapshot = await get(ref(rtdb, 'students'));
    
    if (!studentsSnapshot.exists()) {
      return [];
    }
    
    const students = Object.values(studentsSnapshot.val()) as any[];
    
    // Get last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months: EnrollmentData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      
      // Count students enrolled up to end of this month
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      const enrolledCount = students.filter(s => {
        const enrollDate = new Date(s.enrollmentDate || s.createdAt);
        return enrollDate <= endOfMonth;
      }).length;
      
      last6Months.push({
        month: monthName,
        students: enrolledCount
      });
    }
    
    return last6Months;
  } catch (error) {
    console.error('Error fetching enrollment data:', error);
    return [];
  }
};

export const getFeeCollectionData = async (): Promise<FeeCollectionData[]> => {
  try {
    const [invoicesSnapshot, balancesSnapshot] = await Promise.all([
      get(ref(rtdb, 'invoices')),
      get(ref(rtdb, 'studentBalances'))
    ]);
    
    const invoices = invoicesSnapshot.exists() ? Object.values(invoicesSnapshot.val()) as any[] : [];
    const balances = balancesSnapshot.exists() ? Object.values(balancesSnapshot.val()) as any[] : [];
    
    // Get last 6 months
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const last6Months: FeeCollectionData[] = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[date.getMonth()];
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      // Calculate collected fees for this month (paid invoices)
      const collected = invoices
        .filter(inv => {
          if (inv.status !== 'Paid' || !inv.paymentDate) return false;
          const paymentDate = new Date(inv.paymentDate);
          return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
        })
        .reduce((sum, inv) => sum + (inv.amount || 0), 0);
      
      // Calculate outstanding fees at end of this month
      const outstanding = balances
        .filter(bal => bal.status === 'partial' || bal.status === 'overdue')
        .reduce((sum, bal) => sum + (bal.balance || 0), 0);
      
      last6Months.push({
        month: monthName,
        collected,
        outstanding
      });
    }
    
    return last6Months;
  } catch (error) {
    console.error('Error fetching fee collection data:', error);
    return [];
  }
};

export const getFeeBreakdownData = async (): Promise<FeeBreakdownData[]> => {
  try {
    const [schoolFeesSnapshot, balancesSnapshot] = await Promise.all([
      get(ref(rtdb, 'schoolFees')),
      get(ref(rtdb, 'studentBalances'))
    ]);
    
    const schoolFees = schoolFeesSnapshot.exists() ? Object.values(schoolFeesSnapshot.val()) as any[] : [];
    const balances = balancesSnapshot.exists() ? Object.values(balancesSnapshot.val()) as any[] : [];
    
    // Calculate total fees by type across all classes
    const tuitionTotal = schoolFees.reduce((sum, fee) => sum + (fee.tuitionFees || 0), 0);
    const examTotal = schoolFees.reduce((sum, fee) => sum + (fee.examFees || 0), 0);
    const activityTotal = schoolFees.reduce((sum, fee) => sum + (fee.activityFees || 0), 0);
    const otherTotal = schoolFees.reduce((sum, fee) => sum + (fee.otherFees || 0), 0);
    
    // Calculate actual collections (amount paid)
    const totalCollected = balances.reduce((sum, bal) => sum + (bal.amountPaid || 0), 0);
    const totalOutstanding = balances.reduce((sum, bal) => sum + (bal.balance || 0), 0);
    
    // If we have fee structure data, show breakdown by fee type
    // Otherwise show collected vs outstanding
    if (tuitionTotal > 0 || examTotal > 0 || activityTotal > 0 || otherTotal > 0) {
      const breakdown: FeeBreakdownData[] = [];
      
      if (tuitionTotal > 0) {
        breakdown.push({ name: 'Tuition Fees', value: tuitionTotal, fill: 'hsl(var(--primary))' });
      }
      if (examTotal > 0) {
        breakdown.push({ name: 'Exam Fees', value: examTotal, fill: 'hsl(var(--secondary))' });
      }
      if (activityTotal > 0) {
        breakdown.push({ name: 'Activity Fees', value: activityTotal, fill: 'hsl(var(--accent))' });
      }
      if (otherTotal > 0) {
        breakdown.push({ name: 'Other Fees', value: otherTotal, fill: 'hsl(142 71% 45%)' });
      }
      
      return breakdown;
    } else {
      // Fallback: show collected vs outstanding
      return [
        { name: 'Collected', value: totalCollected, fill: 'hsl(var(--primary))' },
        { name: 'Outstanding', value: totalOutstanding, fill: 'hsl(var(--destructive))' }
      ];
    }
  } catch (error) {
    console.error('Error fetching fee breakdown:', error);
    return [];
  }
};

export const getRecentActivities = async (): Promise<RecentActivity[]> => {
  try {
    const activitiesRef = ref(rtdb, 'recent-activities');
    const snapshot = await get(activitiesRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const activities = Object.entries(snapshot.val()).map(([id, activity]: [string, any]) => ({
      id,
      ...activity
    }));
    
    // Sort by timestamp (most recent first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

export const getPendingTasks = async (): Promise<PendingTask[]> => {
  try {
    const [studentsSnapshot, financialSnapshot] = await Promise.all([
      get(ref(rtdb, 'students')),
      get(ref(rtdb, 'financial'))
    ]);

    const students = studentsSnapshot.exists() ? Object.values(studentsSnapshot.val()) : [];
    const financial = financialSnapshot.exists() ? Object.values(financialSnapshot.val()) as FinancialRecord[] : [];

    // Calculate pending tasks
    const pendingAdmissions = students.filter((s: any) => s.status === 'pending').length;
    const outstandingFees = financial
      .filter(f => f.type === 'income' && (f.status === 'pending' || f.status === 'overdue'))
      .reduce((sum, f) => sum + f.amount, 0);
    const pendingGrades = Math.floor(Math.random() * 15); // This would come from grades system
    const pendingEvaluations = Math.floor(Math.random() * 10); // This would come from evaluation system

    return [
      { type: 'admissions', label: 'Admission Reviews', count: pendingAdmissions },
      { type: 'fees', label: 'Outstanding Fees', count: 0, amount: outstandingFees },
      { type: 'grades', label: 'Grade Approvals', count: pendingGrades },
      { type: 'evaluations', label: 'Teacher Evaluations', count: pendingEvaluations }
    ];
  } catch (error) {
    console.error('Error fetching pending tasks:', error);
    return [];
  }
};

// Function to log activities
export const logActivity = async (activity: Omit<RecentActivity, 'id' | 'timestamp'>): Promise<void> => {
  try {
    const activitiesRef = ref(rtdb, 'recent-activities');
    await push(activitiesRef, {
      ...activity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

// Function to add financial record
export const addFinancialRecord = async (record: Omit<FinancialRecord, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const financialRef = ref(rtdb, 'financial');
    const newRecordRef = push(financialRef);
    
    await set(newRecordRef, {
      ...record,
      createdAt: new Date().toISOString()
    });
    
    return newRecordRef.key!;
  } catch (error) {
    console.error('Error adding financial record:', error);
    throw error;
  }
};

// Real-time subscription for dashboard stats
export const subscribeToDashboardStats = (callback: (stats: DashboardStats) => void): (() => void) => {
  const studentsRef = ref(rtdb, 'students');
  const teachersRef = ref(rtdb, 'teachers');
  const classesRef = ref(rtdb, 'classes');
  const financialRef = ref(rtdb, 'financial');
  const usersRef = ref(rtdb, 'users');

  const updateStats = async () => {
    const stats = await getDashboardStats();
    callback(stats);
  };

  onValue(studentsRef, updateStats);
  onValue(teachersRef, updateStats);
  onValue(classesRef, updateStats);
  onValue(financialRef, updateStats);
  onValue(usersRef, updateStats);

  return () => {
    off(studentsRef);
    off(teachersRef);
    off(classesRef);
    off(financialRef);
    off(usersRef);
  };
};

// Real-time subscription for recent activities
export const subscribeToRecentActivities = (callback: (activities: RecentActivity[]) => void): (() => void) => {
  const activitiesRef = ref(rtdb, 'recent-activities');
  
  onValue(activitiesRef, async () => {
    const activities = await getRecentActivities();
    callback(activities);
  });

  return () => off(activitiesRef);
};