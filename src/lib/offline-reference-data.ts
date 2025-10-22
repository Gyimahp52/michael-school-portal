import { 
  getAllClasses, 
  getAllAcademicYears, 
  getAllTerms,
  subscribeToClasses,
  subscribeToAcademicYears,
  subscribeToTerms,
  type Class,
  type AcademicYear,
  type Term
} from './database-operations';

const STORAGE_KEYS = {
  CLASSES: 'offline_classes',
  ACADEMIC_YEARS: 'offline_academic_years',
  TERMS: 'offline_terms',
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
