/**
 * Offline Context
 * 
 * Provides offline-first functionality throughout the application.
 * Initializes IndexedDB and manages sync operations.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { indexedDBManager, syncManager, type SyncStatus } from '../lib/offline';

interface OfflineContextValue {
  isInitialized: boolean;
  isOnline: boolean;
  syncStatus: SyncStatus;
  initError: Error | null;
  syncNow: () => Promise<void>;
  clearLocalData: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
  autoSync?: boolean;
  syncInterval?: number;
}

export function OfflineProvider({ 
  children, 
  autoSync = true,
  syncInterval = 30000 
}: OfflineProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus());
  const [initError, setInitError] = useState<Error | null>(null);

  // Initialize IndexedDB and sync manager
  useEffect(() => {
    const initialize = async () => {
      try {
        console.log('Initializing offline-first functionality...');
        
        // Initialize IndexedDB
        await indexedDBManager.init();
        console.log('IndexedDB initialized');

        // Configure sync manager
        syncManager.configure({
          autoSync,
          syncInterval,
          conflictResolution: 'latest',
        });

        // Subscribe to all Firebase updates for real-time sync
        if (navigator.onLine) {
          syncManager.subscribeToAllFirebaseUpdates();
        }

        // Start auto-sync if enabled
        if (autoSync) {
          syncManager.startAutoSync();
        }

        setIsInitialized(true);
        console.log('Offline-first functionality initialized successfully');
      } catch (error) {
        console.error('Failed to initialize offline functionality:', error);
        setInitError(error instanceof Error ? error : new Error('Unknown initialization error'));
      }
    };

    initialize();

    // Cleanup on unmount
    return () => {
      syncManager.shutdown();
      indexedDBManager.close();
    };
  }, [autoSync, syncInterval]);

  // Listen for sync status changes
  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(syncManager.getStatus());
    };

    const unsubscribeStart = syncManager.on('sync-start', updateSyncStatus);
    const unsubscribeComplete = syncManager.on('sync-complete', updateSyncStatus);
    const unsubscribeError = syncManager.on('sync-error', updateSyncStatus);

    return () => {
      unsubscribeStart();
      unsubscribeComplete();
      unsubscribeError();
    };
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const unsubscribeOnline = syncManager.on('online', () => {
      setIsOnline(true);
      // Subscribe to Firebase updates when coming online
      syncManager.subscribeToAllFirebaseUpdates();
    });

    const unsubscribeOffline = syncManager.on('offline', () => {
      setIsOnline(false);
      // Unsubscribe from Firebase updates when going offline
      syncManager.unsubscribeFromAllFirebaseUpdates();
    });

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, []);

  const syncNow = async () => {
    if (!isOnline) {
      throw new Error('Cannot sync: device is offline');
    }
    await syncManager.syncAll();
  };

  const clearLocalData = async () => {
    await syncManager.clearAllLocalData();
    // Reinitialize after clearing
    await indexedDBManager.init();
  };

  const value: OfflineContextValue = {
    isInitialized,
    isOnline,
    syncStatus,
    initError,
    syncNow,
    clearLocalData,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

/**
 * Hook to access offline context
 */
export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

/**
 * Hook to check if offline functionality is ready
 */
export function useOfflineReady(): boolean {
  const { isInitialized, initError } = useOffline();
  return isInitialized && !initError;
}
