/**
 * Data Flow Manager
 * 
 * Manages the complete data flow for school operations:
 * 1. Write to IndexedDB (pending)
 * 2. Update UI immediately
 * 3. Sync to Firebase if online
 * 4. Update IndexedDB (synced)
 * 5. Trigger notifications if configured
 */

import { indexedDBManager } from './indexeddb-manager';
import { syncManager } from './sync-manager';
import { transformToFirebase } from './data-transformer';
import { ref, set } from 'firebase/database';
import { rtdb } from '../../firebase';

// ===== TYPES =====

export type OperationType = 'create' | 'update' | 'delete';
export type EntityType = 
  | 'attendance' 
  | 'assessment' 
  | 'student' 
  | 'teacher' 
  | 'fee_payment'
  | 'invoice'
  | 'application'
  | 'promotion';

export interface DataFlowOperation<T = any> {
  id: string;
  entityType: EntityType;
  operationType: OperationType;
  data: T;
  userId: string;
  userRole: string;
  timestamp: number;
  notifyRoles?: string[]; // Roles to notify (admin, parent, etc.)
  notifyUsers?: string[]; // Specific users to notify
}

export interface DataFlowResult {
  success: boolean;
  localId: string;
  synced: boolean;
  notificationsSent: boolean;
  error?: string;
}

export interface NotificationConfig {
  enabled: boolean;
  channels: ('in-app' | 'email' | 'sms')[];
  recipients: {
    admins?: boolean;
    parents?: boolean;
    teachers?: boolean;
    specificUsers?: string[];
  };
}

// ===== NOTIFICATION CONFIGURATIONS =====

const NOTIFICATION_CONFIGS: Record<EntityType, NotificationConfig> = {
  attendance: {
    enabled: true,
    channels: ['in-app'],
    recipients: {
      admins: true,
      parents: true, // Notify parents of their child's attendance
    },
  },
  assessment: {
    enabled: true,
    channels: ['in-app'],
    recipients: {
      admins: true,
      parents: true, // Notify parents of grades
    },
  },
  fee_payment: {
    enabled: true,
    channels: ['in-app'],
    recipients: {
      admins: true,
      parents: true, // Notify parents of payment
    },
  },
  student: {
    enabled: true,
    channels: ['in-app'],
    recipients: {
      admins: true,
    },
  },
  teacher: {
    enabled: true,
    channels: ['in-app'],
    recipients: {
      admins: true,
    },
  },
  invoice: {
    enabled: true,
    channels: ['in-app'],
    recipients: {
      admins: true,
      parents: true,
    },
  },
  application: {
    enabled: true,
    channels: ['in-app'],
    recipients: {
      admins: true,
    },
  },
  promotion: {
    enabled: true,
    channels: ['in-app'],
    recipients: {
      admins: true,
      parents: true,
    },
  },
};

// ===== DATA FLOW MANAGER CLASS =====

export class DataFlowManager {
  private listeners: Map<string, Set<(operation: DataFlowOperation) => void>> = new Map();
  private notificationQueue: DataFlowOperation[] = [];

  // ===== MAIN DATA FLOW =====

