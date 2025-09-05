import { ref, push, set, get, update, remove, onValue } from 'firebase/database';
import { rtdb } from '../firebase';

// ===== STUDENT OPERATIONS =====
export interface Student {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  grade: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  enrollmentDate: string;
  status: 'active' | 'inactive' | 'graduated';
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
  code: string;
  description: string;
  grade: string;
  department: string;
  credits: number;
  teacherId?: string;
  status: 'active' | 'inactive';
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
  name: string;
  grade: string;
  section: string;
  academicYear: string;
  teacherId: string; // Class teacher
  room: string;
  capacity: number;
  currentStrength: number;
  subjects: string[]; // Array of subject IDs
  schedule: ClassSchedule[];
  status: 'active' | 'inactive';
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