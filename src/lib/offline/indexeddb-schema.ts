/**
 * IndexedDB Schema - Mirrors Firebase Realtime Database Structure
 * 
 * This file defines the IndexedDB schema that EXACTLY matches the Firebase RTDB structure.
 * All field names, data types, and structures are preserved from Firebase.
 * 
 * Additional fields for offline sync:
 * - syncStatus: 'synced' | 'pending' | 'failed'
 * - localUpdatedAt: timestamp of last local modification
 * - lastSyncedAt: timestamp of last successful sync
 */

// ===== SYNC METADATA =====
export interface SyncMetadata {
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number; // milliseconds
  lastSyncedAt?: number; // milliseconds
}

// ===== ACADEMIC YEAR & TERM =====
export interface AcademicYearLocal {
  id: string;
  name: string; // e.g., "2025/2026"
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

export interface TermLocal {
  id: string;
  academicYearId: string;
  academicYearName: string;
  name: 'First Term' | 'Second Term' | 'Third Term';
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  isCurrentTerm: boolean;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== STUDENTS =====
export interface StudentLocal {
  id: string;
  studentCode?: string; // MAJE-YYYY-NNN
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  className: string;
  previousClass?: string;
  academicYear?: string;
  previousAcademicYear?: string;
  termId?: string;
  termName?: string;
  parentName: string;
  parentPhone: string;
  parentWhatsApp: string;
  parentEmail: string;
  address: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated';
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== TEACHERS =====
export interface TeacherLocal {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employeeId: string;
  department: string;
  position: string;
  qualifications: string[];
  subjects: string[];
  dateOfJoining: string;
  salary: number;
  status: 'active' | 'inactive' | 'terminated';
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== SUBJECTS =====
export interface SubjectLocal {
  id: string;
  name: string;
  code?: string;
  description?: string;
  category?: 'core' | 'elective' | 'extracurricular';
  grade?: string;
  department?: string;
  credits?: number;
  teacherId?: string;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== CLASSES =====
export interface ClassLocal {
  id: string;
  className: string;
  name?: string;
  section?: string;
  academicYear?: string;
  subjectId?: string;
  teacherIds?: string[];
  room?: string;
  capacity?: number;
  currentStrength?: number;
  subjects?: string[];
  schedule?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
  };
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== APPLICATIONS =====
export interface ApplicationLocal {
  id: string;
  studentName: string;
  parentName: string;
  className: string;
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  phone?: string;
  email?: string;
  previousSchool?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== ASSESSMENTS / GRADES =====
export type AssessmentTypeLocal = 'assignment' | 'exercise' | 'exam' | 'quiz' | 'project' | 'test' | 'classwork' | 'homework';

export interface AssessmentRecordLocal {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  assessmentType: AssessmentTypeLocal;
  description?: string;
  score: number;
  maxScore: number;
  date: string; // ISO date
  termId?: string;
  termName?: string;
  academicYearId?: string;
  academicYearName?: string;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== ATTENDANCE =====
export interface AttendanceEntryLocal {
  studentId: string;
  status: 'present' | 'absent' | 'late';
}

export interface AttendanceRecordLocal {
  id: string;
  classId: string;
  teacherId: string;
  date: string; // yyyy-mm-dd
  entries: AttendanceEntryLocal[];
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== SCHOOL FEES =====
export interface SchoolFeesLocal {
  id: string;
  className: string;
  tuitionFees: number;
  examFees: number;
  activityFees: number;
  otherFees: number;
  totalFees: number;
  academicYear: string;
  termId?: string;
  termName?: string;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

export interface StudentBalanceLocal {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  totalFees: number;
  amountPaid: number;
  balance: number;
  lastPaymentDate?: string;
  status: 'paid' | 'partial' | 'overdue';
  termId?: string;
  termName?: string;
  academicYearId?: string;
  academicYearName?: string;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== INVOICES =====
export interface InvoiceLocal {
  id: string;
  studentId: string;
  studentName: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentDate?: string | null;
  termId?: string;
  termName?: string;
  academicYearId?: string;
  academicYearName?: string;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== STUDENT DOCUMENTS =====
export interface StudentDocumentLocal {
  id: string;
  studentId: string;
  studentName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadDate: string;
  description?: string;
  category?: 'ID' | 'Certificate' | 'Medical' | 'Report' | 'Other';
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== CANTEEN COLLECTIONS =====
export interface CanteenCollectionLocal {
  id: string;
  date: string;
  totalAmount: number;
  numberOfStudents?: number;
  proofDocUrl?: string;
  proofDocName?: string;
  proofDocType?: string;
  notes?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== PROMOTION REQUESTS =====
export interface PromotionDecisionLocal {
  studentId: string;
  studentName: string;
  currentClass: string;
  decision: 'promote' | 'repeat';
  targetClass?: string;
  comment?: string;
}

export interface PromotionRequestLocal {
  id: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  academicYear: string;
  decisions: PromotionDecisionLocal[];
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminComments?: string;
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== REPORTS =====
export interface ReportLocal {
  id: string;
  title: string;
  description: string;
  category: 'Academic' | 'Finance' | 'Administrative';
  lastGenerated?: string;
  format: string;
  icon?: string;
  status?: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

export interface ReportStatsLocal {
  reportsGenerated: number;
  downloads: number;
  activeReports: number;
  lastUpdated: string;
  // Sync metadata
  syncStatus: 'synced' | 'pending' | 'failed';
  localUpdatedAt: number;
  lastSyncedAt?: number;
}

// ===== DATABASE SCHEMA DEFINITION =====
export const DB_NAME = 'MichaelSchoolPortalDB';
export const DB_VERSION = 1;

export interface ObjectStoreConfig {
  name: string;
  keyPath: string;
  autoIncrement: boolean;
  indexes: {
    name: string;
    keyPath: string | string[];
    options?: IDBIndexParameters;
  }[];
}

export const OBJECT_STORES: ObjectStoreConfig[] = [
  {
    name: 'academicYears',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'status', keyPath: 'status' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'terms',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'academicYearId', keyPath: 'academicYearId' },
      { name: 'status', keyPath: 'status' },
      { name: 'isCurrentTerm', keyPath: 'isCurrentTerm' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'students',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'studentCode', keyPath: 'studentCode' },
      { name: 'className', keyPath: 'className' },
      { name: 'status', keyPath: 'status' },
      { name: 'academicYear', keyPath: 'academicYear' },
      { name: 'termId', keyPath: 'termId' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
      { name: 'classNameStatus', keyPath: ['className', 'status'] },
    ],
  },
  {
    name: 'teachers',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'employeeId', keyPath: 'employeeId' },
      { name: 'department', keyPath: 'department' },
      { name: 'status', keyPath: 'status' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'subjects',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'code', keyPath: 'code' },
      { name: 'teacherId', keyPath: 'teacherId' },
      { name: 'status', keyPath: 'status' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'classes',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'className', keyPath: 'className' },
      { name: 'academicYear', keyPath: 'academicYear' },
      { name: 'status', keyPath: 'status' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'applications',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'status', keyPath: 'status' },
      { name: 'className', keyPath: 'className' },
      { name: 'appliedDate', keyPath: 'appliedDate' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'assessments',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'studentId', keyPath: 'studentId' },
      { name: 'classId', keyPath: 'classId' },
      { name: 'subjectId', keyPath: 'subjectId' },
      { name: 'teacherId', keyPath: 'teacherId' },
      { name: 'termId', keyPath: 'termId' },
      { name: 'date', keyPath: 'date' },
      { name: 'assessmentType', keyPath: 'assessmentType' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
      { name: 'studentIdTermId', keyPath: ['studentId', 'termId'] },
    ],
  },
  {
    name: 'attendance',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'classId', keyPath: 'classId' },
      { name: 'teacherId', keyPath: 'teacherId' },
      { name: 'date', keyPath: 'date' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
      { name: 'classIdDate', keyPath: ['classId', 'date'] },
    ],
  },
  {
    name: 'schoolFees',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'className', keyPath: 'className' },
      { name: 'academicYear', keyPath: 'academicYear' },
      { name: 'termId', keyPath: 'termId' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'studentBalances',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'studentId', keyPath: 'studentId' },
      { name: 'className', keyPath: 'className' },
      { name: 'status', keyPath: 'status' },
      { name: 'termId', keyPath: 'termId' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'invoices',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'studentId', keyPath: 'studentId' },
      { name: 'status', keyPath: 'status' },
      { name: 'dueDate', keyPath: 'dueDate' },
      { name: 'termId', keyPath: 'termId' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'studentDocuments',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'studentId', keyPath: 'studentId' },
      { name: 'category', keyPath: 'category' },
      { name: 'uploadDate', keyPath: 'uploadDate' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'canteenCollections',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'date', keyPath: 'date' },
      { name: 'recordedBy', keyPath: 'recordedBy' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'promotionRequests',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'teacherId', keyPath: 'teacherId' },
      { name: 'classId', keyPath: 'classId' },
      { name: 'status', keyPath: 'status' },
      { name: 'academicYear', keyPath: 'academicYear' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'reports',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'category', keyPath: 'category' },
      { name: 'status', keyPath: 'status' },
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
  {
    name: 'reportStats',
    keyPath: 'id',
    autoIncrement: false,
    indexes: [
      { name: 'syncStatus', keyPath: 'syncStatus' },
      { name: 'localUpdatedAt', keyPath: 'localUpdatedAt' },
    ],
  },
];