  /**
   * Execute complete data flow for an operation
   */
  async executeFlow<T>(operation: DataFlowOperation<T>): Promise<DataFlowResult> {
    const result: DataFlowResult = {
      success: false,
      localId: operation.id,
      synced: false,
      notificationsSent: false,
    };

    try {
      // Step 1: Write to IndexedDB (pending)
      console.log(`📝 Step 1: Writing to IndexedDB (pending) - ${operation.entityType}/${operation.id}`);
      await this.writeToIndexedDB(operation, 'pending');

      // Step 2: Update UI immediately (emit event)
      console.log(`🔄 Step 2: Updating UI - ${operation.entityType}/${operation.id}`);
      this.emitUIUpdate(operation);

      result.success = true;

      // Step 3: Sync to Firebase if online
      if (navigator.onLine) {
        console.log(`☁️ Step 3: Syncing to Firebase - ${operation.entityType}/${operation.id}`);
        try {
          await this.syncToFirebase(operation);
          result.synced = true;

          // Step 4: Update IndexedDB (synced)
          console.log(`✅ Step 4: Updating IndexedDB (synced) - ${operation.entityType}/${operation.id}`);
          await this.writeToIndexedDB(operation, 'synced');

          // Step 5: Trigger notifications
          console.log(`📢 Step 5: Triggering notifications - ${operation.entityType}/${operation.id}`);
          await this.triggerNotifications(operation);
          result.notificationsSent = true;
        } catch (error) {
          console.error(`❌ Firebase sync failed - ${operation.entityType}/${operation.id}:`, error);
          result.error = error instanceof Error ? error.message : 'Sync failed';
          // Keep as pending, will retry later
        }
      } else {
        console.log(`📴 Offline: Queued for sync - ${operation.entityType}/${operation.id}`);
      }

      return result;
    } catch (error) {
      console.error('Data flow error:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  // ===== STEP 1: WRITE TO INDEXEDDB =====

  private async writeToIndexedDB<T>(
    operation: DataFlowOperation<T>,
    syncStatus: 'pending' | 'synced'
  ): Promise<void> {
    const collectionName = this.getCollectionName(operation.entityType);
    
    const dataWithMetadata = {
      ...operation.data,
      id: operation.id,
      syncStatus,
      localUpdatedAt: Date.now(),
      lastSyncedAt: syncStatus === 'synced' ? Date.now() : undefined,
      _operationType: operation.operationType,
      _userId: operation.userId,
      _userRole: operation.userRole,
    };

    await indexedDBManager.putInStore(collectionName, dataWithMetadata);
  }

  // ===== STEP 2: UPDATE UI =====

  private emitUIUpdate<T>(operation: DataFlowOperation<T>): void {
    const listeners = this.listeners.get(operation.entityType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(operation);
        } catch (error) {
          console.error('Error in UI update listener:', error);
        }
      });
    }

    // Emit global update
    const globalListeners = this.listeners.get('*');
    if (globalListeners) {
      globalListeners.forEach(listener => {
        try {
          listener(operation);
        } catch (error) {
          console.error('Error in global listener:', error);
        }
      });
    }
  }

  // ===== STEP 3: SYNC TO FIREBASE =====

  private async syncToFirebase<T>(operation: DataFlowOperation<T>): Promise<void> {
    const collectionName = this.getCollectionName(operation.entityType);
    const firebaseData = transformToFirebase(operation.data);
    const firebaseRef = ref(rtdb, `${collectionName}/${operation.id}`);

    await set(firebaseRef, firebaseData);
  }

  // ===== STEP 5: TRIGGER NOTIFICATIONS =====

  private async triggerNotifications<T>(operation: DataFlowOperation<T>): Promise<void> {
    const config = NOTIFICATION_CONFIGS[operation.entityType];
    
    if (!config.enabled) {
      return;
    }

    // Create notification record
    const notification = {
      id: `notif-${operation.id}-${Date.now()}`,
      entityType: operation.entityType,
      entityId: operation.id,
      operationType: operation.operationType,
      userId: operation.userId,
      userRole: operation.userRole,
      timestamp: Date.now(),
      recipients: this.determineRecipients(operation, config),
      read: false,
      data: operation.data,
    };

    // Store notification in IndexedDB
    await indexedDBManager.putInStore('notifications', notification);

    // If online, also store in Firebase for real-time delivery
    if (navigator.onLine) {
      try {
        const notifRef = ref(rtdb, `notifications/${notification.id}`);
        await set(notifRef, notification);
      } catch (error) {
        console.error('Failed to send notification to Firebase:', error);
      }
    } else {
      // Queue for later delivery
      this.notificationQueue.push(operation);
    }
  }

  // ===== HELPER METHODS =====

  private getCollectionName(entityType: EntityType): string {
    const mapping: Record<EntityType, string> = {
      attendance: 'attendance',
      assessment: 'assessments',
      student: 'students',
      teacher: 'teachers',
      fee_payment: 'studentBalances',
      invoice: 'invoices',
      application: 'applications',
      promotion: 'promotionRequests',
    };
    return mapping[entityType];
  }

