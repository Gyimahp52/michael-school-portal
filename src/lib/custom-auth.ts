import { ref, get, set, child } from 'firebase/database';
import { rtdb } from '../firebase';

export interface User {
  username: string;
  password: string;
  role: 'admin' | 'teacher' | 'accountant';
  displayName: string;
  id: string;
}

// Default users for the system
const defaultUsers: User[] = [
  {
    id: 'admin1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    displayName: 'Admin User'
  },
  {
    id: 'teacher1', 
    username: 'teacher',
    password: 'teacher123',
    role: 'teacher',
    displayName: 'Teacher One'
  },
  {
    id: 'accountant1',
    username: 'accountant', 
    password: 'account123',
    role: 'accountant',
    displayName: 'Accountant One'
  }
];

// Initialize default users in Firebase Database
export const initializeUsers = async (): Promise<void> => {
  try {
    const usersRef = ref(rtdb, 'users');
    const snapshot = await get(usersRef);
    
    // Only initialize if no users exist
    if (!snapshot.exists()) {
      const usersData: { [key: string]: Omit<User, 'id'> } = {};
      
      defaultUsers.forEach(user => {
        usersData[user.id] = {
          username: user.username,
          password: user.password, // In production, this should be hashed
          role: user.role,
          displayName: user.displayName
        };
      });
      
      await set(usersRef, usersData);
      console.log('Default users initialized successfully');
    }
  } catch (error) {
    console.error('Error initializing users:', error);
    throw error;
  }
};

// Login function
export const loginUser = async (username: string, password: string): Promise<User> => {
  try {
    const usersRef = ref(rtdb, 'users');
    const snapshot = await get(usersRef);
    
    if (!snapshot.exists()) {
      throw new Error('No users found in database');
    }
    
    const users = snapshot.val();
    
    // Find user by username and password
    for (const [id, userData] of Object.entries(users) as [string, Omit<User, 'id'>][]) {
      if (userData.username === username && userData.password === password) {
        return {
          id,
          username: userData.username,
          password: userData.password,
          role: userData.role,
          displayName: userData.displayName
        };
      }
    }
    
    throw new Error('Invalid username or password');
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Get user by ID
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const userRef = ref(rtdb, `users/${id}`);
    const snapshot = await get(userRef);
    
    if (snapshot.exists()) {
      const userData = snapshot.val();
      return {
        id,
        ...userData
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};