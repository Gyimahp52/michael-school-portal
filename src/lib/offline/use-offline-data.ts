/**
 * React Hooks for Offline-First Data Access
 * 
 * Provides hooks that automatically handle offline/online data access,
 * reading from IndexedDB when offline and syncing with Firebase when online.
 */

import { useState, useEffect, useCallback } from 'react';
import { syncManager } from './sync-manager';
import * as idbOps from './indexeddb-operations';
import * as idbOpsExt from './indexeddb-operations-extended';
import type {
  AcademicYearLocal,
  TermLocal,
  StudentLocal,
  TeacherLocal,
  SubjectLocal,
  ClassLocal,
  ApplicationLocal,
  AssessmentRecordLocal,
  AttendanceRecordLocal,
  SchoolFeesLocal,
  StudentBalanceLocal,
  InvoiceLocal,
  StudentDocumentLocal,
  CanteenCollectionLocal,
  PromotionRequestLocal,
  ReportLocal,
} from './indexeddb-schema';

// ===== GENERIC HOOK =====

interface UseOfflineDataResult<T> {
  data: T[];
  loading: boolean;
  error: Error | null;
  isOnline: boolean;
  refresh: () => Promise<void>;
}

/**
 * Generic hook for offline-first data access
 */
function useOfflineData<T>(
  fetchFunction: () => Promise<T[]>,
  dependencies: any[] = []
): UseOfflineDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(syncManager.isOnline());

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, ...dependencies]);

  useEffect(() => {
    loadData();

    // Listen for online/offline events
    const unsubscribeOnline = syncManager.on('online', () => {
      setIsOnline(true);
      loadData(); // Refresh data when coming online
    });

    const unsubscribeOffline = syncManager.on('offline', () => {
      setIsOnline(false);
    });

    const unsubscribeSyncComplete = syncManager.on('sync-complete', () => {
      loadData(); // Refresh data after sync
    });

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeSyncComplete();
    };
  }, [loadData]);

  return {
    data,
    loading,
    error,
    isOnline,
    refresh: loadData,
  };
}

// ===== SPECIFIC HOOKS =====

/**
 * Hook for academic years
 */
export function useAcademicYears() {
  return useOfflineData<AcademicYearLocal>(idbOps.getAllAcademicYears);
}

/**
 * Hook for terms
 */
export function useTerms() {
  return useOfflineData<TermLocal>(idbOps.getAllTerms);
}

/**
 * Hook for current term
 */
export function useCurrentTerm() {
  const [term, setTerm] = useState<TermLocal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadTerm = async () => {
      try {
        setLoading(true);
        const currentTerm = await idbOps.getCurrentTerm();
        setTerm(currentTerm);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    loadTerm();
  }, []);

  return { term, loading, error };
}

/**
 * Hook for students
 */
export function useStudents() {
  return useOfflineData<StudentLocal>(idbOps.getAllStudents);
}

/**
 * Hook for students by class
 */
export function useStudentsByClass(className: string) {
  return useOfflineData<StudentLocal>(
    () => idbOps.getStudentsByClass(className),
    [className]
  );
}

/**
 * Hook for teachers
 */
export function useTeachers() {
  return useOfflineData<TeacherLocal>(idbOps.getAllTeachers);
}

/**
 * Hook for subjects
 */
export function useSubjects() {
  return useOfflineData<SubjectLocal>(idbOps.getAllSubjects);
}

/**
 * Hook for classes
 */
export function useClasses() {
  return useOfflineData<ClassLocal>(idbOps.getAllClasses);
}

/**
 * Hook for applications
 */
export function useApplications() {
  return useOfflineData<ApplicationLocal>(idbOps.getAllApplications);
}

/**
 * Hook for assessments
 */
export function useAssessments() {
  return useOfflineData<AssessmentRecordLocal>(idbOps.getAllAssessments);
}

/**
 * Hook for assessments by student
 */
