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
    const enrollmentRef = ref(rtdb, 'enrollment-analytics');
    const snapshot = await get(enrollmentRef);
    
    if (!snapshot.exists()) {
      // Generate sample data for the last 6 months if none exists
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
      const data = months.map((month, index) => ({
        month,
        students: Math.floor(Math.random() * 100) + 1000 + (index * 20)
      }));
      
      await set(enrollmentRef, data);
      return data;
    }
    
    return snapshot.val();
  } catch (error) {
    console.error('Error fetching enrollment data:', error);
    return [];
  }
};

export const getFeeCollectionData = async (): Promise<FeeCollectionData[]> => {
  try {
    const feeAnalyticsRef = ref(rtdb, 'fee-analytics');
    const snapshot = await get(feeAnalyticsRef);
    
    if (!snapshot.exists()) {
      // Generate sample data for the last 4 months if none exists
      const months = ['Jan', 'Feb', 'Mar', 'Apr'];
      const data = months.map(month => ({
        month,
        collected: Math.floor(Math.random() * 50000) + 200000,
        outstanding: Math.floor(Math.random() * 20000) + 30000
      }));
      
      await set(feeAnalyticsRef, data);
      return data;
    }
    
    return snapshot.val();
  } catch (error) {
    console.error('Error fetching fee collection data:', error);
    return [];
  }
};

export const getFeeBreakdownData = async (): Promise<FeeBreakdownData[]> => {
  try {
    const feeBreakdownRef = ref(rtdb, 'fee-breakdown');
    const snapshot = await get(feeBreakdownRef);
    
    if (!snapshot.exists()) {
      // Generate sample breakdown if none exists
      const data = [
        { name: 'Tuition Fees', value: 185750, fill: 'hsl(var(--primary))' },
        { name: 'Lab Fees', value: 45000, fill: 'hsl(var(--secondary))' },
        { name: 'Library Fees', value: 25000, fill: 'hsl(var(--accent))' },
        { name: 'Sports Fees', value: 30000, fill: 'hsl(var(--success))' },
      ];
      
      await set(feeBreakdownRef, data);
      return data;
    }
    
    return snapshot.val();
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