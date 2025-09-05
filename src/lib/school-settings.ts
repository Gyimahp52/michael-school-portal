import { ref, set, get, update } from 'firebase/database';
import { rtdb } from '../firebase';

export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  darkMode: boolean;
  autoBackup: boolean;
  emailNotifications: boolean;
  sessionTimeout: number;
  notifications: {
    newEnrollment: boolean;
    feeReminders: boolean;
    gradeSubmissions: boolean;
    systemMaintenance: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    maxLoginAttempts: number;
  };
  updatedAt: string;
}

const defaultSettings: SchoolSettings = {
  schoolName: "Michael Agyei School",
  academicYear: "2024/2025",
  address: "123 Education Street, Accra, Ghana",
  phone: "+233 20 123 4567",
  email: "info@michaelagyeischool.edu.gh",
  darkMode: false,
  autoBackup: true,
  emailNotifications: true,
  sessionTimeout: 30,
  notifications: {
    newEnrollment: true,
    feeReminders: true,
    gradeSubmissions: true,
    systemMaintenance: true,
  },
  security: {
    twoFactorAuth: false,
    maxLoginAttempts: 3,
  },
  updatedAt: new Date().toISOString(),
};

export const getSchoolSettings = async (): Promise<SchoolSettings> => {
  try {
    const settingsRef = ref(rtdb, 'school-settings');
    const snapshot = await get(settingsRef);
    
    if (!snapshot.exists()) {
      // Initialize with default settings if none exist
      await set(settingsRef, defaultSettings);
      return defaultSettings;
    }
    
    return snapshot.val();
  } catch (error) {
    console.error('Error fetching school settings:', error);
    return defaultSettings;
  }
};

export const updateSchoolSettings = async (updates: Partial<SchoolSettings>): Promise<void> => {
  try {
    const settingsRef = ref(rtdb, 'school-settings');
    await update(settingsRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating school settings:', error);
    throw error;
  }
};

export const resetToDefaults = async (): Promise<void> => {
  try {
    const settingsRef = ref(rtdb, 'school-settings');
    await set(settingsRef, {
      ...defaultSettings,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw error;
  }
};