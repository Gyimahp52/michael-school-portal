/**
 * School Features Hooks
 * 
 * React hooks for school management features with offline support
 */

import { useState, useCallback } from 'react';
import {
  markStudentAttendance,
  markBulkAttendance,
  getAttendanceStatus,
  enterGrade,
  calculateStudentAverages,
  recordPayment,
  generateReceipt,
  addStudent,
  updateStudent,
  processAdmission,
  generateReport,
  refreshReport,
  type AttendanceEntry,
  type GradeEntry,
  type PaymentRecord,
  type StudentRecord,
  type ReportData,
} from './school-features';
import { useAuth } from '../../contexts/AuthContext';

// ===== ATTENDANCE HOOKS =====

/**
 * Hook for marking single student attendance
 */
export function useMarkAttendance() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mark = useCallback(async (
    classId: string,
    studentId: string,
    status: 'present' | 'absent' | 'late' | 'excused',
    date?: string
  ): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      const id = await markStudentAttendance(classId, studentId, status, currentUser.uid, date);
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to mark attendance');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return { mark, loading, error };
}

/**
 * Hook for bulk attendance marking
 */
export function useBulkAttendance() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const markBulk = useCallback(async (
    classId: string,
    className: string,
    students: { id: string; name: string }[],
    attendanceData: Record<string, 'present' | 'absent' | 'late' | 'excused'>,
    date?: string
  ): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      const id = await markBulkAttendance(
        classId,
        className,
        currentUser.uid,
        currentUser.displayName || 'Teacher',
        students,
        attendanceData,
        date
      );
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to mark bulk attendance');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return { markBulk, loading, error };
}

/**
 * Hook for checking attendance status
 */
export function useAttendanceStatus(attendanceId: string) {
  const [status, setStatus] = useState<{
    synced: boolean;
    pending: boolean;
    lastSyncedAt?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAttendanceStatus(attendanceId);
      setStatus(result);
    } catch (error) {
      console.error('Failed to get attendance status:', error);
    } finally {
      setLoading(false);
    }
  }, [attendanceId]);

  return { status, loading, checkStatus };
}

// ===== GRADEBOOK HOOKS =====

/**
 * Hook for entering grades
 */
export function useEnterGrade() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const enter = useCallback(async (
    studentId: string,
    studentName: string,
    classId: string,
    subjectId: string,
    assessmentType: GradeEntry['assessmentType'],
    score: number,
    maxScore: number,
    date?: string
  ): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      const id = await enterGrade(
        studentId,
        studentName,
        classId,
        subjectId,
        currentUser.uid,
        assessmentType,
        score,
        maxScore,
        date
      );
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to enter grade');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return { enter, loading, error };
}

/**
 * Hook for calculating student averages
 */
export function useStudentAverages(studentId: string, termId?: string) {
  const [averages, setAverages] = useState<{
    overall: number;
    bySubject: Record<string, number>;
    byAssessmentType: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const calculate = useCallback(async () => {
    try {
      setLoading(true);
      const result = await calculateStudentAverages(studentId, termId);
      setAverages(result);
    } catch (error) {
      console.error('Failed to calculate averages:', error);
    } finally {
      setLoading(false);
    }
  }, [studentId, termId]);

  return { averages, loading, calculate };
}

// ===== FEE MANAGEMENT HOOKS =====

/**
 * Hook for recording payments
 */
export function useRecordPayment() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [receipt, setReceipt] = useState<{ id: string; receiptNumber: string } | null>(null);

  const record = useCallback(async (
    studentId: string,
    studentName: string,
    className: string,
    amount: number,
    paymentMethod: PaymentRecord['paymentMethod'],
    paymentDate?: string
  ): Promise<{ id: string; receiptNumber: string }> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      const result = await recordPayment(
        studentId,
        studentName,
        className,
        amount,
        paymentMethod,
        currentUser.uid,
        paymentDate
      );
      setReceipt(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to record payment');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return { record, loading, error, receipt };
}

/**
 * Hook for generating receipts
 */
export function useGenerateReceipt() {
  const generateReceiptText = useCallback((payment: PaymentRecord): string => {
    return generateReceipt(payment);
  }, []);

  return { generateReceipt: generateReceiptText };
}

// ===== STUDENT RECORDS HOOKS =====

/**
 * Hook for adding students
 */
export function useAddStudent() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const add = useCallback(async (
    studentData: Omit<StudentRecord, 'id' | 'studentCode' | 'createdAt' | 'updatedAt'>
  ): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      const id = await addStudent(studentData, currentUser.uid);
      return id;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to add student');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return { add, loading, error };
}

/**
 * Hook for updating students
 */
export function useUpdateStudent() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const update = useCallback(async (
    studentId: string,
    updates: Partial<StudentRecord>
  ): Promise<void> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      await updateStudent(studentId, updates, currentUser.uid);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update student');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return { update, loading, error };
}

/**
 * Hook for processing admissions
 */
export function useProcessAdmission() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const process = useCallback(async (
    applicationId: string,
    className: string
  ): Promise<string> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      const studentId = await processAdmission(applicationId, currentUser.uid, className);
      return studentId;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to process admission');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return { process, loading, error };
}

// ===== REPORTS HOOKS =====

/**
 * Hook for generating reports
 */
export function useGenerateReport() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [report, setReport] = useState<ReportData | null>(null);

  const generate = useCallback(async (
    type: ReportData['type'],
    dateRange: { start: string; end: string },
    filters: Record<string, any> = {}
  ): Promise<ReportData> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      const result = await generateReport(type, dateRange, filters, currentUser.uid);
      setReport(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to generate report');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const refresh = useCallback(async (reportId: string): Promise<ReportData> => {
    try {
      setLoading(true);
      setError(null);
      const result = await refreshReport(reportId);
      setReport(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to refresh report');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, refresh, loading, error, report };
}
