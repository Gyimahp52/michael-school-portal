/**
 * IndexedDB CRUD Operations (Extended)
 * 
 * Continuation of CRUD operations for remaining collections.
 */

import { indexedDBManager } from './indexeddb-manager';
import { generateId, addSyncMetadata } from './indexeddb-operations';
import type {
  InvoiceLocal,
  StudentDocumentLocal,
  CanteenCollectionLocal,
  PromotionRequestLocal,
  ReportLocal,
  ReportStatsLocal,
} from './indexeddb-schema';

// Re-export addSyncMetadata helper
function addSyncMetadataLocal<T>(item: T, syncStatus: 'synced' | 'pending' | 'failed' = 'pending'): T & {
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
} {
  return {
    ...item,
    syncStatus,
    localUpdatedAt: Date.now(),
    lastSyncedAt: syncStatus === 'synced' ? Date.now() : undefined,
  };
}

// ===== INVOICES =====

export async function createInvoice(
  invoice: Omit<InvoiceLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const invoiceData: InvoiceLocal = addSyncMetadataLocal({
    ...invoice,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('invoices', invoiceData);
  return id;
}

export async function getAllInvoices(): Promise<InvoiceLocal[]> {
  return indexedDBManager.getAllFromStore<InvoiceLocal>('invoices');
}

export async function getInvoice(id: string): Promise<InvoiceLocal | undefined> {
  return indexedDBManager.getFromStore<InvoiceLocal>('invoices', id);
}

export async function updateInvoice(id: string, updates: Partial<InvoiceLocal>): Promise<void> {
  const existing = await getInvoice(id);
  if (!existing) throw new Error(`Invoice ${id} not found`);
  
  const updated: InvoiceLocal = addSyncMetadataLocal({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('invoices', updated);
}

export async function deleteInvoice(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('invoices', id);
}

export async function getInvoicesByStudent(studentId: string): Promise<InvoiceLocal[]> {
  return indexedDBManager.queryByIndex<InvoiceLocal>(
    'invoices',
    'studentId',
    studentId
  );
}

// ===== STUDENT DOCUMENTS =====

export async function createStudentDocument(
  doc: Omit<StudentDocumentLocal, 'id' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  
  const docData: StudentDocumentLocal = addSyncMetadataLocal({
    ...doc,
    id,
  });
  
  await indexedDBManager.putInStore('studentDocuments', docData);
  return id;
}

export async function getAllStudentDocuments(): Promise<StudentDocumentLocal[]> {
  return indexedDBManager.getAllFromStore<StudentDocumentLocal>('studentDocuments');
}

export async function getStudentDocument(id: string): Promise<StudentDocumentLocal | undefined> {
  return indexedDBManager.getFromStore<StudentDocumentLocal>('studentDocuments', id);
}

export async function updateStudentDocument(id: string, updates: Partial<StudentDocumentLocal>): Promise<void> {
  const existing = await getStudentDocument(id);
  if (!existing) throw new Error(`Student document ${id} not found`);
  
  const updated: StudentDocumentLocal = addSyncMetadataLocal({
    ...existing,
    ...updates,
    id,
  });
  
  await indexedDBManager.putInStore('studentDocuments', updated);
}

export async function deleteStudentDocument(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('studentDocuments', id);
}

export async function getStudentDocumentsByStudent(studentId: string): Promise<StudentDocumentLocal[]> {
  return indexedDBManager.queryByIndex<StudentDocumentLocal>(
    'studentDocuments',
    'studentId',
    studentId
  );
}

// ===== CANTEEN COLLECTIONS =====

export async function createCanteenCollection(
  collection: Omit<CanteenCollectionLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const collectionData: CanteenCollectionLocal = addSyncMetadataLocal({
    ...collection,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('canteenCollections', collectionData);
  return id;
}

export async function getAllCanteenCollections(): Promise<CanteenCollectionLocal[]> {
  const collections = await indexedDBManager.getAllFromStore<CanteenCollectionLocal>('canteenCollections');
  return collections.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getCanteenCollection(id: string): Promise<CanteenCollectionLocal | undefined> {
  return indexedDBManager.getFromStore<CanteenCollectionLocal>('canteenCollections', id);
}

export async function updateCanteenCollection(id: string, updates: Partial<CanteenCollectionLocal>): Promise<void> {
  const existing = await getCanteenCollection(id);
  if (!existing) throw new Error(`Canteen collection ${id} not found`);
  
  const updated: CanteenCollectionLocal = addSyncMetadataLocal({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('canteenCollections', updated);
}

export async function deleteCanteenCollection(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('canteenCollections', id);
}

// ===== PROMOTION REQUESTS =====

export async function createPromotionRequest(
  request: Omit<PromotionRequestLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const requestData: PromotionRequestLocal = addSyncMetadataLocal({
    ...request,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('promotionRequests', requestData);
  return id;
}

export async function getAllPromotionRequests(): Promise<PromotionRequestLocal[]> {
  return indexedDBManager.getAllFromStore<PromotionRequestLocal>('promotionRequests');
}

export async function getPromotionRequest(id: string): Promise<PromotionRequestLocal | undefined> {
  return indexedDBManager.getFromStore<PromotionRequestLocal>('promotionRequests', id);
}

export async function updatePromotionRequest(id: string, updates: Partial<PromotionRequestLocal>): Promise<void> {
  const existing = await getPromotionRequest(id);
  if (!existing) throw new Error(`Promotion request ${id} not found`);
  
  const updated: PromotionRequestLocal = addSyncMetadataLocal({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('promotionRequests', updated);
}

export async function deletePromotionRequest(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('promotionRequests', id);
}

// ===== REPORTS =====

export async function createReport(
  report: Omit<ReportLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const reportData: ReportLocal = addSyncMetadataLocal({
    ...report,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('reports', reportData);
  return id;
}

export async function getAllReports(): Promise<ReportLocal[]> {
  return indexedDBManager.getAllFromStore<ReportLocal>('reports');
}

export async function getReport(id: string): Promise<ReportLocal | undefined> {
  return indexedDBManager.getFromStore<ReportLocal>('reports', id);
}

export async function updateReport(id: string, updates: Partial<ReportLocal>): Promise<void> {
  const existing = await getReport(id);
  if (!existing) throw new Error(`Report ${id} not found`);
  
  const updated: ReportLocal = addSyncMetadataLocal({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('reports', updated);
}

export async function deleteReport(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('reports', id);
}

// ===== REPORT STATS =====

export async function getReportStats(): Promise<ReportStatsLocal | undefined> {
  // Report stats uses a fixed ID
  return indexedDBManager.getFromStore<ReportStatsLocal>('reportStats', 'stats');
}

export async function updateReportStats(updates: Partial<ReportStatsLocal>): Promise<void> {
  const existing = await getReportStats();
  
  const updated: ReportStatsLocal = addSyncMetadataLocal({
    reportsGenerated: 0,
    downloads: 0,
    activeReports: 0,
    lastUpdated: new Date().toISOString(),
    ...existing,
    ...updates,
  });
  
  await indexedDBManager.putInStore('reportStats', { ...updated, id: 'stats' });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get all items with pending sync status
 */
export async function getPendingSyncItems(storeName: string): Promise<any[]> {
  return indexedDBManager.queryByIndex(
    storeName,
    'syncStatus',
    'pending'
  );
}

/**
 * Mark item as synced
 */
export async function markAsSynced(storeName: string, id: string): Promise<void> {
  const item = await indexedDBManager.getFromStore<any>(storeName, id);
  if (!item) return;
  
  const updated = {
    ...item,
    syncStatus: 'synced' as const,
    lastSyncedAt: Date.now(),
  };
  
  await indexedDBManager.putInStore(storeName, updated);
}

/**
 * Mark item as failed sync
 */
export async function markAsFailed(storeName: string, id: string): Promise<void> {
  const item = await indexedDBManager.getFromStore<any>(storeName, id);
  if (!item) return;
  
  const updated = {
    ...item,
    syncStatus: 'failed' as const,
  };
  
  await indexedDBManager.putInStore(storeName, updated);
}

/**
 * Get sync statistics for all stores
 */
export async function getSyncStats(): Promise<Record<string, { total: number; pending: number; failed: number; synced: number }>> {
  const stores = [
    'academicYears', 'terms', 'students', 'teachers', 'subjects', 'classes',
    'applications', 'assessments', 'attendance', 'schoolFees', 'studentBalances',
    'invoices', 'studentDocuments', 'canteenCollections', 'promotionRequests', 'reports'
  ];
  
  const stats: Record<string, { total: number; pending: number; failed: number; synced: number }> = {};
  
  for (const store of stores) {
    const total = await indexedDBManager.countInStore(store);
    const pending = (await getPendingSyncItems(store)).length;
    const failed = (await indexedDBManager.queryByIndex(store, 'syncStatus', 'failed')).length;
    const synced = (await indexedDBManager.queryByIndex(store, 'syncStatus', 'synced')).length;
    
    stats[store] = { total, pending, failed, synced };
  }
  
  return stats;
}
