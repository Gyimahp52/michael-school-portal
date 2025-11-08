/**
 * Data Flow Hooks
 * 
 * React hooks for using the data flow manager with automatic UI updates
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  dataFlowManager, 
  type DataFlowOperation, 
  type DataFlowResult,
  type EntityType,
  markAttendance,
  recordGrade,
  recordFeePayment,
  enrollStudent,
} from './data-flow-manager';
import { useAuth } from '../../contexts/AuthContext';

// ===== DATA FLOW HOOK =====

/**
 * Hook for executing data flow operations with automatic UI updates
 */
export function useDataFlow(entityType?: EntityType) {
  const [operations, setOperations] = useState<DataFlowOperation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Listen for operations
  useEffect(() => {
    const unsubscribe = dataFlowManager.on(entityType || '*', (operation) => {
      setOperations(prev => [operation, ...prev].slice(0, 50)); // Keep last 50
    });

    return unsubscribe;
  }, [entityType]);

  const execute = useCallback(async <T,>(
    operation: DataFlowOperation<T>
  ): Promise<DataFlowResult> => {
    try {
      setLoading(true);
      setError(null);
      const result = await dataFlowManager.executeFlow(operation);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Operation failed');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    operations,
    loading,
    error,
    execute,
  };
}

// ===== ATTENDANCE HOOK =====

/**
 * Hook for marking attendance with automatic data flow
 */
export function useMarkAttendance() {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DataFlowResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const mark = useCallback(async (attendanceData: any): Promise<DataFlowResult> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await markAttendance(
        attendanceData,
        currentUser.uid,
        userRole || 'teacher'
      );
      
      setResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to mark attendance');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, userRole]);

  return {
    mark,
    loading,
    result,
    error,
  };
}

// ===== GRADE RECORDING HOOK =====

/**
 * Hook for recording grades with automatic data flow
 */
export function useRecordGrade() {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DataFlowResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const record = useCallback(async (gradeData: any): Promise<DataFlowResult> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await recordGrade(
        gradeData,
        currentUser.uid,
        userRole || 'teacher'
      );
      
      setResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to record grade');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, userRole]);

  return {
    record,
    loading,
    result,
    error,
  };
}

// ===== FEE PAYMENT HOOK =====

/**
 * Hook for recording fee payments with automatic data flow
 */
export function useRecordFeePayment() {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DataFlowResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const record = useCallback(async (paymentData: any): Promise<DataFlowResult> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await recordFeePayment(
        paymentData,
        currentUser.uid,
        userRole || 'admin'
      );
      
      setResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to record payment');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, userRole]);

  return {
    record,
    loading,
    result,
    error,
  };
}

// ===== STUDENT ENROLLMENT HOOK =====

/**
 * Hook for enrolling students with automatic data flow
 */
export function useEnrollStudent() {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DataFlowResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const enroll = useCallback(async (studentData: any): Promise<DataFlowResult> => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await enrollStudent(
        studentData,
        currentUser.uid,
        userRole || 'admin'
      );
      
      setResult(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to enroll student');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [currentUser, userRole]);

  return {
    enroll,
    loading,
    result,
    error,
  };
}

// ===== OPERATION STATUS HOOK =====

/**
 * Hook for monitoring operation status
 */
export function useOperationStatus(operationId: string) {
  const [status, setStatus] = useState<{
    pending: boolean;
    synced: boolean;
    notified: boolean;
  }>({
    pending: true,
    synced: false,
    notified: false,
  });

  useEffect(() => {
    const unsubscribe = dataFlowManager.on('*', (operation) => {
      if (operation.id === operationId) {
        // Update status based on operation
        setStatus({
          pending: false,
          synced: true,
          notified: true,
        });
      }
    });

    return unsubscribe;
  }, [operationId]);

  return status;
}

// ===== RECENT OPERATIONS HOOK =====

/**
 * Hook for viewing recent operations
 */
export function useRecentOperations(entityType?: EntityType, limit: number = 10) {
  const [operations, setOperations] = useState<DataFlowOperation[]>([]);

  useEffect(() => {
    const unsubscribe = dataFlowManager.on(entityType || '*', (operation) => {
      setOperations(prev => [operation, ...prev].slice(0, limit));
    });

    return unsubscribe;
  }, [entityType, limit]);

  return operations;
}