export function useAssessmentsByStudent(studentId: string) {
  return useOfflineData<AssessmentRecordLocal>(
    () => idbOps.getAssessmentsByStudent(studentId),
    [studentId]
  );
}

/**
 * Hook for attendance
 */
export function useAttendance() {
  return useOfflineData<AttendanceRecordLocal>(idbOps.getAllAttendance);
}

/**
 * Hook for attendance by class
 */
export function useAttendanceByClass(classId: string) {
  return useOfflineData<AttendanceRecordLocal>(
    () => idbOps.getAttendanceByClass(classId),
    [classId]
  );
}

/**
 * Hook for school fees
 */
export function useSchoolFees() {
  return useOfflineData<SchoolFeesLocal>(idbOps.getAllSchoolFees);
}

/**
 * Hook for student balances
 */
export function useStudentBalances() {
  return useOfflineData<StudentBalanceLocal>(idbOps.getAllStudentBalances);
}

/**
 * Hook for invoices
 */
export function useInvoices() {
  return useOfflineData<InvoiceLocal>(idbOpsExt.getAllInvoices);
}

/**
 * Hook for invoices by student
 */
export function useInvoicesByStudent(studentId: string) {
  return useOfflineData<InvoiceLocal>(
    () => idbOpsExt.getInvoicesByStudent(studentId),
    [studentId]
  );
}

/**
 * Hook for student documents
 */
export function useStudentDocuments(studentId: string) {
  return useOfflineData<StudentDocumentLocal>(
    () => idbOpsExt.getStudentDocumentsByStudent(studentId),
    [studentId]
  );
}

/**
 * Hook for canteen collections
 */
export function useCanteenCollections() {
  return useOfflineData<CanteenCollectionLocal>(idbOpsExt.getAllCanteenCollections);
}

/**
 * Hook for promotion requests
 */
export function usePromotionRequests() {
  return useOfflineData<PromotionRequestLocal>(idbOpsExt.getAllPromotionRequests);
}

/**
 * Hook for reports
 */
export function useReports() {
  return useOfflineData<ReportLocal>(idbOpsExt.getAllReports);
}

// ===== SYNC STATUS HOOK =====

/**
 * Hook for sync status
 */
export function useSyncStatus() {
  const [status, setStatus] = useState(syncManager.getStatus());

  useEffect(() => {
    const updateStatus = () => {
      setStatus(syncManager.getStatus());
    };

    const unsubscribeStart = syncManager.on('sync-start', updateStatus);
    const unsubscribeComplete = syncManager.on('sync-complete', updateStatus);
    const unsubscribeError = syncManager.on('sync-error', updateStatus);
    const unsubscribeOnline = syncManager.on('online', updateStatus);
    const unsubscribeOffline = syncManager.on('offline', updateStatus);

    // Update status periodically
    const intervalId = setInterval(updateStatus, 1000);

    return () => {
      unsubscribeStart();
      unsubscribeComplete();
      unsubscribeError();
      unsubscribeOnline();
      unsubscribeOffline();
      clearInterval(intervalId);
    };
  }, []);

  return status;
}

// ===== MUTATION HOOKS =====

/**
 * Hook for creating/updating/deleting data with automatic sync
 */
export function useOfflineMutation<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (
    operation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      
      // Trigger sync if online
      if (syncManager.isOnline()) {
        syncManager.syncAll().catch(err => {
          console.error('Background sync failed:', err);
        });
      }
      
      return result;
    } catch (err) {
      console.error('Mutation error:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}

// ===== ONLINE STATUS HOOK =====

/**
 * Hook for online/offline status
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(syncManager.isOnline());

  useEffect(() => {
    const unsubscribeOnline = syncManager.on('online', () => setIsOnline(true));
    const unsubscribeOffline = syncManager.on('offline', () => setIsOnline(false));

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, []);

  return isOnline;
}
