/**
 * School Management Features
 * 
 * Complete offline-first implementations for:
 * - Attendance Management
 * - Gradebook
 * - Fee Management
 * - Student Records
 * - Reports
 */

import { indexedDBManager } from './indexeddb-manager';
import { dataFlowManager } from './data-flow-manager';
import { generateId } from './indexeddb-operations';

// ===== ATTENDANCE MANAGEMENT =====

export interface AttendanceEntry {
  studentId: string;
  studentName: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  remarks?: string;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  className: string;
  teacherId: string;
  teacherName: string;
  date: string; // YYYY-MM-DD
  entries: AttendanceEntry[];
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mark attendance for a single student
 */
export async function markStudentAttendance(
  classId: string,
  studentId: string,
  status: 'present' | 'absent' | 'late' | 'excused',
  teacherId: string,
  date: string = new Date().toISOString().split('T')[0]
): Promise<string> {
  // Get or create attendance record for the day
  const existingRecords = await indexedDBManager.queryByIndex<AttendanceRecord>(
    'attendance',
    'date',
    date
  );

  const existingRecord = existingRecords.find(r => r.classId === classId);

  if (existingRecord) {
    // Update existing record
    const entryIndex = existingRecord.entries.findIndex(e => e.studentId === studentId);
    
    if (entryIndex >= 0) {
      existingRecord.entries[entryIndex].status = status;
    } else {
      existingRecord.entries.push({
        studentId,
        studentName: '', // Will be populated
        status,
      });
    }

    // Recalculate counts
    existingRecord.presentCount = existingRecord.entries.filter(e => e.status === 'present').length;
    existingRecord.absentCount = existingRecord.entries.filter(e => e.status === 'absent').length;
    existingRecord.lateCount = existingRecord.entries.filter(e => e.status === 'late').length;
    existingRecord.updatedAt = new Date().toISOString();

    await dataFlowManager.executeFlow({
      id: existingRecord.id,
      entityType: 'attendance',
      operationType: 'update',
      data: existingRecord,
      userId: teacherId,
      userRole: 'teacher',
      timestamp: Date.now(),
      notifyRoles: ['admin', 'parent'],
    });

    return existingRecord.id;
  } else {
    // Create new record
    const id = generateId();
    const newRecord: AttendanceRecord = {
      id,
      classId,
      className: '',
      teacherId,
      teacherName: '',
      date,
      entries: [{
        studentId,
        studentName: '',
        status,
      }],
      totalStudents: 0,
      presentCount: status === 'present' ? 1 : 0,
      absentCount: status === 'absent' ? 1 : 0,
      lateCount: status === 'late' ? 1 : 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dataFlowManager.executeFlow({
      id,
      entityType: 'attendance',
      operationType: 'create',
      data: newRecord,
      userId: teacherId,
      userRole: 'teacher',
      timestamp: Date.now(),
      notifyRoles: ['admin', 'parent'],
    });

    return id;
  }
}

/**
 * Bulk mark attendance for entire class
 */
export async function markBulkAttendance(
  classId: string,
  className: string,
  teacherId: string,
  teacherName: string,
  students: { id: string; name: string }[],
  attendanceData: Record<string, 'present' | 'absent' | 'late' | 'excused'>,
  date: string = new Date().toISOString().split('T')[0]
): Promise<string> {
  const entries: AttendanceEntry[] = students.map(student => ({
    studentId: student.id,
    studentName: student.name,
    status: attendanceData[student.id] || 'absent',
  }));

  const presentCount = entries.filter(e => e.status === 'present').length;
  const absentCount = entries.filter(e => e.status === 'absent').length;
  const lateCount = entries.filter(e => e.status === 'late').length;

  const id = generateId();
  const record: AttendanceRecord = {
    id,
    classId,
    className,
    teacherId,
    teacherName,
    date,
    entries,
    totalStudents: students.length,
    presentCount,
    absentCount,
    lateCount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dataFlowManager.executeFlow({
    id,
    entityType: 'attendance',
    operationType: 'create',
    data: record,
    userId: teacherId,
    userRole: 'teacher',
    timestamp: Date.now(),
    notifyRoles: ['admin', 'parent'],
  });

  return id;
}

/**
 * Get attendance status (synced/pending)
 */
export async function getAttendanceStatus(attendanceId: string): Promise<{
  synced: boolean;
  pending: boolean;
  lastSyncedAt?: number;
}> {
  const record = await indexedDBManager.getFromStore<any>('attendance', attendanceId);
  
  if (!record) {
    throw new Error('Attendance record not found');
  }

  return {
    synced: record.syncStatus === 'synced',
    pending: record.syncStatus === 'pending',
    lastSyncedAt: record.lastSyncedAt,
  };
}

// ===== GRADEBOOK =====

export interface GradeEntry {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  assessmentType: 'quiz' | 'exam' | 'assignment' | 'project' | 'midterm' | 'final';
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  date: string;
  termId?: string;
  academicYearId?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Enter grade offline
 */
export async function enterGrade(
  studentId: string,
  studentName: string,
  classId: string,
  subjectId: string,
  teacherId: string,
  assessmentType: GradeEntry['assessmentType'],
  score: number,
  maxScore: number,
  date: string = new Date().toISOString()
): Promise<string> {
  const percentage = (score / maxScore) * 100;
  const grade = calculateGrade(percentage);

  const id = generateId();
  const gradeEntry: GradeEntry = {
    id,
    studentId,
    studentName,
    classId,
    className: '',
    subjectId,
    subjectName: '',
    teacherId,
    assessmentType,
    score,
    maxScore,
    percentage,
    grade,
    date,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dataFlowManager.executeFlow({
    id,
    entityType: 'assessment',
    operationType: 'create',
    data: gradeEntry,
    userId: teacherId,
    userRole: 'teacher',
    timestamp: Date.now(),
    notifyRoles: ['admin', 'parent'],
  });

  return id;
}

/**
 * Calculate grade from percentage
 */
function calculateGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * Calculate student averages locally
 */
export async function calculateStudentAverages(
  studentId: string,
  termId?: string
): Promise<{
  overall: number;
  bySubject: Record<string, number>;
  byAssessmentType: Record<string, number>;
}> {
  const grades = await indexedDBManager.queryByIndex<GradeEntry>(
    'assessments',
    'studentId',
    studentId
  );

  // Filter by term if specified
  const filteredGrades = termId 
    ? grades.filter(g => g.termId === termId)
    : grades;

  if (filteredGrades.length === 0) {
    return {
      overall: 0,
      bySubject: {},
      byAssessmentType: {},
    };
  }

  // Calculate overall average
  const overall = filteredGrades.reduce((sum, g) => sum + g.percentage, 0) / filteredGrades.length;

  // Calculate by subject
  const bySubject: Record<string, number> = {};
  const subjectGroups = groupBy(filteredGrades, 'subjectId');
  for (const [subjectId, subjectGrades] of Object.entries(subjectGroups)) {
    bySubject[subjectId] = subjectGrades.reduce((sum, g) => sum + g.percentage, 0) / subjectGrades.length;
  }

  // Calculate by assessment type
  const byAssessmentType: Record<string, number> = {};
  const typeGroups = groupBy(filteredGrades, 'assessmentType');
  for (const [type, typeGrades] of Object.entries(typeGroups)) {
    byAssessmentType[type] = typeGrades.reduce((sum, g) => sum + g.percentage, 0) / typeGrades.length;
  }

  return {
    overall,
    bySubject,
    byAssessmentType,
  };
}

// ===== FEE MANAGEMENT =====

export interface PaymentRecord {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  className: string;
  amount: number;
  paymentMethod: 'cash' | 'mobile_money' | 'bank_transfer' | 'cheque';
  paymentDate: string;
  termId?: string;
  academicYearId?: string;
  recordedBy: string;
  remarks?: string;
  isPending: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Record payment offline
 */
export async function recordPayment(
  studentId: string,
  studentName: string,
  className: string,
  amount: number,
  paymentMethod: PaymentRecord['paymentMethod'],
  recordedBy: string,
  paymentDate: string = new Date().toISOString()
): Promise<{ id: string; receiptNumber: string }> {
  // Generate receipt number
  const receiptNumber = await generateReceiptNumber();

  // Check for duplicate payments (same student, same day, same amount)
  const existingPayments = await indexedDBManager.queryByIndex<PaymentRecord>(
    'invoices',
    'studentId',
    studentId
  );

  const today = new Date().toISOString().split('T')[0];
  const duplicate = existingPayments.find((p: any) => 
    p.paymentDate.startsWith(today) && 
    p.amount === amount &&
    p.syncStatus !== 'failed'
  );

  if (duplicate) {
    throw new Error('Duplicate payment detected for today');
  }

  const id = generateId();
  const payment: PaymentRecord = {
    id,
    receiptNumber,
    studentId,
    studentName,
    className,
    amount,
    paymentMethod,
    paymentDate,
    recordedBy,
    isPending: !navigator.onLine,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dataFlowManager.executeFlow({
    id,
    entityType: 'fee_payment',
    operationType: 'create',
    data: payment,
    userId: recordedBy,
    userRole: 'admin',
    timestamp: Date.now(),
    notifyRoles: ['admin', 'parent'],
  });

  return { id, receiptNumber };
}

/**
 * Generate receipt number
 */
async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get count of receipts this month
  const allPayments = await indexedDBManager.getAllFromStore<PaymentRecord>('invoices');
  const thisMonthPayments = allPayments.filter(p => 
    p.receiptNumber.startsWith(`RCP-${year}${month}`)
  );
  
  const sequence = String(thisMonthPayments.length + 1).padStart(4, '0');
  return `RCP-${year}${month}-${sequence}`;
}

/**
 * Generate receipt with pending status
 */
export function generateReceipt(payment: PaymentRecord): string {
  const status = payment.isPending ? 'PENDING SYNC' : 'CONFIRMED';
  
  return `
    ═══════════════════════════════════════
              PAYMENT RECEIPT
    ═══════════════════════════════════════
    
    Receipt No: ${payment.receiptNumber}
    Status: ${status}
    
    Student: ${payment.studentName}
    Class: ${payment.className}
    
    Amount Paid: GHS ${payment.amount.toFixed(2)}
    Payment Method: ${payment.paymentMethod.replace('_', ' ').toUpperCase()}
    Payment Date: ${new Date(payment.paymentDate).toLocaleDateString()}
    
    Recorded By: ${payment.recordedBy}
    Date Issued: ${new Date(payment.createdAt).toLocaleString()}
    
    ${payment.isPending ? '⚠️ This receipt is pending synchronization' : '✅ Payment confirmed'}
    
    ═══════════════════════════════════════
  `;
}

// ===== STUDENT RECORDS =====

export interface StudentRecord {
  id: string;
  studentCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  className: string;
  previousClass?: string;
  academicYear?: string;
  termId?: string;
  parentName: string;
  parentPhone: string;
  parentWhatsApp: string;
  parentEmail: string;
  address: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated' | 'transferred';
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Add student offline
 */
export async function addStudent(
  studentData: Omit<StudentRecord, 'id' | 'studentCode' | 'createdAt' | 'updatedAt'>,
  recordedBy: string
): Promise<string> {
  const id = generateId();
  const studentCode = await generateStudentCode();

  const student: StudentRecord = {
    ...studentData,
    id,
    studentCode,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await dataFlowManager.executeFlow({
    id,
    entityType: 'student',
    operationType: 'create',
    data: student,
    userId: recordedBy,
    userRole: 'admin',
    timestamp: Date.now(),
    notifyRoles: ['admin'],
  });

  return id;
}

/**
 * Update student info offline
 */
export async function updateStudent(
  studentId: string,
  updates: Partial<StudentRecord>,
  updatedBy: string
): Promise<void> {
  const existing = await indexedDBManager.getFromStore<StudentRecord>('students', studentId);
  
  if (!existing) {
    throw new Error('Student not found');
  }

  const updated: StudentRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await dataFlowManager.executeFlow({
    id: studentId,
    entityType: 'student',
    operationType: 'update',
    data: updated,
    userId: updatedBy,
    userRole: 'admin',
    timestamp: Date.now(),
    notifyRoles: ['admin'],
  });
}

/**
 * Generate student code (MAJE-YYYY-NNN)
 */
async function generateStudentCode(): Promise<string> {
  const year = new Date().getFullYear();
  const allStudents = await indexedDBManager.getAllFromStore<StudentRecord>('students');
  const thisYearStudents = allStudents.filter(s => 
    s.studentCode.startsWith(`MAJE-${year}`)
  );
  
  const sequence = String(thisYearStudents.length + 1).padStart(3, '0');
  return `MAJE-${year}-${sequence}`;
}

/**
 * Process admission offline
 */
export async function processAdmission(
  applicationId: string,
  approvedBy: string,
  className: string
): Promise<string> {
  // Get application
  const application = await indexedDBManager.getFromStore<any>('applications', applicationId);
  
  if (!application) {
    throw new Error('Application not found');
  }

  // Create student record
  const studentId = await addStudent({
    firstName: application.firstName,
    lastName: application.lastName,
    email: application.email,
    phone: application.phone,
    dateOfBirth: application.dateOfBirth,
    className,
    parentName: application.parentName,
    parentPhone: application.parentPhone,
    parentWhatsApp: application.parentWhatsApp,
    parentEmail: application.parentEmail,
    address: application.address,
    enrollmentDate: new Date().toISOString(),
    status: 'active',
  }, approvedBy);

  // Update application status
  await indexedDBManager.putInStore('applications', {
    ...application,
    status: 'approved',
    studentId,
    approvedBy,
    approvedAt: new Date().toISOString(),
    syncStatus: 'pending',
    localUpdatedAt: Date.now(),
  });

  return studentId;
}

// ===== REPORTS =====

export interface ReportData {
  id: string;
  title: string;
  type: 'attendance' | 'grades' | 'fees' | 'students' | 'custom';
  generatedAt: string;
  generatedBy: string;
  dateRange: { start: string; end: string };
  filters: Record<string, any>;
  data: any;
  hasPendingSyncs: boolean;
  pendingSyncCount: number;
  basedOnLocalData: boolean;
}

/**
 * Generate report from local data
 */
export async function generateReport(
  type: ReportData['type'],
  dateRange: { start: string; end: string },
  filters: Record<string, any>,
  generatedBy: string
): Promise<ReportData> {
  // Check for pending syncs
  const stats = await indexedDBManager.getStats();
  const pendingSyncCount = Object.values(stats).reduce((sum: number, store: any) => 
    sum + (store.pending || 0), 0
  );

  let data: any = {};

  switch (type) {
    case 'attendance':
      data = await generateAttendanceReport(dateRange, filters);
      break;
    case 'grades':
      data = await generateGradesReport(dateRange, filters);
      break;
    case 'fees':
      data = await generateFeesReport(dateRange, filters);
      break;
    case 'students':
      data = await generateStudentsReport(filters);
      break;
  }

  const report: ReportData = {
    id: generateId(),
    title: `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
    type,
    generatedAt: new Date().toISOString(),
    generatedBy,
    dateRange,
    filters,
    data,
    hasPendingSyncs: pendingSyncCount > 0,
    pendingSyncCount,
    basedOnLocalData: true,
  };

  return report;
}

/**
 * Generate attendance report
 */
async function generateAttendanceReport(
  dateRange: { start: string; end: string },
  filters: Record<string, any>
): Promise<any> {
  const allAttendance = await indexedDBManager.getAllFromStore<AttendanceRecord>('attendance');
  
  const filtered = allAttendance.filter(a => 
    a.date >= dateRange.start && 
    a.date <= dateRange.end &&
    (!filters.classId || a.classId === filters.classId)
  );

  const totalRecords = filtered.length;
  const totalPresent = filtered.reduce((sum, a) => sum + a.presentCount, 0);
  const totalAbsent = filtered.reduce((sum, a) => sum + a.absentCount, 0);
  const totalLate = filtered.reduce((sum, a) => sum + a.lateCount, 0);
  const totalStudents = filtered.reduce((sum, a) => sum + a.totalStudents, 0);

  return {
    summary: {
      totalRecords,
      totalPresent,
      totalAbsent,
      totalLate,
      totalStudents,
      attendanceRate: totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0,
    },
    records: filtered,
  };
}

/**
 * Generate grades report
 */
async function generateGradesReport(
  dateRange: { start: string; end: string },
  filters: Record<string, any>
): Promise<any> {
  const allGrades = await indexedDBManager.getAllFromStore<GradeEntry>('assessments');
  
  const filtered = allGrades.filter(g => 
    g.date >= dateRange.start && 
    g.date <= dateRange.end &&
    (!filters.classId || g.classId === filters.classId) &&
    (!filters.subjectId || g.subjectId === filters.subjectId)
  );

  const averageScore = filtered.reduce((sum, g) => sum + g.percentage, 0) / filtered.length;
  
  const gradeDistribution = {
    A: filtered.filter(g => g.grade === 'A').length,
    B: filtered.filter(g => g.grade === 'B').length,
    C: filtered.filter(g => g.grade === 'C').length,
    D: filtered.filter(g => g.grade === 'D').length,
    F: filtered.filter(g => g.grade === 'F').length,
  };

  return {
    summary: {
      totalGrades: filtered.length,
      averageScore,
      gradeDistribution,
    },
    grades: filtered,
  };
}

/**
 * Generate fees report
 */
async function generateFeesReport(
  dateRange: { start: string; end: string },
  filters: Record<string, any>
): Promise<any> {
  const allPayments = await indexedDBManager.getAllFromStore<PaymentRecord>('invoices');
  
  const filtered = allPayments.filter(p => 
    p.paymentDate >= dateRange.start && 
    p.paymentDate <= dateRange.end &&
    (!filters.className || p.className === filters.className)
  );

  const totalCollected = filtered.reduce((sum, p) => sum + p.amount, 0);
  const pendingPayments = filtered.filter(p => p.isPending).length;

  return {
    summary: {
      totalPayments: filtered.length,
      totalCollected,
      pendingPayments,
      averagePayment: totalCollected / filtered.length,
    },
    payments: filtered,
  };
}

/**
 * Generate students report
 */
async function generateStudentsReport(filters: Record<string, any>): Promise<any> {
  const allStudents = await indexedDBManager.getAllFromStore<StudentRecord>('students');
  
  const filtered = allStudents.filter(s => 
    (!filters.className || s.className === filters.className) &&
    (!filters.status || s.status === filters.status)
  );

  const statusDistribution = {
    active: filtered.filter(s => s.status === 'active').length,
    inactive: filtered.filter(s => s.status === 'inactive').length,
    graduated: filtered.filter(s => s.status === 'graduated').length,
    transferred: filtered.filter(s => s.status === 'transferred').length,
  };

  return {
    summary: {
      totalStudents: filtered.length,
      statusDistribution,
    },
    students: filtered,
  };
}

/**
 * Refresh report after sync
 */
export async function refreshReport(reportId: string): Promise<ReportData> {
  // Re-generate report with updated data
  const existingReport = await indexedDBManager.getFromStore<ReportData>('reports', reportId);
  
  if (!existingReport) {
    throw new Error('Report not found');
  }

  return generateReport(
    existingReport.type,
    existingReport.dateRange,
    existingReport.filters,
    existingReport.generatedBy
  );
}

// ===== UTILITY FUNCTIONS =====

function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}
