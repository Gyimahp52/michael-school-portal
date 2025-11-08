/**
 * IndexedDB CRUD Operations
 * 
 * Provides CRUD operations for all collections that mirror Firebase operations.
 * All operations maintain the same interface as Firebase but work with IndexedDB.
 */

import { indexedDBManager } from './indexeddb-manager';
import type {
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
} from './indexeddb-schema';

// ===== HELPER FUNCTIONS =====

/**
 * Generate a unique ID similar to Firebase push IDs
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${randomStr}`;
}

/**
 * Add sync metadata to an item
 */
export function addSyncMetadata<T>(item: T, syncStatus: 'synced' | 'pending' | 'failed' = 'pending'): T & {
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

// ===== ACADEMIC YEARS =====

export async function createAcademicYear(
  year: Omit<AcademicYearLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const yearData: AcademicYearLocal = addSyncMetadata({
    ...year,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('academicYears', yearData);
  return id;
}

export async function getAllAcademicYears(): Promise<AcademicYearLocal[]> {
  return indexedDBManager.getAllFromStore<AcademicYearLocal>('academicYears');
}

export async function getAcademicYear(id: string): Promise<AcademicYearLocal | undefined> {
  return indexedDBManager.getFromStore<AcademicYearLocal>('academicYears', id);
}

export async function updateAcademicYear(id: string, updates: Partial<AcademicYearLocal>): Promise<void> {
  const existing = await getAcademicYear(id);
  if (!existing) throw new Error(`Academic year ${id} not found`);
  
  const updated: AcademicYearLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('academicYears', updated);
}

export async function deleteAcademicYear(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('academicYears', id);
}

export async function getCurrentAcademicYear(): Promise<AcademicYearLocal | null> {
  const years = await indexedDBManager.queryByIndex<AcademicYearLocal>(
    'academicYears',
    'status',
    'active'
  );
  return years[0] || null;
}

// ===== TERMS =====

export async function createTerm(
  term: Omit<TermLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  // If this is marked as current term, unset all other current terms
  if (term.isCurrentTerm) {
    const allTerms = await getAllTerms();
    for (const t of allTerms) {
      if (t.isCurrentTerm) {
        await updateTerm(t.id, { isCurrentTerm: false });
      }
    }
  }
  
  const termData: TermLocal = addSyncMetadata({
    ...term,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('terms', termData);
  return id;
}

export async function getAllTerms(): Promise<TermLocal[]> {
  return indexedDBManager.getAllFromStore<TermLocal>('terms');
}

export async function getTerm(id: string): Promise<TermLocal | undefined> {
  return indexedDBManager.getFromStore<TermLocal>('terms', id);
}

export async function updateTerm(id: string, updates: Partial<TermLocal>): Promise<void> {
  const existing = await getTerm(id);
  if (!existing) throw new Error(`Term ${id} not found`);
  
  // If setting this as current term, unset all others
  if (updates.isCurrentTerm === true) {
    const allTerms = await getAllTerms();
    for (const t of allTerms) {
      if (t.isCurrentTerm && t.id !== id) {
        const updated = addSyncMetadata({ ...t, isCurrentTerm: false, updatedAt: new Date().toISOString() });
        await indexedDBManager.putInStore('terms', updated);
      }
    }
  }
  
  const updated: TermLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('terms', updated);
}

export async function deleteTerm(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('terms', id);
}

export async function getCurrentTerm(): Promise<TermLocal | null> {
  const terms = await indexedDBManager.queryByIndex<TermLocal>(
    'terms',
    'isCurrentTerm',
    IDBKeyRange.only(true)
  );
  return terms[0] || null;
}

export async function getTermsByAcademicYear(academicYearId: string): Promise<TermLocal[]> {
  return indexedDBManager.queryByIndex<TermLocal>(
    'terms',
    'academicYearId',
    academicYearId
  );
}

// ===== STUDENTS =====

export async function generateStudentCode(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const students = await getAllStudents();
  
  const existingCodes = new Set<string>();
  students.forEach((student) => {
    if (student.studentCode?.startsWith(`MAJE-${currentYear}-`)) {
      existingCodes.add(student.studentCode);
    }
  });
  
  let nextNumber = 1;
  let newCode = '';
  do {
    const numberStr = String(nextNumber).padStart(3, '0');
    newCode = `MAJE-${currentYear}-${numberStr}`;
    nextNumber++;
  } while (existingCodes.has(newCode));
  
  return newCode;
}

export async function createStudent(
  student: Omit<StudentLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const studentCode = student.studentCode || await generateStudentCode();
  
  const studentData: StudentLocal = addSyncMetadata({
    ...student,
    studentCode,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('students', studentData);
  return id;
}

export async function getAllStudents(): Promise<StudentLocal[]> {
  return indexedDBManager.getAllFromStore<StudentLocal>('students');
}

export async function getStudent(id: string): Promise<StudentLocal | undefined> {
  return indexedDBManager.getFromStore<StudentLocal>('students', id);
}

export async function updateStudent(id: string, updates: Partial<StudentLocal>): Promise<void> {
  const existing = await getStudent(id);
  if (!existing) throw new Error(`Student ${id} not found`);
  
  const updated: StudentLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('students', updated);
}

export async function deleteStudent(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('students', id);
}

export async function getStudentsByClass(className: string): Promise<StudentLocal[]> {
  const students = await indexedDBManager.queryByIndex<StudentLocal>(
    'students',
    'className',
    className
  );
  return students.filter(s => s.status === 'active');
}

// ===== TEACHERS =====

export async function createTeacher(
  teacher: Omit<TeacherLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const teacherData: TeacherLocal = addSyncMetadata({
    ...teacher,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('teachers', teacherData);
  return id;
}

export async function getAllTeachers(): Promise<TeacherLocal[]> {
  return indexedDBManager.getAllFromStore<TeacherLocal>('teachers');
}

export async function getTeacher(id: string): Promise<TeacherLocal | undefined> {
  return indexedDBManager.getFromStore<TeacherLocal>('teachers', id);
}

export async function updateTeacher(id: string, updates: Partial<TeacherLocal>): Promise<void> {
  const existing = await getTeacher(id);
  if (!existing) throw new Error(`Teacher ${id} not found`);
  
  const updated: TeacherLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('teachers', updated);
}

export async function deleteTeacher(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('teachers', id);
}

// ===== SUBJECTS =====

export async function createSubject(
  subject: Omit<SubjectLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const subjectData: SubjectLocal = addSyncMetadata({
    ...subject,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('subjects', subjectData);
  return id;
}

export async function getAllSubjects(): Promise<SubjectLocal[]> {
  return indexedDBManager.getAllFromStore<SubjectLocal>('subjects');
}

export async function getSubject(id: string): Promise<SubjectLocal | undefined> {
  return indexedDBManager.getFromStore<SubjectLocal>('subjects', id);
}

export async function updateSubject(id: string, updates: Partial<SubjectLocal>): Promise<void> {
  const existing = await getSubject(id);
  if (!existing) throw new Error(`Subject ${id} not found`);
  
  const updated: SubjectLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('subjects', updated);
}

export async function deleteSubject(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('subjects', id);
}

// ===== CLASSES =====

export async function createClass(
  classData: Omit<ClassLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const classInfo: ClassLocal = addSyncMetadata({
    ...classData,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('classes', classInfo);
  return id;
}

export async function getAllClasses(): Promise<ClassLocal[]> {
  return indexedDBManager.getAllFromStore<ClassLocal>('classes');
}

export async function getClass(id: string): Promise<ClassLocal | undefined> {
  return indexedDBManager.getFromStore<ClassLocal>('classes', id);
}

export async function updateClass(id: string, updates: Partial<ClassLocal>): Promise<void> {
  const existing = await getClass(id);
  if (!existing) throw new Error(`Class ${id} not found`);
  
  const updated: ClassLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('classes', updated);
}

export async function deleteClass(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('classes', id);
}

// ===== APPLICATIONS =====

export async function createApplication(
  application: Omit<ApplicationLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const appData: ApplicationLocal = addSyncMetadata({
    ...application,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('applications', appData);
  return id;
}

export async function getAllApplications(): Promise<ApplicationLocal[]> {
  return indexedDBManager.getAllFromStore<ApplicationLocal>('applications');
}

export async function getApplication(id: string): Promise<ApplicationLocal | undefined> {
  return indexedDBManager.getFromStore<ApplicationLocal>('applications', id);
}

export async function updateApplication(id: string, updates: Partial<ApplicationLocal>): Promise<void> {
  const existing = await getApplication(id);
  if (!existing) throw new Error(`Application ${id} not found`);
  
  const updated: ApplicationLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('applications', updated);
}

export async function deleteApplication(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('applications', id);
}

// ===== ASSESSMENTS =====

export async function createAssessmentRecord(
  record: Omit<AssessmentRecordLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const assessmentData: AssessmentRecordLocal = addSyncMetadata({
    ...record,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('assessments', assessmentData);
  return id;
}

export async function getAllAssessments(): Promise<AssessmentRecordLocal[]> {
  return indexedDBManager.getAllFromStore<AssessmentRecordLocal>('assessments');
}

export async function getAssessment(id: string): Promise<AssessmentRecordLocal | undefined> {
  return indexedDBManager.getFromStore<AssessmentRecordLocal>('assessments', id);
}

export async function updateAssessmentRecord(id: string, updates: Partial<AssessmentRecordLocal>): Promise<void> {
  const existing = await getAssessment(id);
  if (!existing) throw new Error(`Assessment ${id} not found`);
  
  const updated: AssessmentRecordLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('assessments', updated);
}

export async function deleteAssessmentRecord(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('assessments', id);
}

export async function getAssessmentsByStudent(studentId: string): Promise<AssessmentRecordLocal[]> {
  return indexedDBManager.queryByIndex<AssessmentRecordLocal>(
    'assessments',
    'studentId',
    studentId
  );
}

export async function getAssessmentsByTerm(studentId: string, termId: string): Promise<AssessmentRecordLocal[]> {
  const assessments = await indexedDBManager.queryByIndex<AssessmentRecordLocal>(
    'assessments',
    'studentIdTermId',
    [studentId, termId]
  );
  return assessments;
}

// ===== ATTENDANCE =====

export async function recordAttendance(
  record: Omit<AttendanceRecordLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const attendanceData: AttendanceRecordLocal = addSyncMetadata({
    ...record,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('attendance', attendanceData);
  return id;
}

export async function getAllAttendance(): Promise<AttendanceRecordLocal[]> {
  return indexedDBManager.getAllFromStore<AttendanceRecordLocal>('attendance');
}

export async function getAttendance(id: string): Promise<AttendanceRecordLocal | undefined> {
  return indexedDBManager.getFromStore<AttendanceRecordLocal>('attendance', id);
}

export async function updateAttendance(id: string, updates: Partial<AttendanceRecordLocal>): Promise<void> {
  const existing = await getAttendance(id);
  if (!existing) throw new Error(`Attendance ${id} not found`);
  
  const updated: AttendanceRecordLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('attendance', updated);
}

export async function deleteAttendance(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('attendance', id);
}

export async function getAttendanceByClass(classId: string): Promise<AttendanceRecordLocal[]> {
  return indexedDBManager.queryByIndex<AttendanceRecordLocal>(
    'attendance',
    'classId',
    classId
  );
}

export async function getAttendanceByDate(classId: string, date: string): Promise<AttendanceRecordLocal[]> {
  return indexedDBManager.queryByIndex<AttendanceRecordLocal>(
    'attendance',
    'classIdDate',
    [classId, date]
  );
}

// ===== SCHOOL FEES =====

export async function createSchoolFees(
  fees: Omit<SchoolFeesLocal, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const id = generateId();
  const now = new Date().toISOString();
  
  const feesData: SchoolFeesLocal = addSyncMetadata({
    ...fees,
    id,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('schoolFees', feesData);
  return id;
}

export async function getAllSchoolFees(): Promise<SchoolFeesLocal[]> {
  return indexedDBManager.getAllFromStore<SchoolFeesLocal>('schoolFees');
}

export async function getSchoolFees(id: string): Promise<SchoolFeesLocal | undefined> {
  return indexedDBManager.getFromStore<SchoolFeesLocal>('schoolFees', id);
}

export async function updateSchoolFees(id: string, updates: Partial<SchoolFeesLocal>): Promise<void> {
  const existing = await getSchoolFees(id);
  if (!existing) throw new Error(`School fees ${id} not found`);
  
  const updated: SchoolFeesLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('schoolFees', updated);
}

export async function deleteSchoolFees(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('schoolFees', id);
}

// ===== STUDENT BALANCES =====

export async function createStudentBalance(
  balance: Omit<StudentBalanceLocal, 'createdAt' | 'updatedAt' | 'syncStatus' | 'localUpdatedAt' | 'lastSyncedAt'>
): Promise<string> {
  const now = new Date().toISOString();
  
  const balanceData: StudentBalanceLocal = addSyncMetadata({
    ...balance,
    createdAt: now,
    updatedAt: now,
  });
  
  await indexedDBManager.putInStore('studentBalances', balanceData);
  return balance.id;
}

export async function getAllStudentBalances(): Promise<StudentBalanceLocal[]> {
  return indexedDBManager.getAllFromStore<StudentBalanceLocal>('studentBalances');
}

export async function getStudentBalance(id: string): Promise<StudentBalanceLocal | undefined> {
  return indexedDBManager.getFromStore<StudentBalanceLocal>('studentBalances', id);
}

export async function updateStudentBalance(id: string, updates: Partial<StudentBalanceLocal>): Promise<void> {
  const existing = await getStudentBalance(id);
  if (!existing) throw new Error(`Student balance ${id} not found`);
  
  const updated: StudentBalanceLocal = addSyncMetadata({
    ...existing,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  });
  
  await indexedDBManager.putInStore('studentBalances', updated);
}

export async function deleteStudentBalance(id: string): Promise<void> {
  await indexedDBManager.deleteFromStore('studentBalances', id);
}

// Continue in next file due to length...
