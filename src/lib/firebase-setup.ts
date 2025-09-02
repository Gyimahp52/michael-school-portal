import { collection, doc, setDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';

type UserRole = 'admin' | 'teacher' | 'accountant' | 'student';

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: any;
  updatedAt: any;
  profilePicture?: string;
  phone?: string;
  department?: string;
  employeeId?: string;
  studentId?: string;
}

const defaultUsers = [
  {
    email: 'admin@school.com',
    password: 'admin123',
    displayName: 'Admin User',
    role: 'admin' as const,
    department: 'Administration',
    employeeId: 'EMP001'
  },
  {
    email: 'teacher@school.com',
    password: 'teacher123',
    displayName: 'Teacher One',
    role: 'teacher' as const,
    department: 'Mathematics',
    employeeId: 'EMP002'
  },
  {
    email: 'accountant@school.com',
    password: 'account123',
    displayName: 'Accountant One',
    role: 'accountant' as const,
    department: 'Finance',
    employeeId: 'EMP003'
  },
  {
    email: 'student@school.com',
    password: 'student123',
    displayName: 'Student One',
    role: 'student' as const,
    department: 'General',
    studentId: 'STU001'
  }
];

export const createUserInDatabase = async (userData: Omit<UserData, 'uid' | 'createdAt' | 'updatedAt'>): Promise<void> => {
  try {
    const userRef = doc(collection(db, 'users'), userData.email.replace('@', '_').replace('.', '_'));
    
    const userDocument: Omit<UserData, 'uid'> = {
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      status: userData.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      profilePicture: userData.profilePicture,
      phone: userData.phone,
      department: userData.department,
      employeeId: userData.employeeId,
      studentId: userData.studentId
    };

    await setDoc(userRef, userDocument);
    console.log(`✅ User created in database: ${userData.email}`);
  } catch (error) {
    console.error(`❌ Error creating user in database:`, error);
    throw error;
  }
};

export const setupDefaultUsers = async (): Promise<void> => {
  console.log('🚀 Setting up default users in Firebase...');
  
  for (const user of defaultUsers) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      const firebaseUser = userCredential.user;

      // Update user profile
      await updateProfile(firebaseUser, {
        displayName: user.displayName
      });

      // Create user document in Firestore
      await createUserInDatabase({
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        status: 'active',
        department: user.department,
        employeeId: user.employeeId,
        studentId: user.studentId
      });

      console.log(`✅ Successfully created user: ${user.email}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️ User already exists: ${user.email}`);
        
        // Still create/update the database record
        try {
          await createUserInDatabase({
            email: user.email,
            displayName: user.displayName,
            role: user.role,
            status: 'active',
            department: user.department,
            employeeId: user.employeeId,
            studentId: user.studentId
          });
        } catch (dbError) {
          console.error(`❌ Error updating database for existing user ${user.email}:`, dbError);
        }
      } else {
        console.error(`❌ Error creating user ${user.email}:`, error.message);
      }
    }
  }
  
  console.log('✨ User setup completed!');
};

// Function to get all users from the database
export const getAllUsers = async (): Promise<UserData[]> => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    return snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    } as UserData));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Function to update user role
export const updateUserRole = async (userEmail: string, newRole: UserRole): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userEmail.replace('@', '_').replace('.', '_'));
    await setDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    }, { merge: true });
    
    console.log(`✅ Updated role for ${userEmail} to ${newRole}`);
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};