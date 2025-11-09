/**
 * Offline-First Database Operations Bridge
 * 
 * Drop-in replacement for database-operations.ts with offline-first capabilities.
 * 
 * Usage: Replace imports in your pages:
 * FROM: import { ... } from "@/lib/database-operations"
 * TO:   import { ... } from "@/lib/database-operations-offline"
 * 
 * All write operations (create, update, delete) now:
 * 1. Save to IndexedDB first (instant)
 * 2. Update UI immediately
 * 3. Sync to Firebase in background (if online)
 * 4. Queue for later if offline
 */

// ===== RE-EXPORT ALL TYPES (UNCHANGED) =====
export type {
  Student,
  Teacher,
  Subject,
  Class,
  AcademicYear,
  Term,
  Application,
  AssessmentRecord,
  AttendanceRecordDoc,
  AttendanceEntry,
  SchoolFees,
  StudentBalance,
  Invoice,
  StudentDocument,
  CanteenCollection,
  PromotionRequest,
  PromotionDecision,
  Report,
  ReportStats,
} from './database-operations';

// ===== IMPORT OFFLINE WRAPPERS =====
import {
  offlineStudents,
  offlineTeachers,
  offlineSubjects,
  offlineClasses,
  offlineAcademicYears,
  offlineTerms,
  offlineApplications,
  offlineAssessments,
  offlineAttendance,
  offlineSchoolFees,
  offlineStudentBalances,
  offlineInvoices,
  offlineStudentDocuments,
  offlineCanteenCollections,
  offlinePromotionRequests,
} from './offline/offline-wrapper';

// Import original for read-only operations
import {
  getAllClasses as _getAllClasses,
  getCurrentTerm as _getCurrentTerm,
} from './database-operations';

// ===== STUDENTS =====
export const createStudent = offlineStudents.create;
export const updateStudent = offlineStudents.update;
export const deleteStudent = offlineStudents.delete;
export const subscribeToStudents = offlineStudents.subscribe;

// ===== TEACHERS =====
export const createTeacher = offlineTeachers.create;
export const updateTeacher = offlineTeachers.update;
export const deleteTeacher = offlineTeachers.delete;
export const subscribeToTeachers = offlineTeachers.subscribe;

// ===== SUBJECTS =====
export const createSubject = offlineSubjects.create;
export const updateSubject = offlineSubjects.update;
export const deleteSubject = offlineSubjects.delete;
export const subscribeToSubjects = offlineSubjects.subscribe;

// ===== CLASSES =====
export const createClass = offlineClasses.create;
export const updateClass = offlineClasses.update;
export const deleteClass = offlineClasses.delete;
export const subscribeToClasses = offlineClasses.subscribe;
export const getAllClasses = _getAllClasses; // Read-only, keep original

// ===== ACADEMIC YEARS =====
export const createAcademicYear = offlineAcademicYears.create;
export const updateAcademicYear = offlineAcademicYears.update;
export const deleteAcademicYear = offlineAcademicYears.delete;
export const subscribeToAcademicYears = offlineAcademicYears.subscribe;

// ===== TERMS =====
export const createTerm = offlineTerms.create;
export const updateTerm = offlineTerms.update;
export const deleteTerm = offlineTerms.delete;
export const subscribeToTerms = offlineTerms.subscribe;
export const getCurrentTerm = _getCurrentTerm; // Read-only, keep original

// ===== APPLICATIONS =====
export const createApplication = offlineApplications.create;
export const updateApplication = offlineApplications.update;
export const deleteApplication = offlineApplications.delete;
export const subscribeToApplications = offlineApplications.subscribe;

// ===== ASSESSMENTS (GRADES) =====
export const createAssessmentRecord = offlineAssessments.create;
export const updateAssessmentRecord = offlineAssessments.update;
export const deleteAssessmentRecord = offlineAssessments.delete;
export const subscribeToAssessments = offlineAssessments.subscribe;

// ===== ATTENDANCE =====
export const recordAttendance = offlineAttendance.create;
export const updateAttendance = offlineAttendance.update;
export const deleteAttendance = offlineAttendance.delete;
export const subscribeToAttendance = offlineAttendance.subscribe;

// ===== SCHOOL FEES =====
export const createSchoolFees = offlineSchoolFees.create;
export const updateSchoolFees = offlineSchoolFees.update;
export const deleteSchoolFees = offlineSchoolFees.delete;
export const subscribeToSchoolFees = offlineSchoolFees.subscribe;

// ===== STUDENT BALANCES =====
export const createStudentBalance = offlineStudentBalances.create;
export const updateStudentBalance = offlineStudentBalances.update;
export const deleteStudentBalance = offlineStudentBalances.delete;
export const subscribeToStudentBalances = offlineStudentBalances.subscribe;

// ===== INVOICES =====
export const createInvoice = offlineInvoices.create;
export const updateInvoice = offlineInvoices.update;
export const deleteInvoice = offlineInvoices.delete;
export const subscribeToInvoices = offlineInvoices.subscribe;

// ===== STUDENT DOCUMENTS =====
export const createStudentDocument = offlineStudentDocuments.create;
export const updateStudentDocument = offlineStudentDocuments.update;
export const deleteStudentDocument = offlineStudentDocuments.delete;
export const subscribeToStudentDocuments = offlineStudentDocuments.subscribe;

// ===== CANTEEN COLLECTIONS =====
export const createCanteenCollection = offlineCanteenCollections.create;
export const updateCanteenCollection = offlineCanteenCollections.update;
export const deleteCanteenCollection = offlineCanteenCollections.delete;
export const subscribeToCanteenCollections = offlineCanteenCollections.subscribe;

// ===== PROMOTION REQUESTS =====
export const createPromotionRequest = offlinePromotionRequests.create;
export const updatePromotionRequest = offlinePromotionRequests.update;
export const deletePromotionRequest = offlinePromotionRequests.delete;
export const subscribeToPromotionRequests = offlinePromotionRequests.subscribe;

// ===== SPECIAL OPERATIONS =====
// These need custom handling - for now, keep original
export { executePromotion } from './database-operations';

// ===== REPORTS =====
// Reports are read-only, keep original
export {
  subscribeToReports,
  subscribeToReportStats,
} from './database-operations';

/**
 * USAGE NOTES:
 * 
 * 1. This file provides offline-first versions of all database operations
 * 2. Write operations (create, update, delete) save to IndexedDB first
 * 3. Read operations (get, subscribe) read from IndexedDB for speed
 * 4. Auto-sync happens in background when online
 * 5. No code changes needed in your pages - just update the import path!
 * 
 * MIGRATION:
 * 
 * Search for: from "@/lib/database-operations"
 * Replace with: from "@/lib/database-operations-offline"
 * 
 * That's it! Offline mode activated.
 */
