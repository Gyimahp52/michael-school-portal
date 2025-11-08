/**
 * Offline Wrapper
 * 
 * Wrapper functions that maintain the same API as existing Firebase operations
 * but add offline-first capabilities. Write to IndexedDB first, then sync to Firebase.
 */

import { ref, set, update, remove, push } from 'firebase/database';
import { rtdb } from '../../firebase';
import { indexedDBManager } from './indexeddb-manager';
import { syncManager } from './sync-manager';
import { transformToFirebase } from './data-transformer';
import { generateId } from './indexeddb-operations';

// ===== HELPER FUNCTIONS =====

/**
 * Check if online
 */
function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Add sync metadata to item
 */
function withSyncMetadata<T>(item: T): T & {
  syncStatus: 'synced' | 'pending';
  localUpdatedAt: number;
  lastSyncedAt?: number;
} {
  return {
    ...item,
    syncStatus: isOnline() ? 'synced' : 'pending',
    localUpdatedAt: Date.now(),
    lastSyncedAt: isOnline() ? Date.now() : undefined,
  };
}

/**
 * Write to IndexedDB and optionally Firebase
 */
async function writeWithOfflineSupport<T>(
  collectionName: string,
  itemId: string,
  data: T,
  operation: 'create' | 'update' | 'delete'
): Promise<void> {
  // 1. Write to IndexedDB first (mark as pending if offline)
  const localData = withSyncMetadata(data);
  await indexedDBManager.putInStore(collectionName, {
    ...localData,
    id: itemId,
  });

  // 2. If online, sync to Firebase immediately
  if (isOnline()) {
    try {
      const firebaseData = transformToFirebase(data);
      const firebaseRef = ref(rtdb, `${collectionName}/${itemId}`);

      if (operation === 'delete') {
        await remove(firebaseRef);
      } else {
        await set(firebaseRef, firebaseData);
      }

      // 3. Update local status to 'synced'
      await indexedDBManager.putInStore(collectionName, {
        ...localData,
        id: itemId,
        syncStatus: 'synced',
        lastSyncedAt: Date.now(),
      });
    } catch (error) {
      console.error('Firebase write failed, will retry on sync:', error);
      // Keep as 'pending', will sync later
    }
  }
}

// ===== WRAPPED OPERATIONS =====

/**
 * Create operation with offline support
 * Maintains same API as Firebase but adds offline capabilities
 */
export async function offlineCreate<T>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();

  const fullData = {
    ...data,
    id,
    createdAt: now,
    updatedAt: now,
  } as T;

  await writeWithOfflineSupport(collectionName, id, fullData, 'create');
  return id;
}

/**
 * Update operation with offline support
 */
export async function offlineUpdate<T>(
  collectionName: string,
  itemId: string,
  updates: Partial<T>
): Promise<void> {
  // Get existing item
  const existing = await indexedDBManager.getFromStore<any>(collectionName, itemId);
  if (!existing) {
    throw new Error(`Item ${itemId} not found in ${collectionName}`);
  }

  const updated = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await writeWithOfflineSupport(collectionName, itemId, updated, 'update');
}

/**
 * Delete operation with offline support
 */
export async function offlineDelete(
  collectionName: string,
  itemId: string
): Promise<void> {
  // Mark as deleted locally
  const existing = await indexedDBManager.getFromStore<any>(collectionName, itemId);
  if (existing) {
    await writeWithOfflineSupport(
      collectionName,
      itemId,
      { ...existing, _deleted: true },
      'delete'
    );
  }

  // If online, delete from Firebase immediately
  if (isOnline()) {
    try {
      const firebaseRef = ref(rtdb, `${collectionName}/${itemId}`);
      await remove(firebaseRef);
      
      // Remove from IndexedDB after successful Firebase delete
      await indexedDBManager.deleteFromStore(collectionName, itemId);
    } catch (error) {
      console.error('Firebase delete failed:', error);
      // Keep marked as deleted, will sync later
    }
  }
}

/**
 * Read operation - always from IndexedDB
 */
export async function offlineGet<T>(
  collectionName: string,
  itemId: string
): Promise<T | undefined> {
  return indexedDBManager.getFromStore<T>(collectionName, itemId);
}

/**
 * Read all operation - always from IndexedDB
 */
export async function offlineGetAll<T>(
  collectionName: string
): Promise<T[]> {
  return indexedDBManager.getAllFromStore<T>(collectionName);
}

/**
 * Query by index - always from IndexedDB
 */
export async function offlineQuery<T>(
  collectionName: string,
  indexName: string,
  value: IDBValidKey | IDBKeyRange
): Promise<T[]> {
  return indexedDBManager.queryByIndex<T>(collectionName, indexName, value);
}

// ===== BATCH OPERATIONS =====

/**
 * Batch create with offline support
 */
