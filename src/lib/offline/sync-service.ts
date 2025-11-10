/**
 * Sync Service
 * 
 * Schema-aware synchronization service with data integrity, conflict resolution,
 * priority-based syncing, and robust error handling.
 */

import { ref, get, set, update, remove } from 'firebase/database';
import { rtdb } from '../../firebase';
import { indexedDBManager } from './indexeddb-manager';
import {
  transformFromFirebase,
  transformToFirebase,
  validateCollectionData,
  batchTransformFromFirebase,
  batchTransformToFirebase,
} from './data-transformer';

// ===== TYPES =====

export type SyncPriority = 'high' | 'medium' | 'low';
export type ConflictStrategy = 'last-write-wins' | 'local-wins' | 'remote-wins' | 'manual-review';

export interface SyncOperation {
  id: string;
  collectionName: string;
  itemId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  priority: SyncPriority;
  timestamp: number;
  retryCount: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  conflicts: number;
  errors: SyncError[];
}

export interface SyncError {
  collectionName: string;
  itemId: string;
  operation: string;
  error: string;
  timestamp: number;
}

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

export interface SyncConfig {
  conflictStrategy: ConflictStrategy;
  maxRetries: number;
  retryDelay: number; // milliseconds
  batchSize: number;
  validateSchema: boolean;
  logConflicts: boolean;
}

// ===== PRIORITY CONFIGURATION =====

const COLLECTION_PRIORITIES: Record<string, SyncPriority> = {
  // High priority - Critical data
  attendance: 'high',
  assessments: 'high',
  studentBalances: 'high',
  invoices: 'high',
  
  // Medium priority - Important updates
  students: 'medium',
  teachers: 'medium',
  classes: 'medium',
  applications: 'medium',
  schoolFees: 'medium',
  canteenCollections: 'medium',
  promotionRequests: 'medium',
  
  // Low priority - Reference data
  academicYears: 'low',
  terms: 'low',
  subjects: 'low',
  studentDocuments: 'low',
  reports: 'low',
  reportStats: 'low',
};

// ===== SYNC SERVICE CLASS =====

export class SyncService {
  private config: SyncConfig;
  private syncQueue: SyncOperation[] = [];
  private conflictLog: ConflictRecord[] = [];
  private errorLog: SyncError[] = [];
  private isSyncing = false;

  constructor(config: Partial<SyncConfig> = {}) {
    this.config = {
      conflictStrategy: 'last-write-wins',
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 50,
      validateSchema: true,
      logConflicts: true,
      ...config,
    };
  }

  // ===== MAIN SYNC OPERATIONS =====

