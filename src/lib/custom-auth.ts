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

export const createUser = async (userData: {
  username: string;
  password: string;
  displayName: string;
  role: 'admin' | 'teacher' | 'accountant';
}): Promise<User> => {
  try {
    // Check if username already exists
    const usersRef = ref(rtdb, 'users');
    const snapshot = await get(usersRef);
    const users = snapshot.val() || {};
    
    // Check for duplicate username
    const existingUser = Object.values(users).find((user: any) => user.username === userData.username);
    if (existingUser) {
      throw new Error('Username already exists');
    }
    
    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      id: userId,
      username: userData.username,
      password: userData.password,
      role: userData.role,
      displayName: userData.displayName,
    };
    
    const userRef = ref(rtdb, `users/${userId}`);
    await set(userRef, {
      username: newUser.username,
      password: newUser.password,
      role: newUser.role,
      displayName: newUser.displayName,
    });
    
    console.log('User created successfully:', newUser.username);
    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = ref(rtdb, 'users');
    const snapshot = await get(usersRef);
    
    if (snapshot.exists()) {
      const users = snapshot.val();
      return Object.entries(users).map(([id, userData]) => ({
        id,
        ...(userData as Omit<User, 'id'>)
      })) as User[];
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};