export async function offlineBatchCreate<T>(
  collectionName: string,
  items: Omit<T, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<string[]> {
  const ids: string[] = [];
  const now = new Date().toISOString();

  const fullItems = items.map(item => {
    const id = generateId();
    ids.push(id);
    return withSyncMetadata({
      ...item,
      id,
      createdAt: now,
      updatedAt: now,
    });
  });

  // Write to IndexedDB
  await indexedDBManager.batchPut(collectionName, fullItems);

  // If online, sync to Firebase
  if (isOnline()) {
    try {
      for (const item of fullItems) {
        const firebaseData = transformToFirebase(item);
        const firebaseRef = ref(rtdb, `${collectionName}/${item.id}`);
        await set(firebaseRef, firebaseData);
      }

      // Update all to synced
      const syncedItems = fullItems.map(item => ({
        ...item,
        syncStatus: 'synced' as const,
        lastSyncedAt: Date.now(),
      }));
      await indexedDBManager.batchPut(collectionName, syncedItems);
    } catch (error) {
      console.error('Batch Firebase write failed:', error);
    }
  }

  return ids;
}

// ===== COMPATIBILITY LAYER =====

/**
 * Create a compatibility wrapper for existing Firebase functions
 * This allows gradual migration without breaking existing code
 */
export function createOfflineWrapper<T>(collectionName: string) {
  return {
    /**
     * Create - same API as your existing createStudent, createTeacher, etc.
     */
    create: async (data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
      return offlineCreate<T>(collectionName, data);
    },

    /**
     * Get all - same API as your existing getAllStudents, getAllTeachers, etc.
     */
    getAll: async (): Promise<T[]> => {
      return offlineGetAll<T>(collectionName);
    },

    /**
     * Get by ID
     */
    get: async (id: string): Promise<T | undefined> => {
      return offlineGet<T>(collectionName, id);
    },

    /**
     * Update - same API as your existing updateStudent, updateTeacher, etc.
     */
    update: async (id: string, updates: Partial<T>): Promise<void> => {
      return offlineUpdate<T>(collectionName, id, updates);
    },

    /**
     * Delete - same API as your existing deleteStudent, deleteTeacher, etc.
     */
    delete: async (id: string): Promise<void> => {
      return offlineDelete(collectionName, id);
    },

    /**
     * Query by field
     */
    queryBy: async (indexName: string, value: any): Promise<T[]> => {
      return offlineQuery<T>(collectionName, indexName, value);
    },

    /**
     * Subscribe (real-time updates)
     * Returns unsubscribe function
     */
    subscribe: (callback: (items: T[]) => void): (() => void) => {
      // Initial load from IndexedDB
      offlineGetAll<T>(collectionName).then(callback);

      // Listen for sync events to refresh
      const unsubscribeSync = syncManager.on('sync-complete', async () => {
        const items = await offlineGetAll<T>(collectionName);
        callback(items);
      });

      // Poll for changes (for real-time feel)
      const intervalId = setInterval(async () => {
        const items = await offlineGetAll<T>(collectionName);
        callback(items);
      }, 5000); // Every 5 seconds

      // Return unsubscribe function
      return () => {
        unsubscribeSync();
        clearInterval(intervalId);
      };
    },
  };
}

// ===== PRE-CONFIGURED WRAPPERS =====

// Import types from your existing code
import type {
  Student,
  Teacher,
  Subject,
  Class,
  Application,
  AssessmentRecord,
  AttendanceRecordDoc,
  SchoolFees,
  StudentBalance,
  Invoice,
  StudentDocument,
  CanteenCollection,
  PromotionRequest,
  AcademicYear,
  Term,
} from '../database-operations';

// Create wrappers for all collections
export const offlineStudents = createOfflineWrapper<Student>('students');
export const offlineTeachers = createOfflineWrapper<Teacher>('teachers');
export const offlineSubjects = createOfflineWrapper<Subject>('subjects');
export const offlineClasses = createOfflineWrapper<Class>('classes');
export const offlineApplications = createOfflineWrapper<Application>('applications');
export const offlineAssessments = createOfflineWrapper<AssessmentRecord>('assessments');
export const offlineAttendance = createOfflineWrapper<AttendanceRecordDoc>('attendance');
export const offlineSchoolFees = createOfflineWrapper<SchoolFees>('schoolFees');
export const offlineStudentBalances = createOfflineWrapper<StudentBalance>('studentBalances');
export const offlineInvoices = createOfflineWrapper<Invoice>('invoices');
export const offlineStudentDocuments = createOfflineWrapper<StudentDocument>('studentDocuments');
export const offlineCanteenCollections = createOfflineWrapper<CanteenCollection>('canteenCollections');
export const offlinePromotionRequests = createOfflineWrapper<PromotionRequest>('promotionRequests');
export const offlineAcademicYears = createOfflineWrapper<AcademicYear>('academicYears');
export const offlineTerms = createOfflineWrapper<Term>('terms');