  /**
   * Sync all pending changes to Firebase
   */
  async syncToFirebase(): Promise<SyncResult> {
    if (this.isSyncing) {
      throw new Error('Sync already in progress');
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      // Build sync queue with priorities
      await this.buildSyncQueue();

      // Process queue by priority
      await this.processSyncQueue(result);

      console.log('Sync to Firebase completed:', result);
    } catch (error) {
      console.error('Sync to Firebase failed:', error);
      result.success = false;
      result.errors.push({
        collectionName: 'system',
        itemId: 'sync',
        operation: 'syncToFirebase',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sync all data from Firebase to IndexedDB
   */
  async syncFromFirebase(collections?: string[]): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: [],
    };

    const collectionsToSync = collections || Object.keys(COLLECTION_PRIORITIES);

    try {
      for (const collectionName of collectionsToSync) {
        try {
          await this.syncCollectionFromFirebase(collectionName, result);
        } catch (error) {
          console.error(`Error syncing ${collectionName} from Firebase:`, error);
          result.failed++;
          result.errors.push({
            collectionName,
            itemId: 'collection',
            operation: 'syncFromFirebase',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: Date.now(),
          });
        }
      }

      console.log('Sync from Firebase completed:', result);
    } catch (error) {
      console.error('Sync from Firebase failed:', error);
      result.success = false;
    }

    return result;
  }

  /**
   * Bidirectional sync - push then pull
   */
  async bidirectionalSync(): Promise<{ push: SyncResult; pull: SyncResult }> {
    console.log('Starting bidirectional sync...');
    
    // First push local changes
    const pushResult = await this.syncToFirebase();
    
    // Then pull remote changes
    const pullResult = await this.syncFromFirebase();
    
    return { push: pushResult, pull: pullResult };
  }

  // ===== SYNC QUEUE MANAGEMENT =====

  /**
   * Build sync queue from pending items
   */
  private async buildSyncQueue(): Promise<void> {
    this.syncQueue = [];

    for (const [collectionName, priority] of Object.entries(COLLECTION_PRIORITIES)) {
      try {
        const pendingItems = await indexedDBManager.queryByIndex<any>(
          collectionName,
          'syncStatus',
          'pending'
        );

        for (const item of pendingItems) {
          this.syncQueue.push({
            id: `${collectionName}-${item.id}`,
            collectionName,
            itemId: item.id,
            operation: this.determineOperation(item),
            data: item,
            priority,
            timestamp: item.localUpdatedAt || Date.now(),
            retryCount: 0,
          });
        }
      } catch (error) {
        console.error(`Error building queue for ${collectionName}:`, error);
      }
    }

    // Sort by priority and timestamp
    this.syncQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp; // FIFO within same priority
    });

    console.log(`Sync queue built: ${this.syncQueue.length} items`);
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(result: SyncResult): Promise<void> {
    const batches = this.createBatches(this.syncQueue, this.config.batchSize);

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (operation) => {
          try {
            await this.processSyncOperation(operation);
            result.synced++;
          } catch (error) {
            result.failed++;
            result.errors.push({
              collectionName: operation.collectionName,
              itemId: operation.itemId,
              operation: operation.operation,
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: Date.now(),
            });

            // Handle retry logic
            if (operation.retryCount < this.config.maxRetries) {
              await this.scheduleRetry(operation);
            } else {
              await this.markAsFailed(operation, error);
            }
          }
        })
      );
    }
  }

  /**
   * Process single sync operation
   */
  private async processSyncOperation(operation: SyncOperation): Promise<void> {
    const { collectionName, itemId, data } = operation;

    // Validate schema
    if (this.config.validateSchema) {
      const validation = validateCollectionData(collectionName, data);
      if (!validation.valid) {
        throw new Error(`Schema validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Check for conflicts
    const hasConflict = await this.checkForConflict(collectionName, itemId, data);
    if (hasConflict) {
      const resolved = await this.resolveConflict(collectionName, itemId, data);
      if (!resolved) {
        throw new Error('Conflict resolution failed');
      }
    }

    // Transform data to Firebase format
    const firebaseData = transformToFirebase(data, { preserveNull: true });

    // Push to Firebase
    await this.pushToFirebase(collectionName, itemId, firebaseData, operation.operation);

    // Mark as synced in IndexedDB
    await this.markAsSynced(collectionName, itemId);
  }

  // ===== FIREBASE OPERATIONS =====

  /**
   * Push data to Firebase
   */
  private async pushToFirebase(
    collectionName: string,
    itemId: string,
    data: any,
    operation: 'create' | 'update' | 'delete'
  ): Promise<void> {
    const firebaseRef = ref(rtdb, `${collectionName}/${itemId}`);

    switch (operation) {
      case 'create':
      case 'update':
        await set(firebaseRef, data);
        break;
      case 'delete':
        await remove(firebaseRef);
        break;
    }
  }

  /**
   * Sync collection from Firebase
   */
  private async syncCollectionFromFirebase(
    collectionName: string,
    result: SyncResult
  ): Promise<void> {
    const firebaseRef = ref(rtdb, collectionName);
    const snapshot = await get(firebaseRef);

    if (!snapshot.exists()) {
      console.log(`No data in Firebase for ${collectionName}`);
      return;
    }

    const firebaseData = snapshot.val();
    const items = Object.keys(firebaseData).map(key => ({
      id: key,
      ...firebaseData[key],
    }));

    // Transform from Firebase format
    const transformedItems = batchTransformFromFirebase(items) as any[];

    // Merge with local data
    for (const item of transformedItems) {
      try {
        await this.mergeWithLocal(collectionName, item, result);
        result.synced++;
      } catch (error) {
        console.error(`Error merging ${collectionName}/${(item as any).id}:`, error);
        result.failed++;
      }
    }
  }

  /**
   * Merge remote data with local data
   */
  private async mergeWithLocal(
    collectionName: string,
    remoteItem: any,
    result: SyncResult
  ): Promise<void> {
    const localItem = await indexedDBManager.getFromStore(collectionName, remoteItem.id);

    // If no local item, just save remote
    if (!localItem) {
      await indexedDBManager.putInStore(collectionName, {
        ...remoteItem,
        syncStatus: 'synced',
        localUpdatedAt: Date.now(),
        lastSyncedAt: Date.now(),
      });
      return;
    }

    // If local item has pending changes, don't overwrite
    if ((localItem as any).syncStatus === 'pending') {
      console.log(`Skipping merge for ${collectionName}/${remoteItem.id} - has pending changes`);
      return;
    }

    // Check for conflicts
    const hasConflict = this.detectConflict(localItem, remoteItem);
    if (hasConflict) {
      result.conflicts++;
      const resolved = await this.resolveConflict(collectionName, remoteItem.id, remoteItem, localItem);
      if (!resolved) {
        console.warn(`Conflict not resolved for ${collectionName}/${remoteItem.id}`);
      }
      return;
    }

    // No conflict, update with remote data
    await indexedDBManager.putInStore(collectionName, {
      ...remoteItem,
      syncStatus: 'synced',
      localUpdatedAt: Date.now(),
      lastSyncedAt: Date.now(),
    });
  }

  // ===== CONFLICT RESOLUTION =====

  /**
   * Check if item has conflict with Firebase
   */
  private async checkForConflict(
    collectionName: string,
    itemId: string,
    localData: any
  ): Promise<boolean> {
    try {
      const firebaseRef = ref(rtdb, `${collectionName}/${itemId}`);
      const snapshot = await get(firebaseRef);

      if (!snapshot.exists()) {
        return false; // No remote data, no conflict
      }

      const remoteData = snapshot.val();
      return this.detectConflict(localData, remoteData);
    } catch (error) {
      console.error('Error checking for conflict:', error);
      return false;
    }
  }

  /**
   * Detect if there's a conflict between local and remote data
   */
  private detectConflict(localData: any, remoteData: any): boolean {
    const localTimestamp = new Date(localData.updatedAt).getTime();
    const remoteTimestamp = new Date(remoteData.updatedAt).getTime();

    // If timestamps are very close (within 1 second), no conflict
    if (Math.abs(localTimestamp - remoteTimestamp) < 1000) {
      return false;
    }

    // If remote is newer and local has been modified, it's a conflict
    if (remoteTimestamp > localTimestamp && localData.syncStatus === 'pending') {
      return true;
    }

    return false;
  }

  /**
   * Resolve conflict between local and remote data
   */
  private async resolveConflict(
    collectionName: string,
    itemId: string,
    remoteData: any,
    localData?: any
  ): Promise<boolean> {
    if (!localData) {
      localData = await indexedDBManager.getFromStore(collectionName, itemId);
    }

    if (!localData) {
      return true; // No local data, use remote
    }

    const conflict: ConflictRecord = {
      collectionName,
      itemId,
      localData,
      remoteData,
      localTimestamp: new Date(localData.updatedAt).getTime(),
      remoteTimestamp: new Date(remoteData.updatedAt).getTime(),
      timestamp: Date.now(),
    };

    // Log conflict
    if (this.config.logConflicts) {
      this.conflictLog.push(conflict);
      console.warn('Conflict detected:', conflict);
    }

    // Apply resolution strategy
    let resolvedData: any;
    let resolution: 'local' | 'remote' | 'merged' | 'pending';

    switch (this.config.conflictStrategy) {
      case 'last-write-wins':
        if (conflict.localTimestamp > conflict.remoteTimestamp) {
          resolvedData = localData;
          resolution = 'local';
        } else {
          resolvedData = remoteData;
          resolution = 'remote';
        }
        break;

      case 'local-wins':
        resolvedData = localData;
        resolution = 'local';
        break;

      case 'remote-wins':
        resolvedData = remoteData;
        resolution = 'remote';
        break;

      case 'manual-review':
        // Flag for manual review
        await this.flagForManualReview(conflict);
        resolution = 'pending';
        return false;
    }

    // Special handling for critical data
    if (this.isCriticalData(collectionName)) {
      resolvedData = await this.resolveCriticalDataConflict(conflict);
      resolution = 'merged';
    }

    // Save resolved data
    conflict.resolvedData = resolvedData;
    conflict.resolution = resolution;

    await indexedDBManager.putInStore(collectionName, {
      ...resolvedData,
      syncStatus: 'synced',
      localUpdatedAt: Date.now(),
      lastSyncedAt: Date.now(),
    });

    return true;
  }

  /**
   * Check if collection contains critical data
   */
  private isCriticalData(collectionName: string): boolean {
    return ['attendance', 'assessments', 'studentBalances', 'invoices'].includes(collectionName);
  }

  /**
   * Resolve conflict for critical data (special handling)
   */
  private async resolveCriticalDataConflict(conflict: ConflictRecord): Promise<any> {
    const { collectionName, localData, remoteData } = conflict;

    // For attendance: merge entries, prefer local for same student
    if (collectionName === 'attendance') {
      const mergedEntries = new Map();
      
      // Add remote entries
      remoteData.entries?.forEach((entry: any) => {
        mergedEntries.set(entry.studentId, entry);
      });
      
      // Override with local entries (local wins for attendance)
      localData.entries?.forEach((entry: any) => {
        mergedEntries.set(entry.studentId, entry);
      });

      return {
        ...remoteData,
        entries: Array.from(mergedEntries.values()),
        updatedAt: new Date().toISOString(),
      };
    }

    // For assessments and balances: use latest timestamp
    if (collectionName === 'assessments' || collectionName === 'studentBalances') {
      return conflict.localTimestamp > conflict.remoteTimestamp ? localData : remoteData;
    }

    // Default: use latest
    return conflict.localTimestamp > conflict.remoteTimestamp ? localData : remoteData;
  }

  /**
   * Flag conflict for manual review
   */
  private async flagForManualReview(conflict: ConflictRecord): Promise<void> {
    // Store conflict in a special collection for admin review
    const conflictId = `${conflict.collectionName}-${conflict.itemId}-${Date.now()}`;
    await indexedDBManager.putInStore('conflicts', {
      id: conflictId,
      ...conflict,
    });
    
    console.warn('Conflict flagged for manual review:', conflictId);
  }

  // ===== ERROR HANDLING =====

  /**
   * Mark item as failed
   */
  private async markAsFailed(operation: SyncOperation, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    this.errorLog.push({
      collectionName: operation.collectionName,
      itemId: operation.itemId,
      operation: operation.operation,
      error: errorMessage,
      timestamp: Date.now(),
    });

    // Update item in IndexedDB
    const item = await indexedDBManager.getFromStore<any>(operation.collectionName, operation.itemId);
    if (item) {
      await indexedDBManager.putInStore(operation.collectionName, {
        ...item,
        syncStatus: 'failed',
        syncError: errorMessage,
        syncErrorTimestamp: Date.now(),
      });
    }
  }

  /**
   * Schedule retry for failed operation
   */
  private async scheduleRetry(operation: SyncOperation): Promise<void> {
    operation.retryCount++;
    const delay = this.config.retryDelay * Math.pow(2, operation.retryCount - 1); // Exponential backoff

    console.log(`Scheduling retry ${operation.retryCount} for ${operation.id} in ${delay}ms`);

    setTimeout(async () => {
      try {
        await this.processSyncOperation(operation);
      } catch (error) {
        if (operation.retryCount < this.config.maxRetries) {
          await this.scheduleRetry(operation);
        } else {
          await this.markAsFailed(operation, error);
        }
      }
    }, delay);
  }

  // ===== UTILITY METHODS =====

  /**
   * Determine operation type for item
   */
  private determineOperation(item: any): 'create' | 'update' | 'delete' {
    if (item._deleted) return 'delete';
    if (item.createdAt === item.updatedAt) return 'create';
    return 'update';
  }

  /**
   * Mark item as synced
   */
  private async markAsSynced(collectionName: string, itemId: string): Promise<void> {
    const item = await indexedDBManager.getFromStore<any>(collectionName, itemId);
    if (item) {
      await indexedDBManager.putInStore(collectionName, {
        ...item,
        syncStatus: 'synced',
        lastSyncedAt: Date.now(),
      });
    }
  }

  /**
   * Create batches from array
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Get conflict log
   */
  getConflictLog(): ConflictRecord[] {
    return [...this.conflictLog];
  }

  /**
   * Get error log
   */
  getErrorLog(): SyncError[] {
    return [...this.errorLog];
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.conflictLog = [];
    this.errorLog = [];
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(): Promise<{
    pendingCount: number;
    failedCount: number;
    syncedCount: number;
    conflictCount: number;
    byCollection: Record<string, { pending: number; failed: number; synced: number }>;
  }> {
    const stats = {
      pendingCount: 0,
      failedCount: 0,
      syncedCount: 0,
      conflictCount: this.conflictLog.length,
      byCollection: {} as Record<string, { pending: number; failed: number; synced: number }>,
    };

    for (const collectionName of Object.keys(COLLECTION_PRIORITIES)) {
      const pending = await indexedDBManager.queryByIndex(collectionName, 'syncStatus', 'pending');
      const failed = await indexedDBManager.queryByIndex(collectionName, 'syncStatus', 'failed');
      const synced = await indexedDBManager.queryByIndex(collectionName, 'syncStatus', 'synced');

      stats.pendingCount += pending.length;
      stats.failedCount += failed.length;
      stats.syncedCount += synced.length;

      stats.byCollection[collectionName] = {
        pending: pending.length,
        failed: failed.length,
        synced: synced.length,
      };
    }

    return stats;
  }
}

// Export singleton instance
export const syncService = new SyncService();
