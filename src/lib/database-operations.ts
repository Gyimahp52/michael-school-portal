import { ref, push, set, get, update, remove, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

// ===== ACADEMIC YEAR & TERM OPERATIONS =====
export interface AcademicYear {
  id?: string;
  name: string; // e.g., "2025/2026"
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface Term {
  id?: string;
  academicYearId: string;
  academicYearName: string;
  name: 'First Term' | 'Second Term' | 'Third Term';
  startDate: string;
  endDate: string;
  status: 'active' | 'upcoming' | 'completed';
  isCurrentTerm: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const createAcademicYear = async (year: Omit<AcademicYear, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const yearsRef = ref(rtdb, 'academicYears');
    const newYearRef = push(yearsRef);
    
    const yearData = {
      ...year,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newYearRef, yearData);
    return newYearRef.key!;
  } catch (error) {
    console.error('Error creating academic year:', error);
    throw error;
  }
};

export const getAllAcademicYears = async (): Promise<AcademicYear[]> => {
  try {
    const yearsRef = ref(rtdb, 'academicYears');
    const snapshot = await get(yearsRef);
    
    if (!snapshot.exists()) return [];
    
    const yearsData = snapshot.val();
    return Object.keys(yearsData).map(key => ({
      id: key,
      ...yearsData[key]
    }));
  } catch (error) {
    console.error('Error fetching academic years:', error);
    throw error;
  }
};

export const subscribeToAcademicYears = (callback: (years: AcademicYear[]) => void) => {
  const yearsRef = ref(rtdb, 'academicYears');
  return onValue(yearsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const yearsData = snapshot.val();
    const years = Object.keys(yearsData).map(key => ({
      id: key,
      ...yearsData[key]
    }));
    callback(years);
  });
};

export const updateAcademicYear = async (yearId: string, updates: Partial<AcademicYear>): Promise<void> => {
  try {
    const yearRef = ref(rtdb, `academicYears/${yearId}`);
    await update(yearRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating academic year:', error);
    throw error;
  }
};

export const createTerm = async (term: Omit<Term, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const termsRef = ref(rtdb, 'terms');
    const newTermRef = push(termsRef);
    
    // If this is marked as current term, unset all other current terms
    if (term.isCurrentTerm) {
      const allTerms = await getAllTerms();
      for (const t of allTerms) {
        if (t.isCurrentTerm && t.id) {
          await updateTerm(t.id, { isCurrentTerm: false });
        }
      }
    }
    
    const termData = {
      ...term,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newTermRef, termData);
    return newTermRef.key!;
  } catch (error) {
    console.error('Error creating term:', error);
    throw error;
  }
};

export const getAllTerms = async (): Promise<Term[]> => {
  try {
    const termsRef = ref(rtdb, 'terms');
    const snapshot = await get(termsRef);
    
    if (!snapshot.exists()) return [];
    
    const termsData = snapshot.val();
    return Object.keys(termsData).map(key => ({
      id: key,
      ...termsData[key]
    }));
  } catch (error) {
    console.error('Error fetching terms:', error);
    throw error;
  }
};

export const subscribeToTerms = (callback: (terms: Term[]) => void) => {
  const termsRef = ref(rtdb, 'terms');
  return onValue(termsRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    const termsData = snapshot.val();
    const terms = Object.keys(termsData).map(key => ({
      id: key,
      ...termsData[key]
    }));
    callback(terms);
  });
};

