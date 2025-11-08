/**
 * Sync Manager
 * 
 * Handles bidirectional synchronization between IndexedDB and Firebase.
 * - Pulls data from Firebase to IndexedDB when online
 * - Pushes pending changes from IndexedDB to Firebase when online
 * - Monitors online/offline status
 * - Handles conflict resolution
 */

import { ref, onValue, set, update, remove, get } from 'firebase/database';
import { rtdb } from '../../firebase';
import { indexedDBManager } from './indexeddb-manager';
import { markAsSynced, markAsFailed, getPendingSyncItems } from './indexeddb-operations-extended';
import { syncService, type SyncResult } from './sync-service';

// ===== TYPES =====

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // milliseconds
  conflictResolution: 'local' | 'remote' | 'latest';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingChanges: number;
  failedChanges: number;
  error: string | null;
}

export type SyncEventType = 'sync-start' | 'sync-complete' | 'sync-error' | 'online' | 'offline';

export interface SyncEvent {
  type: SyncEventType;
  timestamp: number;
  data?: any;
}

// ===== SYNC MANAGER CLASS =====

class SyncManager {
  private config: SyncConfig = {
    autoSync: true,
    syncInterval: 30000, // 30 seconds
    conflictResolution: 'latest',
  };

  private status: SyncStatus = {
    isOnline: navigator.onLine,
    isSyncing: false,
    lastSyncTime: null,
    pendingChanges: 0,
    failedChanges: 0,
    error: null,
  };

  private syncIntervalId: number | null = null;
  private listeners: Map<string, Set<(event: SyncEvent) => void>> = new Map();
  private firebaseUnsubscribers: Map<string, () => void> = new Map();

  constructor() {
    this.setupOnlineListener();
  }

  // ===== CONFIGURATION =====

  configure(config: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.config.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }

  getConfig(): SyncConfig {
    return { ...this.config };
  }

  // ===== STATUS =====

  getStatus(): SyncStatus {
    return { ...this.status };
  }

  isOnline(): boolean {
    return this.status.isOnline;
  }

  // ===== EVENT LISTENERS =====

