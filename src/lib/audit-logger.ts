import { ref, push, serverTimestamp, query, orderByChild, limitToLast, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

export type AuditAction = 
  | 'create' | 'update' | 'delete'
  | 'login' | 'logout'
  | 'payment' | 'grade' | 'attendance'
  | 'promotion' | 'admission';

export type AuditEntity = 
  | 'student' | 'teacher' | 'class' | 'subject'
  | 'payment' | 'grade' | 'attendance' | 'assessment'
  | 'application' | 'promotion' | 'user' | 'invoice'
  | 'term' | 'academicYear' | 'balance';

export interface AuditLog {
  id?: string;
  userId: string;
  userName: string;
  userRole?: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName?: string;
  details?: string;
  changes?: Record<string, { old: any; new: any }>;
  timestamp: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event to Firebase Realtime Database
 */
export const logAuditEvent = async (
  userId: string,
  userName: string,
  action: AuditAction,
  entity: AuditEntity,
  entityId: string,
  options?: {
    userRole?: string;
    entityName?: string;
    details?: string;
    changes?: Record<string, { old: any; new: any }>;
  }
): Promise<void> => {
  try {
    const auditRef = ref(rtdb, 'auditLogs');
    
    const auditLog: Partial<AuditLog> = {
      userId,
      userName,
      action,
      entity,
      entityId,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      timestamp: serverTimestamp(),
    };

    if (options?.userRole) auditLog.userRole = options.userRole;
    if (options?.entityName) auditLog.entityName = options.entityName;
    if (options?.details) auditLog.details = options.details;
    if (options?.changes) auditLog.changes = options.changes;

    await push(auditRef, auditLog);
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
};

/**
 * Subscribe to recent audit logs with real-time updates
 */
export const subscribeToAuditLogs = (
  callback: (logs: AuditLog[]) => void,
  limit: number = 100
): (() => void) => {
  const auditRef = query(
    ref(rtdb, 'auditLogs'),
    orderByChild('timestamp'),
    limitToLast(limit)
  );

  const unsubscribe = onValue(auditRef, (snapshot) => {
    const logs: AuditLog[] = [];
    snapshot.forEach((childSnapshot) => {
      logs.push({
        id: childSnapshot.key!,
        ...childSnapshot.val(),
      });
    });
    // Reverse to show newest first
    callback(logs.reverse());
  });

  return unsubscribe;
};

/**
 * Helper to create change tracking object
 */
export const trackChanges = (
  oldData: Record<string, any>,
  newData: Record<string, any>,
  fields: string[]
): Record<string, { old: any; new: any }> => {
  const changes: Record<string, { old: any; new: any }> = {};
  
  fields.forEach(field => {
    if (oldData[field] !== newData[field]) {
      changes[field] = {
        old: oldData[field],
        new: newData[field],
      };
    }
  });
  
  return changes;
};