export const updateTerm = async (termId: string, updates: Partial<Term>): Promise<void> => {
  try {
    // If setting this as current term, unset all others
    if (updates.isCurrentTerm === true) {
      const allTerms = await getAllTerms();
      for (const t of allTerms) {
        if (t.isCurrentTerm && t.id !== termId && t.id) {
          await update(ref(rtdb, `terms/${t.id}`), { 
            isCurrentTerm: false,
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
    
    const termRef = ref(rtdb, `terms/${termId}`);
    await update(termRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating term:', error);
    throw error;
  }
};

export const getCurrentTerm = async (): Promise<Term | null> => {
  try {
    const terms = await getAllTerms();
    return terms.find(t => t.isCurrentTerm) || null;
  } catch (error) {
    console.error('Error getting current term:', error);
    return null;
  }
};

export const getTermsByAcademicYear = async (academicYearId: string): Promise<Term[]> => {
  try {
    const terms = await getAllTerms();
    return terms.filter(t => t.academicYearId === academicYearId);
  } catch (error) {
    console.error('Error getting terms by academic year:', error);
    throw error;
  }
};

// ===== STUDENT OPERATIONS =====
export interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  className: string;
  parentName: string;
  parentPhone: string;
  parentWhatsApp: string;
  parentEmail: string;
  address: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated';
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createStudent = async (student: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const studentsRef = ref(rtdb, 'students');
    const newStudentRef = push(studentsRef);
    
    const studentData = {
      ...student,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newStudentRef, studentData);
    return newStudentRef.key!;
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

export const getAllStudents = async (): Promise<Student[]> => {
  try {
    const studentsRef = ref(rtdb, 'students');
    const snapshot = await get(studentsRef);
    
    if (!snapshot.exists()) return [];
    
    const studentsData = snapshot.val();
    return Object.keys(studentsData).map(key => ({
      id: key,
      ...studentsData[key]
    }));
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

export const updateStudent = async (studentId: string, updates: Partial<Student>): Promise<void> => {
  try {
    const studentRef = ref(rtdb, `students/${studentId}`);
    await update(studentRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

export const upsertStudent = async (studentId: string, data: Partial<Student>): Promise<void> => {
  try {
    const studentRef = ref(rtdb, `students/${studentId}`);
    const snap = await get(studentRef);
    if (snap.exists()) {
      await update(studentRef, { ...data, updatedAt: new Date().toISOString() });
    } else {
      const payload = {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Student;
      await set(studentRef, payload);
    }
  } catch (error) {
    console.error('Error upserting student:', error);
    throw error;
  }
};

export const deleteStudent = async (studentId: string): Promise<void> => {
  try {
    const studentRef = ref(rtdb, `students/${studentId}`);
    await remove(studentRef);
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

// ===== TEACHER OPERATIONS =====
export interface Teacher {
  id?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export const createTeacher = async (teacher: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const teachersRef = ref(rtdb, 'teachers');
    const newTeacherRef = push(teachersRef);
    
    const teacherData = {
      ...teacher,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newTeacherRef, teacherData);
    return newTeacherRef.key!;
  } catch (error) {
    console.error('Error creating teacher:', error);
    throw error;
  }
};

export const getAllTeachers = async (): Promise<Teacher[]> => {
  try {
    const teachersRef = ref(rtdb, 'teachers');
    const snapshot = await get(teachersRef);
    
    if (!snapshot.exists()) return [];
    
    const teachersData = snapshot.val();
    return Object.keys(teachersData).map(key => ({
      id: key,
      ...teachersData[key]
    }));
  } catch (error) {
    console.error('Error fetching teachers:', error);
    throw error;
  }
};

export const updateTeacher = async (teacherId: string, updates: Partial<Teacher>): Promise<void> => {
  try {
    const teacherRef = ref(rtdb, `teachers/${teacherId}`);
    await update(teacherRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating teacher:', error);
    throw error;
  }
};

// ===== SUBJECT OPERATIONS =====
export interface Subject {
  id?: string;
  name: string;
  code?: string;
  description?: string;
  category?: 'core' | 'elective' | 'extracurricular';
  grade?: string;
  department?: string;
  credits?: number;
  teacherId?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export const createSubject = async (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const subjectsRef = ref(rtdb, 'subjects');
    const newSubjectRef = push(subjectsRef);
    
    const subjectData = {
      ...subject,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newSubjectRef, subjectData);
    return newSubjectRef.key!;
  } catch (error) {
    console.error('Error creating subject:', error);
    throw error;
  }
};

export const getAllSubjects = async (): Promise<Subject[]> => {
  try {
    const subjectsRef = ref(rtdb, 'subjects');
    const snapshot = await get(subjectsRef);
    
    if (!snapshot.exists()) return [];
    
    const subjectsData = snapshot.val();
    return Object.keys(subjectsData).map(key => ({
      id: key,
      ...subjectsData[key]
    }));
  } catch (error) {
    console.error('Error fetching subjects:', error);
    throw error;
  }
};

export const updateSubject = async (subjectId: string, updates: Partial<Subject>): Promise<void> => {
  try {
    const subjectRef = ref(rtdb, `subjects/${subjectId}`);
    await update(subjectRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    throw error;
  }
};

// ===== CLASS OPERATIONS =====
export interface Class {
  id?: string;
  className: string;
  name?: string;
  section?: string;
  academicYear?: string;
  // Subject is optional now
  subjectId?: string;
  // Support multiple teachers
  teacherIds?: string[];
  room?: string;
  capacity?: number;
  currentStrength?: number;
  subjects?: string[];
  // Weekly schedule is optional; keep shape for future use
  schedule?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
  };
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface ClassSchedule {
  day: string;
  periods: {
    time: string;
    subjectId: string;
    teacherId: string;
  }[];
}

export const createClass = async (classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const classesRef = ref(rtdb, 'classes');
    const newClassRef = push(classesRef);
    
    const classInfo = {
      ...classData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newClassRef, classInfo);
    return newClassRef.key!;
  } catch (error) {
    console.error('Error creating class:', error);
    throw error;
  }
};

export const getAllClasses = async (): Promise<Class[]> => {
  try {
    const classesRef = ref(rtdb, 'classes');
    const snapshot = await get(classesRef);
    
    if (!snapshot.exists()) return [];
    
    const classesData = snapshot.val();
    return Object.keys(classesData).map(key => ({
      id: key,
      ...classesData[key]
    }));
  } catch (error) {
    console.error('Error fetching classes:', error);
    throw error;
  }
};

export const updateClass = async (classId: string, updates: Partial<Class>): Promise<void> => {
  try {
    const classRef = ref(rtdb, `classes/${classId}`);
    await update(classRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating class:', error);
    throw error;
  }
};

// ===== REAL-TIME LISTENERS =====
export const subscribeToStudents = (callback: (students: Student[]) => void): (() => void) => {
  const studentsRef = ref(rtdb, 'students');
  
  const unsubscribe = onValue(studentsRef, (snapshot) => {
    if (snapshot.exists()) {
      const studentsData = snapshot.val();
      const students = Object.keys(studentsData).map(key => ({
        id: key,
        ...studentsData[key]
      }));
      callback(students);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

export const subscribeToTeachers = (callback: (teachers: Teacher[]) => void): (() => void) => {
  const teachersRef = ref(rtdb, 'teachers');
  
  const unsubscribe = onValue(teachersRef, (snapshot) => {
    if (snapshot.exists()) {
      const teachersData = snapshot.val();
      const teachers = Object.keys(teachersData).map(key => ({
        id: key,
        ...teachersData[key]
      }));
      callback(teachers);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

export const subscribeToSubjects = (callback: (subjects: Subject[]) => void): (() => void) => {
  const subjectsRef = ref(rtdb, 'subjects');
  
  const unsubscribe = onValue(subjectsRef, (snapshot) => {
    if (snapshot.exists()) {
      const subjectsData = snapshot.val();
      const subjects = Object.keys(subjectsData).map(key => ({
        id: key,
        ...subjectsData[key]
      }));
      callback(subjects);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

export const subscribeToClasses = (callback: (classes: Class[]) => void): (() => void) => {
  const classesRef = ref(rtdb, 'classes');
  
  const unsubscribe = onValue(classesRef, (snapshot) => {
    if (snapshot.exists()) {
      const classesData = snapshot.val();
      const classes = Object.keys(classesData).map(key => ({
        id: key,
        ...classesData[key]
      }));
      callback(classes);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

// ===== ADMISSIONS/APPLICATIONS =====
export interface Application {
  id?: string;
  studentName: string;
  parentName: string;
  className: string;
  appliedDate: string;
  status: 'pending' | 'approved' | 'rejected';
  phone?: string;
  email?: string;
  previousSchool?: string;
  reason?: string;
}

export const subscribeToApplications = (callback: (apps: Application[]) => void): (() => void) => {
  const appsRef = ref(rtdb, 'applications');
  const unsubscribe = onValue(appsRef, (snapshot) => {
    if (snapshot.exists()) {
      const appsData = snapshot.val();
      const apps = Object.keys(appsData).map(key => ({ id: key, ...appsData[key] }));
      callback(apps);
    } else {
      callback([]);
    }
  });
  return unsubscribe;
};

export const createApplication = async (application: Omit<Application, 'id'>): Promise<string> => {
  try {
    const applicationsRef = ref(rtdb, 'applications');
    const newApplicationRef = push(applicationsRef);
    
    const applicationData = {
      ...application,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newApplicationRef, applicationData);
    return newApplicationRef.key!;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};

// ===== BILLING/INVOICES =====
export interface Invoice {
  id?: string;
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
}

export const createInvoice = async (invoice: Omit<Invoice, 'id'>): Promise<string> => {
  try {
    const invoicesRef = ref(rtdb, 'invoices');
    const newInvoiceRef = push(invoicesRef);
    
    const invoiceData = {
      ...invoice,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newInvoiceRef, invoiceData);
    return newInvoiceRef.key!;
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw error;
  }
};

export const subscribeToInvoices = (callback: (invoices: Invoice[]) => void): (() => void) => {
  const invoicesRef = ref(rtdb, 'invoices');
  const unsubscribe = onValue(invoicesRef, (snapshot) => {
    if (snapshot.exists()) {
      const invData = snapshot.val();
      const invoices = Object.keys(invData).map(key => ({ id: key, ...invData[key] }));
      callback(invoices);
    } else {
      callback([]);
    }
  });
  return unsubscribe;
};

// ===== STUDENT DOCUMENTS =====
export interface StudentDocument {
  id?: string;
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
}

export const createStudentDocument = async (doc: Omit<StudentDocument, 'id'>): Promise<string> => {
  try {
    const docsRef = ref(rtdb, 'studentDocuments');
    const newDocRef = push(docsRef);
    
    const docData = {
      ...doc,
      uploadDate: new Date().toISOString()
    };
    
    await set(newDocRef, docData);
    return newDocRef.key!;
  } catch (error) {
    console.error('Error creating student document:', error);
    throw error;
  }
};

export const subscribeToStudentDocuments = (
  studentId: string,
  callback: (docs: StudentDocument[]) => void
): (() => void) => {
  const docsRef = ref(rtdb, 'studentDocuments');
  const unsubscribe = onValue(docsRef, (snapshot) => {
    if (snapshot.exists()) {
      const docsData = snapshot.val();
      const allDocs = Object.keys(docsData).map(key => ({ id: key, ...docsData[key] }));
      const studentDocs = allDocs.filter(doc => doc.studentId === studentId);
      callback(studentDocs);
    } else {
      callback([]);
    }
  });
  return unsubscribe;
};

// ===== CANTEEN/FEEDING FEE OPERATIONS =====
export interface CanteenCollection {
  id?: string;
  date: string;
  totalAmount: number;
  numberOfStudents?: number;
  proofDocUrl?: string;
  proofDocName?: string;
  proofDocType?: string;
  notes?: string;
  recordedBy: string;
  recordedByName: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createCanteenCollection = async (collection: Omit<CanteenCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const collectionsRef = ref(rtdb, 'canteenCollections');
    const newCollectionRef = push(collectionsRef);
    
    const collectionData = {
      ...collection,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Remove undefined fields (RTDB does not allow undefined)
    const sanitizedData = Object.fromEntries(
      Object.entries(collectionData).filter(([, v]) => v !== undefined)
    );
    
    await set(newCollectionRef, sanitizedData);
    return newCollectionRef.key!;
  } catch (error) {
    console.error('Error creating canteen collection:', error);
    throw error;
  }
};

export const subscribeToCanteenCollections = (callback: (collections: CanteenCollection[]) => void): (() => void) => {
  const collectionsRef = ref(rtdb, 'canteenCollections');
  const unsubscribe = onValue(collectionsRef, (snapshot) => {
    if (snapshot.exists()) {
      const collectionsData = snapshot.val();
      const collections = Object.keys(collectionsData)
        .map(key => ({ id: key, ...collectionsData[key] }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      callback(collections);
    } else {
      callback([]);
    }
  });
  return unsubscribe;
};

export const updateCanteenCollection = async (collectionId: string, updates: Partial<CanteenCollection>): Promise<void> => {
  try {
    const collectionRef = ref(rtdb, `canteenCollections/${collectionId}`);
    const payload = {
      ...updates,
      updatedAt: new Date().toISOString()
    };
    const sanitized = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined)
    );
    await update(collectionRef, sanitized);
  } catch (error) {
    console.error('Error updating canteen collection:', error);
    throw error;
  }
};

export const deleteCanteenCollection = async (collectionId: string): Promise<void> => {
  try {
    const collectionRef = ref(rtdb, `canteenCollections/${collectionId}`);
    await remove(collectionRef);
  } catch (error) {
    console.error('Error deleting canteen collection:', error);
    throw error;
  }
};

export const deleteStudentDocument = async (docId: string): Promise<void> => {
  try {
    const docRef = ref(rtdb, `studentDocuments/${docId}`);
    await remove(docRef);
  } catch (error) {
    console.error('Error deleting student document:', error);
    throw error;
  }
};

// ===== REPORTS =====
export interface Report {
  id?: string;
  title: string;
  description: string;
  category: 'Academic' | 'Finance' | 'Administrative';
  lastGenerated?: string;
  format: string;
  icon?: string;
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface ReportStats {
  reportsGenerated: number;
  downloads: number;
  activeReports: number;
  lastUpdated: string;
}

export const createReport = async (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const reportsRef = ref(rtdb, 'reports');
    const newReportRef = push(reportsRef);
    
    const reportData = {
      ...report,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newReportRef, reportData);
    return newReportRef.key!;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

export const getAllReports = async (): Promise<Report[]> => {
  try {
    const reportsRef = ref(rtdb, 'reports');
    const snapshot = await get(reportsRef);
    
    if (!snapshot.exists()) return [];
    
    const reportsData = snapshot.val();
    return Object.keys(reportsData).map(key => ({
      id: key,
      ...reportsData[key]
    }));
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const subscribeToReports = (callback: (reports: Report[]) => void): (() => void) => {
  const reportsRef = ref(rtdb, 'reports');
  
  const unsubscribe = onValue(reportsRef, (snapshot) => {
    if (snapshot.exists()) {
      const reportsData = snapshot.val();
      const reports = Object.keys(reportsData).map(key => ({
        id: key,
        ...reportsData[key]
      }));
      callback(reports);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

export const subscribeToReportStats = (callback: (stats: ReportStats) => void): (() => void) => {
  const statsRef = ref(rtdb, 'reportStats');
  
  const unsubscribe = onValue(statsRef, (snapshot) => {
    if (snapshot.exists()) {
      const statsData = snapshot.val();
      callback(statsData);
    } else {
      // Default stats if none exist
      callback({
        reportsGenerated: 0,
        downloads: 0,
        activeReports: 0,
        lastUpdated: new Date().toISOString()
      });
    }
  });
  
  return unsubscribe;
};

export const updateReportStats = async (updates: Partial<ReportStats>): Promise<void> => {
  try {
    const statsRef = ref(rtdb, 'reportStats');
    await update(statsRef, {
      ...updates,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating report stats:', error);
    throw error;
  }
};

// ===== SCHOOL FEES MANAGEMENT =====
export interface SchoolFees {
  id?: string;
  className: string;
  tuitionFees: number;
  examFees: number;
  activityFees: number;
  otherFees: number;
  totalFees: number;
  academicYear: string;
  termId?: string;
  termName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentBalance {
  id?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export const createSchoolFees = async (fees: Omit<SchoolFees, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const feesRef = ref(rtdb, 'schoolFees');
    const newFeesRef = push(feesRef);
    
    const feesData = {
      ...fees,
      totalFees: fees.tuitionFees + fees.examFees + fees.activityFees + fees.otherFees,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(newFeesRef, feesData);
    return newFeesRef.key!;
  } catch (error) {
    console.error('Error creating school fees:', error);
    throw error;
  }
};

export const getAllSchoolFees = async (): Promise<SchoolFees[]> => {
  try {
    const feesRef = ref(rtdb, 'schoolFees');
    const snapshot = await get(feesRef);
    
    if (!snapshot.exists()) return [];
    
    const feesData = snapshot.val();
    return Object.keys(feesData).map(key => ({
      id: key,
      ...feesData[key]
    }));
  } catch (error) {
    console.error('Error fetching school fees:', error);
    throw error;
  }
};

export const updateSchoolFees = async (feesId: string, updates: Partial<SchoolFees>): Promise<void> => {
  try {
    const feesRef = ref(rtdb, `schoolFees/${feesId}`);
    await update(feesRef, {
      ...updates,
      totalFees: (updates.tuitionFees || 0) + (updates.examFees || 0) + (updates.activityFees || 0) + (updates.otherFees || 0),
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating school fees:', error);
    throw error;
  }
};

export const subscribeToSchoolFees = (callback: (fees: SchoolFees[]) => void): (() => void) => {
  const feesRef = ref(rtdb, 'schoolFees');
  
  const unsubscribe = onValue(feesRef, (snapshot) => {
    if (snapshot.exists()) {
      const feesData = snapshot.val();
      const fees = Object.keys(feesData).map(key => ({
        id: key,
        ...feesData[key]
      }));
      callback(fees);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

export const createStudentBalance = async (balance: Omit<StudentBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    // Use studentId as the record key to ensure updates are simple and idempotent
    const balanceRef = ref(rtdb, `studentBalances/${balance.studentId}`);
    
    const balanceData = {
      ...balance,
      balance: balance.totalFees - balance.amountPaid,
      status: balance.amountPaid >= balance.totalFees ? 'paid' : 
              balance.amountPaid > 0 ? 'partial' : 'overdue',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await set(balanceRef, balanceData);
    return balance.studentId;
  } catch (error) {
    console.error('Error creating student balance:', error);
    throw error;
  }
};

export const updateStudentBalance = async (studentId: string, paymentAmount: number): Promise<void> => {
  try {
    const balanceRef = ref(rtdb, `studentBalances/${studentId}`);
    const snapshot = await get(balanceRef);
    
    if (snapshot.exists()) {
      const currentBalance = snapshot.val();
      const newAmountPaid = currentBalance.amountPaid + paymentAmount;
      const newBalance = currentBalance.totalFees - newAmountPaid;
      const newStatus = newAmountPaid >= currentBalance.totalFees ? 'paid' : 
                       newAmountPaid > 0 ? 'partial' : 'overdue';
      
      await update(balanceRef, {
        amountPaid: newAmountPaid,
        balance: newBalance,
        status: newStatus,
        lastPaymentDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Fallback: handle legacy records created with push() by searching for the student's balance
      const balancesRootRef = ref(rtdb, 'studentBalances');
      const allSnapshot = await get(balancesRootRef);
      if (allSnapshot.exists()) {
        const data = allSnapshot.val();
        const legacyKey = Object.keys(data).find(key => data[key]?.studentId === studentId);
        if (legacyKey) {
          const legacyRef = ref(rtdb, `studentBalances/${legacyKey}`);
          const current = data[legacyKey];
          const newAmountPaid = (current.amountPaid || 0) + paymentAmount;
          const newBalance = (current.totalFees || 0) - newAmountPaid;
          const newStatus = newAmountPaid >= (current.totalFees || 0) ? 'paid' : newAmountPaid > 0 ? 'partial' : 'overdue';
          await update(legacyRef, {
            amountPaid: newAmountPaid,
            balance: newBalance,
            status: newStatus,
            lastPaymentDate: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }
  } catch (error) {
    console.error('Error updating student balance:', error);
    throw error;
  }
};

export const subscribeToStudentBalances = (callback: (balances: StudentBalance[]) => void): (() => void) => {
  const balancesRef = ref(rtdb, 'studentBalances');
  
  const unsubscribe = onValue(balancesRef, (snapshot) => {
    if (snapshot.exists()) {
      const balancesData = snapshot.val();
      const balances = Object.keys(balancesData).map(key => ({
        id: key,
        ...balancesData[key]
      }));
      callback(balances);
    } else {
      callback([]);
    }
  });
  
  return unsubscribe;
};

// ===== ASSESSMENTS / GRADES =====
export type AssessmentType = 'assignment' | 'exercise' | 'exam';

export interface AssessmentRecord {
	id?: string;
	studentId: string;
	studentName: string;
	classId: string;
	subjectId: string;
	teacherId: string;
	assessmentType: AssessmentType;
	description?: string;
	score: number;
	maxScore: number;
	date: string; // ISO date
	termId?: string;
	termName?: string;
	academicYearId?: string;
	academicYearName?: string;
	createdAt?: string;
	updatedAt?: string;
}

export const createAssessmentRecord = async (record: Omit<AssessmentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
	try {
		const assessmentsRef = ref(rtdb, 'assessments');
		const newRef = push(assessmentsRef);
		const data = {
			...record,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		await set(newRef, data);
		return newRef.key!;
	} catch (error) {
		console.error('Error creating assessment record:', error);
		throw error;
	}
};

export const subscribeToAssessments = (callback: (assessments: AssessmentRecord[]) => void): (() => void) => {
	const assessmentsRef = ref(rtdb, 'assessments');
	const unsubscribe = onValue(assessmentsRef, (snapshot) => {
		if (snapshot.exists()) {
			const data = snapshot.val();
			const items = Object.keys(data).map(key => ({ id: key, ...data[key] }));
			callback(items);
		} else {
			callback([]);
		}
	});
	return unsubscribe;
};

export const updateAssessmentRecord = async (assessmentId: string, updates: Partial<AssessmentRecord>): Promise<void> => {
	try {
		const assessmentRef = ref(rtdb, `assessments/${assessmentId}`);
		await update(assessmentRef, { ...updates, updatedAt: new Date().toISOString() });
	} catch (error) {
		console.error('Error updating assessment record:', error);
		throw error;
	}
};

export const deleteAssessmentRecord = async (assessmentId: string): Promise<void> => {
	try {
		const assessmentRef = ref(rtdb, `assessments/${assessmentId}`);
		await remove(assessmentRef);
	} catch (error) {
		console.error('Error deleting assessment record:', error);
		throw error;
	}
};

// ===== ATTENDANCE =====
export interface AttendanceEntry {
	studentId: string;
	status: 'present' | 'absent' | 'late';
}

export interface AttendanceRecordDoc {
	id?: string;
	classId: string;
	teacherId: string;
	date: string; // yyyy-mm-dd
	entries: AttendanceEntry[];
	createdAt?: string;
	updatedAt?: string;
}

export const recordAttendance = async (record: Omit<AttendanceRecordDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
	try {
		const attendanceRef = ref(rtdb, 'attendance');
		const newRef = push(attendanceRef);
		const data = { ...record, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
		await set(newRef, data);
		return newRef.key!;
	} catch (error) {
		console.error('Error recording attendance:', error);
		throw error;
	}
};

export const subscribeToAttendance = (callback: (records: AttendanceRecordDoc[]) => void): (() => void) => {
	const attendanceRef = ref(rtdb, 'attendance');
	const unsubscribe = onValue(attendanceRef, (snapshot) => {
		if (snapshot.exists()) {
			const data = snapshot.val();
			const items = Object.keys(data).map(key => ({ id: key, ...data[key] }));
			callback(items);
		} else {
			callback([]);
		}
	});
	return unsubscribe;
};

// ===== PROMOTIONS =====
export interface PromotionDecision {
	studentId: string;
	studentName: string;
	currentClass: string;
	decision: 'promote' | 'repeat';
	targetClass?: string; // The class to promote to (only for promote decision)
	comment?: string;
}

export interface PromotionRequest {
	id: string;
	teacherId: string;
	teacherName: string;
	classId: string;
	className: string;
	academicYear: string;
	decisions: PromotionDecision[];
	status: 'pending' | 'approved' | 'rejected';
	submittedAt: string;
	reviewedAt?: string;
	reviewedBy?: string;
	adminComments?: string;
	createdAt: string;
	updatedAt: string;
}

export const createPromotionRequest = async (
	request: Omit<PromotionRequest, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
	try {
		const requestsRef = ref(rtdb, 'promotionRequests');
		const newRef = push(requestsRef);
		const data = {
			...request,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		};
		await set(newRef, data);
		return newRef.key!;
	} catch (error) {
		console.error('Error creating promotion request:', error);
		throw error;
	}
};

export const subscribeToPromotionRequests = (
	callback: (requests: PromotionRequest[]) => void
): (() => void) => {
	const requestsRef = ref(rtdb, 'promotionRequests');
	const unsubscribe = onValue(requestsRef, (snapshot) => {
		if (snapshot.exists()) {
			const data = snapshot.val();
			const items = Object.keys(data).map(key => ({ id: key, ...data[key] }));
			callback(items);
		} else {
			callback([]);
		}
	});
	return unsubscribe;
};

export const updatePromotionRequest = async (
	requestId: string,
	updates: Partial<PromotionRequest>
): Promise<void> => {
	try {
		const requestRef = ref(rtdb, `promotionRequests/${requestId}`);
		const snapshot = await get(requestRef);
		if (snapshot.exists()) {
			await update(requestRef, {
				...updates,
				updatedAt: new Date().toISOString(),
			});
		}
	} catch (error) {
		console.error('Error updating promotion request:', error);
		throw error;
	}
};

export const executePromotion = async (
	requestId: string,
	decisions: PromotionDecision[],
	newAcademicYear: string
): Promise<void> => {
	try {
		// Helper function to determine next class
		const getNextClass = (currentClass: string): string => {
			const classMap: Record<string, string> = {
				'Nursery 1': 'Nursery 2',
				'Nursery 2': 'KG 1',
				'KG 1': 'KG 2',
				'KG 2': 'Primary 1',
				'Primary 1': 'Primary 2',
				'Primary 2': 'Primary 3',
				'Primary 3': 'Primary 4',
				'Primary 4': 'Primary 5',
				'Primary 5': 'Primary 6',
				'Primary 6': 'JHS 1',
				'JHS 1': 'JHS 2',
				'JHS 2': 'JHS 3',
				'JHS 3': 'Graduated',
			};
			return classMap[currentClass] || currentClass;
		};

		// Update each student based on promotion decision
		for (const decision of decisions) {
			const studentRef = ref(rtdb, `students/${decision.studentId}`);
			const snapshot = await get(studentRef);
			
			if (snapshot.exists()) {
				const updates: any = {
					updatedAt: new Date().toISOString(),
				};

				if (decision.decision === 'promote') {
					// Use teacher-selected target class, or fallback to calculated next class
					const nextClass = decision.targetClass || getNextClass(decision.currentClass);
					updates.className = nextClass;
					updates[`promotionHistory/${new Date().getFullYear()}`] = {
						from: decision.currentClass,
						to: nextClass,
						date: new Date().toISOString(),
						comment: decision.comment || '',
					};
				} else {
					// Student repeats - keep same class
					updates[`repeatHistory/${new Date().getFullYear()}`] = {
						class: decision.currentClass,
						date: new Date().toISOString(),
						comment: decision.comment || '',
					};
				}

				await update(studentRef, updates);
			}
		}

		// Mark request as approved
		const requestRef = ref(rtdb, `promotionRequests/${requestId}`);
		await update(requestRef, {
			status: 'approved',
			reviewedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error('Error executing promotion:', error);
		throw error;
	}
};

// ===== UTIL HELPERS FOR FILTERING =====
export const getStudentsByClassApprox = async (classItem: Class): Promise<Student[]> => {
	// Approximates membership by matching className when available
	const all = await getAllStudents();
	if (classItem.className) {
		return all.filter(s => s.className === classItem.className && s.status === 'active');
	}
	return all.filter(s => s.status === 'active');
};