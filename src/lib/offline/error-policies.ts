/**
 * School-Specific Error Policies & Handlers
 *
 * Covers scenarios:
 * - Network failures mid-attendance
 * - Concurrent attendance (multiple teachers)
 * - Offline fee payment with verification
 * - Grade entry conflicts
 * - Academic year/term transitions while offline
 * - Bulk operations with partial sync
 * - Photo/document uploads handling
 */

import { indexedDBManager } from './indexeddb-manager';
import { syncManager } from './sync-manager';
import { networkMonitor } from './network-monitor';

// ===== COMMON TYPES =====

export type ConflictStrategy = 'latest' | 'local-wins' | 'remote-wins' | 'manual-review';

export interface AttendanceEntryWithMeta {
  studentId: string;
  status: 'present' | 'absent' | 'late';
  _updatedAt: number; // ms timestamp for conflict resolution
  _by: { teacherId: string };
}

export interface AttendanceRecordLike {
  id: string;
  classId: string;
  teacherId: string;
  date: string; // yyyy-mm-dd
  entries: AttendanceEntryWithMeta[];
  syncStatus?: 'pending' | 'synced' | 'failed';
  localUpdatedAt?: number;
  lastSyncedAt?: number;
  idempotencyKey?: string; // classId|date (and teacher if needed)
}

// ===== 1) NETWORK FAILURES MID-ATTENDANCE =====

/**
 * Build idempotency key for a class attendance session (prevents duplicates on retry)
 */
export function buildAttendanceKey(classId: string, date: string, teacherId?: string) {
  return `${classId}|${date}|${teacherId ?? 'unknown'}`;
}

/**
 * Ensure an attendance record is idempotent; if a record with the same key exists, merge entries.
 */
export async function upsertAttendanceIdempotent(record: AttendanceRecordLike): Promise<string> {
  const key = record.idempotencyKey || buildAttendanceKey(record.classId, record.date, record.teacherId);
  const store = 'attendance';

  // Try to find existing record by idempotencyKey (index recommended: by_idempotencyKey)
  let existing: any[] = [];
  try {
    existing = await indexedDBManager.queryByIndex<any>(store, 'by_idempotencyKey', key);
  } catch {
    // Fallback: scan all for same class/date
    const all = await indexedDBManager.getAllFromStore<any>(store).catch(() => []);
    existing = (all as any[]).filter(r => r.classId === record.classId && r.date === record.date);
  }

  if (existing.length > 0) {
    const base = existing[0];
    const merged = mergeAttendanceEntries(base.entries || [], record.entries || []);
    const updated = {
      ...base,
      entries: merged,
      localUpdatedAt: Date.now(),
      syncStatus: networkMonitor.isOnline() ? 'synced' : 'pending',
    };
    await indexedDBManager.putInStore(store, updated);
    return base.id;
  }

  // New record
  const toSave = {
    ...record,
    idempotencyKey: key,
    localUpdatedAt: Date.now(),
    syncStatus: networkMonitor.isOnline() ? 'synced' : 'pending',
  };
  await indexedDBManager.putInStore(store, toSave);
  return record.id;
}

/**
 * Merge attendance entries by student with latest _updatedAt winning.
 */
export function mergeAttendanceEntries(a: AttendanceEntryWithMeta[], b: AttendanceEntryWithMeta[]) {
  const map = new Map<string, AttendanceEntryWithMeta>();
  const put = (e: AttendanceEntryWithMeta) => {
    const prev = map.get(e.studentId);
    if (!prev || (e._updatedAt ?? 0) >= (prev._updatedAt ?? 0)) {
      map.set(e.studentId, e);
    }
  };
  a.forEach(put);
  b.forEach(put);
  return Array.from(map.values());
}

// ===== 2) CONCURRENT ATTENDANCE (MULTIPLE TEACHERS) =====

/**
 * Resolve concurrent attendance by merging and annotating conflicts.
 */
export function resolveConcurrentAttendance(
  base: AttendanceRecordLike,
  incoming: AttendanceRecordLike
): { merged: AttendanceRecordLike; conflicts: string[] } {
  const conflicts: string[] = [];
  const baseMap = new Map(base.entries.map(e => [e.studentId, e] as const));
  const mergedEntries: AttendanceEntryWithMeta[] = [];

  const apply = (entry: AttendanceEntryWithMeta) => {
    const prev = baseMap.get(entry.studentId);
    if (!prev) {
      mergedEntries.push(entry);
      return;
    }
    if (prev.status !== entry.status) {
      conflicts.push(entry.studentId);
    }
    mergedEntries.push((entry._updatedAt ?? 0) >= (prev._updatedAt ?? 0) ? entry : prev);
    baseMap.delete(entry.studentId);
  };

  (incoming.entries || []).forEach(apply);
  baseMap.forEach(v => mergedEntries.push(v));

  return {
    merged: {
      ...base,
      entries: mergedEntries,
      localUpdatedAt: Date.now(),
      syncStatus: base.syncStatus || 'pending',
    },
    conflicts,
  };
}

// ===== 3) OFFLINE FEE PAYMENT VERIFICATION =====

export type VerificationStatus = 'pendingVerification' | 'verified' | 'rejected';

export function markPaymentForVerification(balance: any) {
  return {
    ...balance,
    verificationStatus: networkMonitor.isOnline() ? 'verified' : 'pendingVerification',
    verificationUpdatedAt: Date.now(),
  };
}

