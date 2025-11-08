/**
 * Sync Hooks
 * 
 * React hooks for monitoring and controlling sync operations
 */

import { useState, useEffect, useCallback } from 'react';
import { syncService, type SyncResult } from './sync-service';
import { syncManager } from './sync-manager';

// ===== SYNC STATISTICS HOOK =====

export interface SyncStatistics {
  pendingCount: number;
  failedCount: number;
  syncedCount: number;
  conflictCount: number;
  byCollection: Record<string, { pending: number; failed: number; synced: number }>;
}

/**
 * Hook for sync statistics
 */
export function useSyncStatistics() {
  const [stats, setStats] = useState<SyncStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const statistics = await syncService.getSyncStatistics();
      setStats(statistics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load statistics'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Refresh on sync complete
    const unsubscribe = syncManager.on('sync-complete', () => {
      refresh();
    });

    return unsubscribe;
  }, [refresh]);

  return { stats, loading, error, refresh };
}

// ===== CONFLICT LOG HOOK =====

export interface ConflictRecord {
  collectionName: string;
  itemId: string;
  localData: any;
  remoteData: any;
  localTimestamp: number;
  remoteTimestamp: number;
  resolvedData?: any;
  resolution?: 'local' | 'remote' | 'merged' | 'pending';
  timestamp: number;
}

/**
 * Hook for conflict log
 */
export function useConflictLog() {
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);

  useEffect(() => {
    const updateConflicts = () => {
      setConflicts(syncService.getConflictLog());
    };

    updateConflicts();

    // Update on sync complete
    const unsubscribe = syncManager.on('sync-complete', updateConflicts);

    return unsubscribe;
  }, []);

  const clearConflicts = useCallback(() => {
    syncService.clearLogs();
    setConflicts([]);
  }, []);

  return { conflicts, clearConflicts };
}

// ===== ERROR LOG HOOK =====

export interface SyncError {
  collectionName: string;
  itemId: string;
  operation: string;
  error: string;
  timestamp: number;
}

/**
 * Hook for error log
 */
export function useErrorLog() {
  const [errors, setErrors] = useState<SyncError[]>([]);

  useEffect(() => {
    const updateErrors = () => {
      setErrors(syncService.getErrorLog());
    };

    updateErrors();

    // Update on sync error
    const unsubscribe = syncManager.on('sync-error', updateErrors);

    return unsubscribe;
  }, []);

  const clearErrors = useCallback(() => {
    syncService.clearLogs();
    setErrors([]);
  }, []);

  return { errors, clearErrors };
}

// ===== MANUAL SYNC HOOK =====

/**
 * Hook for manual sync control
 */
export function useManualSync() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<{ push: SyncResult; pull: SyncResult } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const sync = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      const syncResult = await syncService.bidirectionalSync();
      setResult(syncResult);
      return syncResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sync failed');
      setError(error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, []);

  const syncToFirebase = useCallback(async () => {
    try {
      setSyncing(true);
      setError(null);
      const syncResult = await syncService.syncToFirebase();
      return syncResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sync to Firebase failed');
      setError(error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, []);

  const syncFromFirebase = useCallback(async (collections?: string[]) => {
    try {
      setSyncing(true);
      setError(null);
      const syncResult = await syncService.syncFromFirebase(collections);
      return syncResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Sync from Firebase failed');
      setError(error);
      throw error;
    } finally {
      setSyncing(false);
    }
  }, []);

  return {
    syncing,
    result,
    error,
    sync,
    syncToFirebase,
    syncFromFirebase,
  };
}

// ===== COLLECTION SYNC STATUS HOOK =====

/**
 * Hook for monitoring specific collection sync status
 */
export function useCollectionSyncStatus(collectionName: string) {
  const [status, setStatus] = useState({
    pending: 0,
    failed: 0,
    synced: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateStatus = async () => {
      try {
        setLoading(true);
        const stats = await syncService.getSyncStatistics();
        setStatus(stats.byCollection[collectionName] || { pending: 0, failed: 0, synced: 0 });
      } catch (error) {
        console.error('Error loading collection sync status:', error);
      } finally {
        setLoading(false);
      }
    };

    updateStatus();

    // Update on sync complete
    const unsubscribe = syncManager.on('sync-complete', updateStatus);

    return unsubscribe;
  }, [collectionName]);

  return { status, loading };
}

// ===== PENDING ITEMS HOOK =====

/**
 * Hook for monitoring pending items count
 */
export function usePendingItemsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateCount = async () => {
      try {
        setLoading(true);
        const stats = await syncService.getSyncStatistics();
        setCount(stats.pendingCount);
      } catch (error) {
        console.error('Error loading pending items count:', error);
      } finally {
        setLoading(false);
      }
    };

    updateCount();

    // Update on sync events
    const unsubscribeComplete = syncManager.on('sync-complete', updateCount);
    const unsubscribeError = syncManager.on('sync-error', updateCount);

    return () => {
      unsubscribeComplete();
      unsubscribeError();
    };
  }, []);

  return { count, loading };
}

// ===== FAILED ITEMS HOOK =====

/**
 * Hook for monitoring failed items count
 */
export function useFailedItemsCount() {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateCount = async () => {
      try {
        setLoading(true);
        const stats = await syncService.getSyncStatistics();
        setCount(stats.failedCount);
      } catch (error) {
        console.error('Error loading failed items count:', error);
      } finally {
        setLoading(false);
      }
    };

    updateCount();

    // Update on sync events
    const unsubscribeComplete = syncManager.on('sync-complete', updateCount);
    const unsubscribeError = syncManager.on('sync-error', updateCount);

    return () => {
      unsubscribeComplete();
      unsubscribeError();
    };
  }, []);

  return { count, loading };
}
