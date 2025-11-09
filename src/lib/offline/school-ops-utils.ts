/**
 * School Ops Utilities
 *
 * Utilities for:
 * - Bulk attendance entry
 * - Grade averages (local)
 * - Duplicate payment detection
 * - Receipt generation with pending flag
 * - Report pending-sync awareness
 */

import { indexedDBManager } from './indexeddb-manager';
import { offlineAttendance, offlineAssessments, offlineStudentBalances, offlineInvoices } from './offline-wrapper';
import { networkMonitor } from './network-monitor';

// ===== ATTENDANCE =====

export interface BulkAttendanceEntry {
  studentId: string;
  status: 'present' | 'absent' | 'late';
}

export interface BulkAttendanceParams {
  classId: string;
  teacherId: string;
  date: string; // yyyy-mm-dd
  entries: BulkAttendanceEntry[];
}

/**
 * Record bulk attendance for a class (offline-first)
 */
export async function recordBulkAttendance(params: BulkAttendanceParams): Promise<string> {
  const id = await offlineAttendance.create({
    classId: params.classId,
    teacherId: params.teacherId,
    date: params.date,
    entries: params.entries,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  return id;
}

// ===== GRADE AVERAGES =====

export interface AssessmentLike {
  studentId: string;
  classId?: string;
  subjectId?: string;
  score: number;
  maxScore: number;
}

/**
 * Compute average percentage for a student from local assessments
 */
export function computeStudentAverage(records: AssessmentLike[]): number {
  if (!records.length) return 0;
  const totals = records.reduce(
    (acc, r) => {
      acc.score += Number(r.score) || 0;
      acc.max += Number(r.maxScore) || 0;
      return acc;
    },
    { score: 0, max: 0 }
  );
  if (totals.max <= 0) return 0;
  return Math.round((totals.score / totals.max) * 10000) / 100; // 2dp
}

/**
 * Compute class average percentage from local assessments
 */
export function computeClassAverage(records: AssessmentLike[]): number {
  return computeStudentAverage(records);
}

// ===== FEE MANAGEMENT =====

export interface PaymentInput {
  studentId: string;
  amountPaid: number;
  paymentDate: string; // ISO
  paymentMethod: 'cash' | 'mobile' | 'bank' | string;
  receiptNumber?: string;
}

/**
 * Check if a payment looks like a duplicate based on (studentId + receiptNumber) or
 * same amount within the same minute.
 */
export async function isDuplicatePayment(input: PaymentInput): Promise<boolean> {
  // Prefer receipt match if provided
  if (input.receiptNumber) {
    const invoices = await offlineInvoices.queryBy('by_receipt', input.receiptNumber).catch(() => []);
    if (Array.isArray(invoices) && invoices.length > 0) return true;
  }

  // Fallback: heuristic match in recent payments for the same student
  const balances = await offlineStudentBalances.queryBy('by_studentId', input.studentId).catch(() => []);
  const targetMinute = new Date(input.paymentDate).toISOString().slice(0, 16); // up to minutes
  const match = (balances as any[]).some((b) => {
    if (!b || typeof b !== 'object') return false;
    const paidAt = (b.paymentDate || b.updatedAt || '').slice(0, 16);
    return Number(b.amountPaid) === Number(input.amountPaid) && paidAt === targetMinute;
  });
  return match;
}

/**
 * Generate a receipt object with pending flag if not yet synced
 */
export function generateReceipt(input: PaymentInput) {
  const isOnline = networkMonitor.isOnline();
  return {
    id: input.receiptNumber || `R-${Date.now()}`,
    studentId: input.studentId,
    amountPaid: input.amountPaid,
    paymentDate: input.paymentDate,
    paymentMethod: input.paymentMethod,
    status: isOnline ? 'synced' : 'pending',
    createdAt: new Date().toISOString(),
  };
}

// ===== REPORTS =====

/**
 * Check if any of the given collections have pending syncs
 */
export async function hasPendingSyncForCollections(collections: string[]): Promise<boolean> {
  for (const store of collections) {
    try {
      const items = await indexedDBManager.queryByIndex<any>(store, 'by_syncStatus', 'pending');
      if (items && (items as any[]).length > 0) return true;
    } catch {
      // store might not have the index; fallback to scanning
      const all = await indexedDBManager.getAllFromStore<any>(store).catch(() => []);
      if ((all as any[]).some((x) => x && x.syncStatus === 'pending')) return true;
    }
  }
  return false;
}

export interface ReportContext {
  basedOnLocalData: boolean;
  pendingCollections: string[];
}

/**
 * Build report context indicating if report should be marked as "based on local data"
 */
export async function getReportContext(collections: string[]): Promise<ReportContext> {
  const pending: string[] = [];
  for (const store of collections) {
    const has = await hasPendingSyncForCollections([store]);
    if (has) pending.push(store);
  }
  return {
    basedOnLocalData: pending.length > 0,
    pendingCollections: pending,
  };
}