// ===== 4) GRADE ENTRY CONFLICTS =====

export function resolveGradeConflict(local: any, remote: any, strategy: ConflictStrategy = 'latest') {
  if (strategy === 'local-wins') return local;
  if (strategy === 'remote-wins') return remote;
  if (strategy === 'manual-review') {
    return {
      ...remote,
      _conflict: true,
      _localVersion: local,
      _remoteVersion: remote,
    };
  }
  // latest
  const lts = Number(local?.localUpdatedAt ?? 0);
  const rts = Number(remote?.updatedAt ?? 0);
  return lts >= rts ? local : remote;
}

// ===== 5) TERM/YEAR TRANSITIONS WHILE OFFLINE =====

export interface TermContext {
  academicYear: string;
  term: string;
  version: number; // bump when transitioning
}

export function stampWithTermContext<T extends object>(data: T, ctx: TermContext) {
  return { ...data, _termContext: ctx } as T & { _termContext: TermContext };
}

export function validateTermContext<T extends { _termContext?: TermContext }>(
  data: T,
  current: TermContext
): { ok: boolean; requiresReview: boolean } {
  if (!data._termContext) return { ok: true, requiresReview: false };
  const same =
    data._termContext.academicYear === current.academicYear &&
    data._termContext.term === current.term;
  return { ok: same, requiresReview: !same };
}

// ===== 6) BULK OPERATIONS WITH PARTIAL SYNC =====

export interface BulkTracker {
  transactionId: string;
  total: number;
  completed: number;
  failed: number;
  items: Array<{ id: string; status: 'pending' | 'synced' | 'failed'; error?: string }>;
}

export async function initBulkTracker(transactionId: string, ids: string[]): Promise<BulkTracker> {
  const tracker: BulkTracker = {
    transactionId,
    total: ids.length,
    completed: 0,
    failed: 0,
    items: ids.map(id => ({ id, status: 'pending' })),
  };
  await indexedDBManager.putInStore('bulkTrackers', tracker as any).catch(() => {});
  return tracker;
}

export async function updateBulkTracker(transactionId: string, id: string, status: 'synced' | 'failed', error?: string) {
  try {
    const tracker = await indexedDBManager.getFromStore<any>('bulkTrackers', transactionId);
    if (!tracker) return;
    const item = (tracker.items as any[]).find((i) => i.id === id);
    if (item) item.status = status;
    if (error) item.error = error;
    tracker.completed = (tracker.items as any[]).filter((i) => i.status !== 'pending').length;
    tracker.failed = (tracker.items as any[]).filter((i) => i.status === 'failed').length;
    await indexedDBManager.putInStore('bulkTrackers', tracker);
  } catch {
    // non-fatal
  }
}

// ===== 7) PHOTO/DOCUMENT UPLOADS =====

export interface UploadItemMeta {
  id: string; // linked to studentDocument or student id
  collection: 'studentDocuments' | 'students';
  field: 'photoUrl' | 'fileUrl';
  localDataUrl?: string; // preview while offline
  uploadStatus: 'pending' | 'uploading' | 'synced' | 'failed';
  storagePath?: string; // Firebase Storage path once known
  error?: string;
}

/**
 * Attach a local preview (data URL) and mark upload as pending
 * Persisted inside the target document to avoid a new object store.
 */
export async function attachLocalUploadPlaceholder(
  collection: 'studentDocuments' | 'students',
  id: string,
  field: 'photoUrl' | 'fileUrl',
  dataUrl: string
) {
  const doc = await indexedDBManager.getFromStore<any>(collection, id);
  const updated = {
    ...doc,
    _upload: {
      ...(doc?._upload || {}),
      [field]: { localDataUrl: dataUrl, uploadStatus: 'pending' } as UploadItemMeta,
    },
    localUpdatedAt: Date.now(),
    syncStatus: 'pending',
  };
  await indexedDBManager.putInStore(collection, updated);
}

/**
 * Update upload status on a document
 */
export async function setUploadStatus(
  collection: 'studentDocuments' | 'students',
  id: string,
  field: 'photoUrl' | 'fileUrl',
  status: UploadItemMeta['uploadStatus'],
  extras?: Partial<UploadItemMeta>
) {
  const doc = await indexedDBManager.getFromStore<any>(collection, id);
  const current = (doc?._upload && doc._upload[field]) || {};
  const updated = {
    ...doc,
    _upload: {
      ...(doc?._upload || {}),
      [field]: { ...current, uploadStatus: status, ...extras },
    },
    localUpdatedAt: Date.now(),
  };
  await indexedDBManager.putInStore(collection, updated);
}

/**
 * Should be called after a successful storage upload to replace placeholder with final URL.
 */
export async function finalizeUploadUrl(
  collection: 'studentDocuments' | 'students',
  id: string,
  field: 'photoUrl' | 'fileUrl',
  downloadUrl: string
) {
  const doc = await indexedDBManager.getFromStore<any>(collection, id);
  const updated = {
    ...doc,
    [field]: downloadUrl,
    _upload: {
      ...(doc?._upload || {}),
      [field]: { ...(doc?._upload?.[field] || {}), uploadStatus: 'synced', localDataUrl: undefined },
    },
    localUpdatedAt: Date.now(),
    syncStatus: networkMonitor.isOnline() ? 'synced' : 'pending',
  };
  await indexedDBManager.putInStore(collection, updated);
}
