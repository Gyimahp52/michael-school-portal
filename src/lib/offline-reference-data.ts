import { 
  getAllClasses, 
  getAllAcademicYears, 
  getAllTerms,
  subscribeToClasses,
  subscribeToAcademicYears,
  subscribeToTerms,
  subscribeToStudents,
  subscribeToStudentBalances,
  type Class,
  type AcademicYear,
  type Term,
  type Student,
  type StudentBalance
} from './database-operations';

const STORAGE_KEYS = {
  CLASSES: 'offline_classes',
  ACADEMIC_YEARS: 'offline_academic_years',
  TERMS: 'offline_terms',
  STUDENTS: 'offline_students',
  STUDENT_BALANCES: 'offline_student_balances',
  LAST_SYNC: 'offline_reference_data_last_sync'
};

// Check if we're online
const isOnline = () => {
  return navigator.onLine;
};

// Get cached data from localStorage
const getCachedData = <T>(key: string): T[] => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.error(`Error reading cached data for ${key}:`, error);
  }
  return [];
};

// Save data to localStorage
const setCachedData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  } catch (error) {
    console.error(`Error caching data for ${key}:`, error);
  }
};

// Offline-first classes operations
export const getClassesOfflineFirst = async (): Promise<Class[]> => {
  if (isOnline()) {
    try {
      const classes = await getAllClasses();
      setCachedData(STORAGE_KEYS.CLASSES, classes);
      return classes;
    } catch (error) {
      console.warn('Failed to fetch classes online, falling back to cache:', error);
      return getCachedData<Class>(STORAGE_KEYS.CLASSES);
    }
  }
  return getCachedData<Class>(STORAGE_KEYS.CLASSES);
};

export const subscribeToClassesOfflineFirst = (callback: (classes: Class[]) => void): (() => void) => {
  // First, load cached data immediately
  const cachedClasses = getCachedData<Class>(STORAGE_KEYS.CLASSES);
  callback(cachedClasses);

  if (isOnline()) {
    // If online, subscribe to real-time updates
    const unsubscribe = subscribeToClasses((classes) => {
      setCachedData(STORAGE_KEYS.CLASSES, classes);
      callback(classes);
    });
    return unsubscribe;
  } else {
    // If offline, return a no-op unsubscribe function
    return () => {};
  }
};

// Offline-first academic years operations
export const getAcademicYearsOfflineFirst = async (): Promise<AcademicYear[]> => {
  if (isOnline()) {
    try {
      const years = await getAllAcademicYears();
      setCachedData(STORAGE_KEYS.ACADEMIC_YEARS, years);
      return years;
    } catch (error) {
      console.warn('Failed to fetch academic years online, falling back to cache:', error);
      return getCachedData<AcademicYear>(STORAGE_KEYS.ACADEMIC_YEARS);
    }
  }
  return getCachedData<AcademicYear>(STORAGE_KEYS.ACADEMIC_YEARS);
};

export const subscribeToAcademicYearsOfflineFirst = (callback: (years: AcademicYear[]) => void): (() => void) => {
  // First, load cached data immediately
  const cachedYears = getCachedData<AcademicYear>(STORAGE_KEYS.ACADEMIC_YEARS);
  callback(cachedYears);

  if (isOnline()) {
    // If online, subscribe to real-time updates
    const unsubscribe = subscribeToAcademicYears((years) => {
      setCachedData(STORAGE_KEYS.ACADEMIC_YEARS, years);
      callback(years);
    });
    return unsubscribe;
  } else {
    // If offline, return a no-op unsubscribe function
    return () => {};
  }
};

// Offline-first terms operations
export const getTermsOfflineFirst = async (): Promise<Term[]> => {
  if (isOnline()) {
    try {
      const terms = await getAllTerms();
      setCachedData(STORAGE_KEYS.TERMS, terms);
      return terms;
    } catch (error) {
      console.warn('Failed to fetch terms online, falling back to cache:', error);
      return getCachedData<Term>(STORAGE_KEYS.TERMS);
    }
  }
  return getCachedData<Term>(STORAGE_KEYS.TERMS);
};

export const subscribeToTermsOfflineFirst = (callback: (terms: Term[]) => void): (() => void) => {
  // First, load cached data immediately
  const cachedTerms = getCachedData<Term>(STORAGE_KEYS.TERMS);
  callback(cachedTerms);

  if (isOnline()) {
    // If online, subscribe to real-time updates
    const unsubscribe = subscribeToTerms((terms) => {
      setCachedData(STORAGE_KEYS.TERMS, terms);
      callback(terms);
    });
    return unsubscribe;
  } else {
    // If offline, return a no-op unsubscribe function
    return () => {};
  }
};

// Offline-first students operations
export const getStudentsOfflineFirst = async (): Promise<Student[]> => {
  if (isOnline()) {
    try {
      // We don't have a getAllStudents here; we rely on realtime to cache via subscribe below.
      // So when online and no cache yet, just return cache for immediate UI; realtime will refresh.
      return getCachedData<Student>(STORAGE_KEYS.STUDENTS);
    } catch (_) {
      return getCachedData<Student>(STORAGE_KEYS.STUDENTS);
    }
  }
  return getCachedData<Student>(STORAGE_KEYS.STUDENTS);
};

export const subscribeToStudentsOfflineFirst = (callback: (students: Student[]) => void): (() => void) => {
  // Emit cache immediately
  const cached = getCachedData<Student>(STORAGE_KEYS.STUDENTS);
  callback(cached);

  if (isOnline()) {
    const unsubscribe = subscribeToStudents((students) => {
      setCachedData(STORAGE_KEYS.STUDENTS, students as Student[]);
      callback(students);
    });
    return unsubscribe;
  }
  return () => {};
};

// Offline-first student balances operations
export const getStudentBalancesOfflineFirst = async (): Promise<StudentBalance[]> => {
  if (isOnline()) {
    try {
      return getCachedData<StudentBalance>(STORAGE_KEYS.STUDENT_BALANCES);
    } catch (_) {
      return getCachedData<StudentBalance>(STORAGE_KEYS.STUDENT_BALANCES);
    }
  }
  return getCachedData<StudentBalance>(STORAGE_KEYS.STUDENT_BALANCES);
};

export const subscribeToStudentBalancesOfflineFirst = (callback: (balances: StudentBalance[]) => void): (() => void) => {
  const cached = getCachedData<StudentBalance>(STORAGE_KEYS.STUDENT_BALANCES);
  callback(cached);

  if (isOnline()) {
    const unsubscribe = subscribeToStudentBalances((balances) => {
      setCachedData(STORAGE_KEYS.STUDENT_BALANCES, balances as StudentBalance[]);
      callback(balances);
    });
    return unsubscribe;
  }
  return () => {};
};

// Helper function to get terms by academic year ID (offline-first)
export const getTermsByAcademicYearOfflineFirst = async (academicYearId: string): Promise<Term[]> => {
  const allTerms = await getTermsOfflineFirst();
  return allTerms.filter(t => t.academicYearId === academicYearId);
};

// Helper function to get current academic year (offline-first)
export const getCurrentAcademicYearOfflineFirst = async (): Promise<AcademicYear | null> => {
  const years = await getAcademicYearsOfflineFirst();
  return years.find(y => y.status === 'active') || null;
};

// Helper function to get current term (offline-first)
export const getCurrentTermOfflineFirst = async (): Promise<Term | null> => {
  const terms = await getTermsOfflineFirst();
  return terms.find(t => t.isCurrentTerm) || null;
};