  on(eventType: SyncEventType, callback: (event: SyncEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback);
    };
  }

  private emit(event: SyncEvent): void {
    const callbacks = this.listeners.get(event.type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
  }

  // ===== ONLINE/OFFLINE DETECTION =====

  private setupOnlineListener(): void {
    window.addEventListener('online', () => {
      console.log('Network status: ONLINE');
      this.status.isOnline = true;
      this.emit({ type: 'online', timestamp: Date.now() });
      
      if (this.config.autoSync) {
        this.syncAll();
      }
    });

    window.addEventListener('offline', () => {
      console.log('Network status: OFFLINE');
      this.status.isOnline = false;
      this.emit({ type: 'offline', timestamp: Date.now() });
    });
  }

  // ===== AUTO SYNC =====

  startAutoSync(): void {
    if (this.syncIntervalId !== null) {
      return; // Already running
    }

    console.log(`Starting auto-sync with interval: ${this.config.syncInterval}ms`);
    
    // Initial sync
    if (this.status.isOnline) {
      this.syncAll();
    }

    // Periodic sync
    this.syncIntervalId = window.setInterval(() => {
      if (this.status.isOnline && !this.status.isSyncing) {
        this.syncAll();
      }
    }, this.config.syncInterval);
  }

  stopAutoSync(): void {
    if (this.syncIntervalId !== null) {
      console.log('Stopping auto-sync');
      window.clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  // ===== SYNC OPERATIONS =====

  /**
   * Sync all collections bidirectionally
   */
  async syncAll(): Promise<void> {
    if (!this.status.isOnline) {
      console.warn('Cannot sync: offline');
      return;
    }

    if (this.status.isSyncing) {
      console.warn('Sync already in progress');
      return;
    }

    this.status.isSyncing = true;
    this.status.error = null;
    this.emit({ type: 'sync-start', timestamp: Date.now() });

    try {
      // Use the new SyncService for schema-aware bidirectional sync
      const result = await syncService.bidirectionalSync();
      
      // Update status with results
      this.status.pendingChanges = result.push.failed + result.pull.failed;
      this.status.failedChanges = result.push.failed + result.pull.failed;
      
      this.status.lastSyncTime = Date.now();
      this.emit({ type: 'sync-complete', timestamp: Date.now(), data: result });
      
      console.log('Sync completed successfully:', result);
    } catch (error) {
      console.error('Sync error:', error);
      this.status.error = error instanceof Error ? error.message : 'Unknown sync error';
      this.emit({ 
        type: 'sync-error', 
        timestamp: Date.now(), 
        data: { error: this.status.error } 
      });
    } finally {
      this.status.isSyncing = false;
    }
  }

  /**
   * Push pending local changes to Firebase
   */
  private async pushPendingChanges(): Promise<void> {
    const stores = [
      'academicYears', 'terms', 'students', 'teachers', 'subjects', 'classes',
      'applications', 'assessments', 'attendance', 'schoolFees', 'studentBalances',
      'invoices', 'studentDocuments', 'canteenCollections', 'promotionRequests', 'reports'
    ];

    let totalPending = 0;
    let totalFailed = 0;

    for (const storeName of stores) {
      try {
        const pendingItems = await getPendingSyncItems(storeName);
        totalPending += pendingItems.length;

        for (const item of pendingItems) {
          try {
            await this.pushItemToFirebase(storeName, item);
            await markAsSynced(storeName, item.id);
          } catch (error) {
            console.error(`Failed to push ${storeName}/${item.id}:`, error);
            await markAsFailed(storeName, item.id);
            totalFailed++;
          }
        }
      } catch (error) {
        console.error(`Error processing pending items for ${storeName}:`, error);
      }
    }

    this.status.pendingChanges = totalPending;
    this.status.failedChanges = totalFailed;
    
    console.log(`Pushed ${totalPending} pending changes, ${totalFailed} failed`);
  }

  /**
   * Push a single item to Firebase
   */
  private async pushItemToFirebase(storeName: string, item: any): Promise<void> {
    const firebasePath = `${storeName}/${item.id}`;
    const firebaseRef = ref(rtdb, firebasePath);

    // Remove sync metadata before pushing to Firebase
    const { syncStatus, localUpdatedAt, lastSyncedAt, ...firebaseData } = item;

    await set(firebaseRef, firebaseData);
  }

  /**
   * Pull all data from Firebase to IndexedDB
   */
  private async pullFromFirebase(): Promise<void> {
    const stores = [
      'academicYears', 'terms', 'students', 'teachers', 'subjects', 'classes',
      'applications', 'assessments', 'attendance', 'schoolFees', 'studentBalances',
      'invoices', 'studentDocuments', 'canteenCollections', 'promotionRequests', 'reports'
    ];

    for (const storeName of stores) {
      try {
        await this.pullStoreFromFirebase(storeName);
      } catch (error) {
        console.error(`Error pulling ${storeName} from Firebase:`, error);
      }
    }
  }

  /**
   * Pull a single store from Firebase
   */
  private async pullStoreFromFirebase(storeName: string): Promise<void> {
    const firebaseRef = ref(rtdb, storeName);
    const snapshot = await get(firebaseRef);

    if (!snapshot.exists()) {
      console.log(`No data in Firebase for ${storeName}`);
      return;
    }

    const firebaseData = snapshot.val();
    const items = Object.keys(firebaseData).map(key => ({
      id: key,
      ...firebaseData[key],
      // Add sync metadata
      syncStatus: 'synced' as const,
      localUpdatedAt: Date.now(),
      lastSyncedAt: Date.now(),
    }));

    // Batch update IndexedDB
    await indexedDBManager.batchPut(storeName, items);
    
    console.log(`Pulled ${items.length} items from Firebase to ${storeName}`);
  }

  /**
   * Subscribe to real-time updates from Firebase for a specific store
   */
  subscribeToFirebaseUpdates(storeName: string): void {
    if (this.firebaseUnsubscribers.has(storeName)) {
      console.warn(`Already subscribed to ${storeName}`);
      return;
    }

    const firebaseRef = ref(rtdb, storeName);
    
    const unsubscribe = onValue(firebaseRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const firebaseData = snapshot.val();
      const items = Object.keys(firebaseData).map(key => ({
        id: key,
        ...firebaseData[key],
        syncStatus: 'synced' as const,
        localUpdatedAt: Date.now(),
        lastSyncedAt: Date.now(),
      }));

      // Update IndexedDB with latest data
      indexedDBManager.batchPut(storeName, items).catch(error => {
        console.error(`Error updating ${storeName} from Firebase realtime:`, error);
      });
    });

    this.firebaseUnsubscribers.set(storeName, unsubscribe);
    console.log(`Subscribed to Firebase updates for ${storeName}`);
  }

  /**
   * Unsubscribe from Firebase updates for a specific store
   */
  unsubscribeFromFirebaseUpdates(storeName: string): void {
    const unsubscribe = this.firebaseUnsubscribers.get(storeName);
    if (unsubscribe) {
      unsubscribe();
      this.firebaseUnsubscribers.delete(storeName);
      console.log(`Unsubscribed from Firebase updates for ${storeName}`);
    }
  }

  /**
   * Subscribe to all Firebase updates
   */
  subscribeToAllFirebaseUpdates(): void {
    const stores = [
      'academicYears', 'terms', 'students', 'teachers', 'subjects', 'classes',
      'applications', 'assessments', 'attendance', 'schoolFees', 'studentBalances',
      'invoices', 'studentDocuments', 'canteenCollections', 'promotionRequests', 'reports'
    ];

    stores.forEach(store => this.subscribeToFirebaseUpdates(store));
  }

  /**
   * Unsubscribe from all Firebase updates
   */
  unsubscribeFromAllFirebaseUpdates(): void {
    this.firebaseUnsubscribers.forEach((unsubscribe, storeName) => {
      unsubscribe();
      console.log(`Unsubscribed from ${storeName}`);
    });
    this.firebaseUnsubscribers.clear();
  }

  // ===== CONFLICT RESOLUTION =====

  /**
   * Resolve conflicts between local and remote data
   */
  private async resolveConflict(storeName: string, localItem: any, remoteItem: any): Promise<any> {
    switch (this.config.conflictResolution) {
      case 'local':
        return localItem;
      
      case 'remote':
        return remoteItem;
      
      case 'latest':
      default:
        const localTime = new Date(localItem.updatedAt).getTime();
        const remoteTime = new Date(remoteItem.updatedAt).getTime();
        return localTime > remoteTime ? localItem : remoteItem;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Force sync a specific collection
   */
  async syncCollection(storeName: string): Promise<void> {
    if (!this.status.isOnline) {
      throw new Error('Cannot sync: offline');
    }

    console.log(`Syncing collection: ${storeName}`);
    
    // Push pending changes
    const pendingItems = await getPendingSyncItems(storeName);
    for (const item of pendingItems) {
      try {
        await this.pushItemToFirebase(storeName, item);
        await markAsSynced(storeName, item.id);
      } catch (error) {
        console.error(`Failed to push ${storeName}/${item.id}:`, error);
        await markAsFailed(storeName, item.id);
      }
    }

    // Pull latest data
    await this.pullStoreFromFirebase(storeName);
  }

  /**
   * Clear all local data (use with caution!)
   */
  async clearAllLocalData(): Promise<void> {
    await indexedDBManager.deleteDatabase();
    console.log('All local data cleared');
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<any> {
    return indexedDBManager.getStats();
  }

  /**
   * Cleanup and shutdown
   */
  shutdown(): void {
    this.stopAutoSync();
    this.unsubscribeFromAllFirebaseUpdates();
    this.listeners.clear();
    console.log('Sync manager shut down');
  }
}

// Export singleton instance
export const syncManager = new SyncManager();

// Export class for testing
export { SyncManager };
