/**
 * Offline-First Module
 * 
 * Central export point for all offline functionality
 */

// Database Management
export { indexedDBManager, IndexedDBManager } from './indexeddb-manager';
export { DB_NAME, DB_VERSION, OBJECT_STORES } from './indexeddb-schema';

// CRUD Operations
export * from './indexeddb-operations';
export * from './indexeddb-operations-extended';

// Sync Management
export { syncManager, SyncManager } from './sync-manager';
export type { SyncConfig, SyncStatus, SyncEvent, SyncEventType } from './sync-manager';

// Sync Service (Schema-Aware)
export { syncService, SyncService } from './sync-service';
export type { SyncResult, SyncError, ConflictRecord, SyncPriority } from './sync-service';

// Data Transformation
export {
  transformFromFirebase,
  transformToFirebase,
  validateSchema,
  validateCollectionData,
  batchTransformFromFirebase,
  batchTransformToFirebase,
} from './data-transformer';
export type { TransformOptions, Schema, SchemaField } from './data-transformer';

// React Hooks
export {
  useAcademicYears,
  useTerms,
  useCurrentTerm,
  useStudents,
  useStudentsByClass,
  useTeachers,
  useSubjects,
  useClasses,
  useApplications,
  useAssessments,
  useAssessmentsByStudent,
  useAttendance,
  useAttendanceByClass,
  useSchoolFees,
  useStudentBalances,
  useInvoices,
  useInvoicesByStudent,
  useStudentDocuments,
  useCanteenCollections,
  usePromotionRequests,
  useReports,
  useSyncStatus,
  useOfflineMutation,
  useOnlineStatus,
} from './use-offline-data';

// Sync Hooks
export {
  useSyncStatistics,
  useConflictLog,
  useErrorLog,
  useManualSync,
  useCollectionSyncStatus,
  usePendingItemsCount,
  useFailedItemsCount,
} from './sync-hooks';

// Network Monitoring
export { networkMonitor, NetworkMonitorClass } from './network-monitor';
export type { NetworkInfo, NetworkStatus, NetworkEvent, ConnectionType } from './network-monitor';

// Network Hooks
export {
  useNetwork,
  useNetworkStatus,
  useIsGoodForSync,
  useConnectionType,
  useNetworkQuality,
} from './use-network';

// Data Flow Management
export { dataFlowManager, DataFlowManager } from './data-flow-manager';
export type { 
  DataFlowOperation, 
  DataFlowResult, 
  EntityType, 
  OperationType,
  NotificationConfig,
} from './data-flow-manager';
export {
  markAttendance,
  recordGrade,
  recordFeePayment,
  enrollStudent,
} from './data-flow-manager';

// Data Flow Hooks
export {
  useDataFlow,
  useMarkAttendance,
  useRecordGrade,
  useRecordFeePayment,
  useEnrollStudent,
  useOperationStatus,
  useRecentOperations,
} from './use-data-flow';

// Types
export type {
  AcademicYearLocal,
  TermLocal,
  StudentLocal,
  TeacherLocal,
  SubjectLocal,
  ClassLocal,
  ApplicationLocal,
  AssessmentRecordLocal,
  AttendanceRecordLocal,
  SchoolFeesLocal,
  StudentBalanceLocal,
  InvoiceLocal,
  StudentDocumentLocal,
  CanteenCollectionLocal,
  PromotionRequestLocal,
  ReportLocal,
  ReportStatsLocal,
  SyncMetadata,
} from './indexeddb-schema';
