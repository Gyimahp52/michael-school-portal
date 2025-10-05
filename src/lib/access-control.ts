/**
 * Access Control Utilities
 * Validates teacher access to classes, students, and assessments
 */

import { Class, Student } from './database-operations';

/**
 * Validates if a teacher has access to a specific class
 */
export const validateTeacherClassAccess = (
  teacherId: string,
  classItem: Class
): boolean => {
  const teacherIds = classItem.teacherIds || [];
  return teacherIds.includes(teacherId);
};

/**
 * Validates if a teacher has access to a specific student
 * based on the student's class assignment
 */
export const validateTeacherStudentAccess = (
  teacherId: string,
  student: Student,
  classes: Class[]
): boolean => {
  // Find classes that match the student's className
  const studentClasses = classes.filter(
    c => c.className === student.className
  );
  
  // Check if teacher is assigned to any of those classes
  return studentClasses.some(c => validateTeacherClassAccess(teacherId, c));
};

/**
 * Filters classes to only those assigned to the teacher
 */
export const filterTeacherClasses = (
  teacherId: string,
  classes: Class[]
): Class[] => {
  return classes.filter(c => validateTeacherClassAccess(teacherId, c));
};

/**
 * Filters students to only those in classes assigned to the teacher
 */
export const filterTeacherStudents = (
  teacherId: string,
  students: Student[],
  classes: Class[]
): Student[] => {
  const teacherClasses = filterTeacherClasses(teacherId, classes);
  const teacherClassNames = new Set(teacherClasses.map(c => c.className));
  
  return students.filter(s => 
    s.status === 'active' && teacherClassNames.has(s.className)
  );
};

/**
 * Gets error message for access denied scenarios
 */
export const getAccessDeniedMessage = (resource: string): string => {
  return `Access Denied: You are not authorized to access this ${resource}. Please contact your administrator if you believe this is an error.`;
};
