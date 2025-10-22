import { 
  ref, 
  get, 
  set, 
  push, 
  update as firebaseUpdate, 
  remove,
  onValue,
  off 
} from 'firebase/database';
import { rtdb } from '../firebase';
import { DatabaseService, db } from './database';
import { 
  User, 
  Student, 
  Attendance, 
  Assessment, 
  Fee, 
  CanteenCollection 
} from './database';

export interface SyncProgress {
  tableName: string;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  progress: number;
  total: number;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  syncedTables: string[];
  errors: { table: string; error: string }[];
  totalSynced: number;
}

export class SyncService {
  private static isOnline = navigator.onLine;
  private static syncInProgress = false;
  private static syncListeners: (() => void)[] = [];

  // Initialize sync service
  static initialize(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.syncAllTables();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });

    // Start listening for Firebase changes when online
    if (this.isOnline) {
      this.startFirebaseListeners();
    }
  }

  // Check if currently online
  static getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Add sync status listener
  static addSyncListener(callback: () => void): () => void {
    this.syncListeners.push(callback);
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  // Notify all listeners
  private static notifyListeners(): void {
    this.syncListeners.forEach(callback => callback());
  }

  // Sync all tables
  static async syncAllTables(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, syncedTables: [], errors: [], totalSynced: 0 };
    }

    this.syncInProgress = true;
    const result: SyncResult = {
      success: true,
      syncedTables: [],
      errors: [],
      totalSynced: 0
    };

    const tables = ['users', 'students', 'attendance', 'assessments', 'fees', 'canteenCollections'];

    for (const tableName of tables) {
      try {
        await this.syncTable(tableName);
        result.syncedTables.push(tableName);
        result.totalSynced++;
      } catch (error) {
        console.error(`Sync error for ${tableName}:`, error);
        result.errors.push({ 
          table: tableName, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        result.success = false;
      }
    }

    this.syncInProgress = false;
    return result;
  }

  // Sync individual table
  private static async syncTable(tableName: string): Promise<void> {
    const syncStatus = await DatabaseService.getSyncStatus(tableName);
    const lastSyncAt = syncStatus?.lastSyncAt || new Date(0);

    // Download from Firebase
    await this.downloadFromFirebase(tableName, lastSyncAt);
    
    // Upload to Firebase
    await this.uploadToFirebase(tableName, lastSyncAt);

    // Update sync status
    await DatabaseService.updateSyncStatus(tableName, new Date(), 0);
  }

  // Download data from Firebase to IndexedDB
  private static async downloadFromFirebase(tableName: string, since: Date): Promise<void> {
    const firebaseRef = ref(rtdb, tableName);
    const snapshot = await get(firebaseRef);
    
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const entries = Object.entries(data) as [string, any][];

    for (const [id, record] of entries) {
      if (!record || typeof record !== 'object') continue;
      if (!record.id) record.id = id;
      const validKey = typeof record.id === 'string' || typeof record.id === 'number' || record.id instanceof Date;
      if (!validKey) continue;

      // Convert Firebase timestamps to Date objects
      if (record.createdAt) {
        record.createdAt = new Date(record.createdAt);
      }
      if (record.updatedAt) {
        record.updatedAt = new Date(record.updatedAt);
      }
      if (record.lastSyncAt) {
        record.lastSyncAt = new Date(record.lastSyncAt);
      }
      if (record.date) {
        record.date = new Date(record.date);
      }
      if (record.dateOfBirth) {
        record.dateOfBirth = new Date(record.dateOfBirth);
      }
      if (record.admissionDate) {
        record.admissionDate = new Date(record.admissionDate);
      }
      if (record.datePaid) {
        record.datePaid = new Date(record.datePaid);
      }
      if (record.lastLogin) {
        record.lastLogin = new Date(record.lastLogin);
      }

      // Only update if Firebase record is newer
      const existingRecord = await this.getLocalRecord(tableName, record.id);
      const incomingUpdatedAt = record.updatedAt instanceof Date ? record.updatedAt : new Date(0);
      const existingUpdatedAt = existingRecord?.updatedAt instanceof Date ? existingRecord.updatedAt : new Date(0);
      if (!existingRecord || incomingUpdatedAt > existingUpdatedAt) {
        // Mark as synced since this came from Firebase
        record.lastSyncAt = new Date();
        await this.updateLocalRecord(tableName, record);
      }
    }
  }

  // Upload data from IndexedDB to Firebase
  private static async uploadToFirebase(tableName: string, since: Date): Promise<void> {
    // Get pending items from sync queue instead of checking timestamps
    const syncQueueItems = await DatabaseService.getPendingSyncItems();
    const pendingRecords = syncQueueItems.filter(item => item.tableName === tableName);

    for (const queueItem of pendingRecords) {
      try {
        const record = queueItem.data || await this.getLocalRecord(tableName, queueItem.recordId);
        if (!record) {
          // Record no longer exists, remove from queue
          await DatabaseService.removeSyncQueueItem(queueItem.id);
          continue;
        }

        const firebaseRef = ref(rtdb, `${tableName}/${queueItem.recordId}`);
        
        if (queueItem.operation === 'delete') {
          await remove(firebaseRef);
        } else {
          // Convert Date objects to Firebase timestamps
          const firebaseRecord = { ...record };
          if (firebaseRecord.createdAt) {
            firebaseRecord.createdAt = firebaseRecord.createdAt.toISOString();
          }
          if (firebaseRecord.updatedAt) {
            firebaseRecord.updatedAt = firebaseRecord.updatedAt.toISOString();
          }
          if (firebaseRecord.lastSyncAt) {
            firebaseRecord.lastSyncAt = firebaseRecord.lastSyncAt.toISOString();
          }
          if (firebaseRecord.date) {
            firebaseRecord.date = firebaseRecord.date.toISOString();
          }
          if (firebaseRecord.dateOfBirth) {
            firebaseRecord.dateOfBirth = firebaseRecord.dateOfBirth.toISOString();
          }
          if (firebaseRecord.admissionDate) {
            firebaseRecord.admissionDate = firebaseRecord.admissionDate.toISOString();
          }
          if (firebaseRecord.datePaid) {
            firebaseRecord.datePaid = firebaseRecord.datePaid.toISOString();
          }
          if (firebaseRecord.lastLogin) {
            firebaseRecord.lastLogin = firebaseRecord.lastLogin.toISOString();
          }

          await set(firebaseRef, firebaseRecord);
          
          // Update local record with sync timestamp
          await this.updateLocalRecord(tableName, {
            ...record,
            lastSyncAt: new Date()
          });
        }

        // Remove successfully synced item from queue
        await DatabaseService.removeSyncQueueItem(queueItem.id);
      } catch (error) {
        console.error(`Upload error for ${tableName}/${queueItem.recordId}:`, error);
        // Update queue item with error and increment attempts
        queueItem.attempts += 1;
        queueItem.lastError = error instanceof Error ? error.message : 'Unknown error';
        await db.syncQueue.update(queueItem.id, { attempts: queueItem.attempts, lastError: queueItem.lastError });
        throw error;
      }
    }
  }

  // Get local record by table and id
  private static async getLocalRecord(tableName: string, id: string): Promise<any> {
    switch (tableName) {
      case 'users':
        return await DatabaseService.getUserById(id);
      case 'students':
        return await DatabaseService.getStudentById(id);
      case 'attendance':
        return await DatabaseService.read(db.attendance, id);
      case 'assessments':
        return await DatabaseService.read(db.assessments, id);
      case 'fees':
        return await DatabaseService.read(db.fees, id);
      case 'canteenCollections':
        return await DatabaseService.read(db.canteenCollections, id);
      default:
        return null;
    }
  }

  // Get all local records for a table
  private static async getLocalRecords(tableName: string): Promise<any[]> {
    switch (tableName) {
      case 'users':
        return await DatabaseService.getAllUsers();
      case 'students':
        return await DatabaseService.getAllStudents();
      case 'attendance':
        return await DatabaseService.list(db.attendance);
      case 'assessments':
        return await DatabaseService.list(db.assessments);
      case 'fees':
        return await DatabaseService.list(db.fees);
      case 'canteenCollections':
        return await DatabaseService.list(db.canteenCollections);
      default:
        return [];
    }
  }

  // Update local record
  private static async updateLocalRecord(tableName: string, record: any): Promise<void> {
    const { id, ...changes } = record || {};
    const validKey = typeof id === 'string' || typeof id === 'number' || id instanceof Date;
    if (!validKey) {
      console.warn('SyncService.updateLocalRecord skipped due to invalid key', { tableName, id });
      return;
    }
    switch (tableName) {
      case 'users':
        await DatabaseService.updateUser(id as any, changes);
        break;
      case 'students':
        await DatabaseService.updateStudent(id as any, changes);
        break;
      case 'attendance':
        await DatabaseService.updateAttendance(id as any, changes);
        break;
      case 'assessments':
        await DatabaseService.updateAssessment(id as any, changes);
        break;
      case 'fees':
        await DatabaseService.updateFee(id as any, changes);
        break;
      case 'canteenCollections':
        await DatabaseService.updateCanteenCollection(id as any, changes);
        break;
    }
  }

  // Start Firebase listeners for real-time updates
  private static startFirebaseListeners(): void {
    const tables = ['users', 'students', 'attendance', 'assessments', 'fees', 'canteenCollections'];
    
    tables.forEach(tableName => {
      const firebaseRef = ref(rtdb, tableName);
      onValue(firebaseRef, async (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const entries = Object.entries(data) as [string, any][];
          
          for (const [id, record] of entries) {
            if (!record || typeof record !== 'object') continue;
            if (!record.id) record.id = id;
            const validKey = typeof record.id === 'string' || typeof record.id === 'number' || record.id instanceof Date;
            if (!validKey) continue;
            // Convert Firebase timestamps to Date objects
            if (record.createdAt) {
              record.createdAt = new Date(record.createdAt);
            }
            if (record.updatedAt) {
              record.updatedAt = new Date(record.updatedAt);
            }
            if (record.lastSyncAt) {
              record.lastSyncAt = new Date(record.lastSyncAt);
            }
            if (record.date) {
              record.date = new Date(record.date);
            }
            if (record.dateOfBirth) {
              record.dateOfBirth = new Date(record.dateOfBirth);
            }
            if (record.admissionDate) {
              record.admissionDate = new Date(record.admissionDate);
            }
            if (record.datePaid) {
              record.datePaid = new Date(record.datePaid);
            }
            if (record.lastLogin) {
              record.lastLogin = new Date(record.lastLogin);
            }

            // Mark as synced since this came from Firebase
            record.lastSyncAt = new Date();
            // Update local record
            await this.updateLocalRecord(tableName, record);
          }
        }
      });
    });
  }

  // Stop Firebase listeners
  static stopFirebaseListeners(): void {
    const tables = ['users', 'students', 'attendance', 'assessments', 'fees', 'canteenCollections'];
    
    tables.forEach(tableName => {
      const firebaseRef = ref(rtdb, tableName);
      off(firebaseRef);
    });
  }

  // Force sync specific table
  static async forceSyncTable(tableName: string): Promise<void> {
    await this.syncTable(tableName);
  }

  // Get sync status for all tables
  static async getSyncStatus(): Promise<SyncProgress[]> {
    const tables = ['users', 'students', 'attendance', 'assessments', 'fees', 'canteenCollections'];
    const statuses: SyncProgress[] = [];

    for (const tableName of tables) {
      const syncStatus = await DatabaseService.getSyncStatus(tableName);
      const syncQueueItems = await DatabaseService.getPendingSyncItems();
      const pendingChanges = syncQueueItems.filter(item => item.tableName === tableName).length;
      const localRecords = await this.getLocalRecords(tableName);

      statuses.push({
        tableName,
        status: pendingChanges > 0 ? 'pending' : 'completed',
        progress: pendingChanges,
        total: localRecords.length,
        error: syncStatus?.lastError
      });
    }

    return statuses;
  }

  // Clear all local data (for testing/reset)
  static async clearAllData(): Promise<void> {
    await db.users.clear();
    await db.students.clear();
    await db.attendance.clear();
    await db.assessments.clear();
    await db.fees.clear();
    await db.canteenCollections.clear();
    await db.syncStatus.clear();
    await db.syncQueue.clear();
  }
}