  private determineRecipients<T>(
    operation: DataFlowOperation<T>,
    config: NotificationConfig
  ): string[] {
    const recipients: string[] = [];

    // Add specific users
    if (operation.notifyUsers) {
      recipients.push(...operation.notifyUsers);
    }

    // Add role-based recipients
    if (operation.notifyRoles) {
      recipients.push(...operation.notifyRoles.map(role => `role:${role}`));
    }

    // Add config-based recipients
    if (config.recipients.admins) {
      recipients.push('role:admin');
    }
    if (config.recipients.parents) {
      recipients.push('role:parent');
    }
    if (config.recipients.teachers) {
      recipients.push('role:teacher');
    }
    if (config.recipients.specificUsers) {
      recipients.push(...config.recipients.specificUsers);
    }

    return [...new Set(recipients)]; // Remove duplicates
  }

  // ===== EVENT LISTENERS =====

  /**
   * Listen for data flow updates
   */
  on(entityType: EntityType | '*', callback: (operation: DataFlowOperation) => void): () => void {
    if (!this.listeners.has(entityType)) {
      this.listeners.set(entityType, new Set());
    }
    this.listeners.get(entityType)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(entityType)?.delete(callback);
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  // ===== NOTIFICATION QUEUE =====

  /**
   * Process queued notifications when coming online
   */
  async processNotificationQueue(): Promise<void> {
    if (!navigator.onLine || this.notificationQueue.length === 0) {
      return;
    }

    console.log(`Processing ${this.notificationQueue.length} queued notifications`);

    const queue = [...this.notificationQueue];
    this.notificationQueue = [];

    for (const operation of queue) {
      try {
        await this.triggerNotifications(operation);
      } catch (error) {
        console.error('Failed to process queued notification:', error);
        // Re-queue if failed
        this.notificationQueue.push(operation);
      }
    }
  }

  /**
   * Get notification queue size
   */
  getQueueSize(): number {
    return this.notificationQueue.length;
  }
}

// Export singleton instance
export const dataFlowManager = new DataFlowManager();

// Listen for online event to process notification queue
window.addEventListener('online', () => {
  dataFlowManager.processNotificationQueue();
});

// ===== CONVENIENCE FUNCTIONS =====

/**
 * Execute data flow for attendance marking
 */
export async function markAttendance(
  attendanceData: any,
  userId: string,
  userRole: string
): Promise<DataFlowResult> {
  const operation: DataFlowOperation = {
    id: `attendance-${Date.now()}`,
    entityType: 'attendance',
    operationType: 'create',
    data: attendanceData,
    userId,
    userRole,
    timestamp: Date.now(),
    notifyRoles: ['admin', 'parent'],
  };

  return dataFlowManager.executeFlow(operation);
}

/**
 * Execute data flow for grade entry
 */
export async function recordGrade(
  gradeData: any,
  userId: string,
  userRole: string
): Promise<DataFlowResult> {
  const operation: DataFlowOperation = {
    id: `assessment-${Date.now()}`,
    entityType: 'assessment',
    operationType: 'create',
    data: gradeData,
    userId,
    userRole,
    timestamp: Date.now(),
    notifyRoles: ['admin', 'parent'],
  };

  return dataFlowManager.executeFlow(operation);
}

/**
 * Execute data flow for fee payment
 */
export async function recordFeePayment(
  paymentData: any,
  userId: string,
  userRole: string
): Promise<DataFlowResult> {
  const operation: DataFlowOperation = {
    id: `payment-${Date.now()}`,
    entityType: 'fee_payment',
    operationType: 'update',
    data: paymentData,
    userId,
    userRole,
    timestamp: Date.now(),
    notifyRoles: ['admin', 'parent'],
  };

  return dataFlowManager.executeFlow(operation);
}

/**
 * Execute data flow for student enrollment
 */
export async function enrollStudent(
  studentData: any,
  userId: string,
  userRole: string
): Promise<DataFlowResult> {
  const operation: DataFlowOperation = {
    id: `student-${Date.now()}`,
    entityType: 'student',
    operationType: 'create',
    data: studentData,
    userId,
    userRole,
    timestamp: Date.now(),
    notifyRoles: ['admin'],
  };

  return dataFlowManager.executeFlow(operation);
}
