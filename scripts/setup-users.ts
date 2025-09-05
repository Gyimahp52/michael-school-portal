import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../src/firebase';

type UserRole = 'admin' | 'teacher' | 'accountant' | 'student';

interface UserData {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}
/*
const users: UserData[] = [
  {
    email: 'admin@school.com',
    password: 'admin123',
    displayName: 'Admin User',
    role: 'admin' as const,
  },
  {
    email: 'teacher@school.com',
    password: 'teacher123',
    displayName: 'Teacher One',
    role: 'teacher' as const,
  },
  {
    email: 'accountant@school.com',
    password: 'account123',
    displayName: 'Accountant One',
    role: 'accountant' as const,
  },
  {
    email: 'student@school.com',
    password: 'student123',
    displayName: 'Student One',
    role: 'student' as const,
  },
];
*/
async function createUser(userData: UserData) {
  try {
    // Create user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );

    const user = userCredential.user;

    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Created ${userData.role} user: ${userData.email}`);
    return user;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`ℹ️ User already exists: ${userData.email}`);
    } else {
      console.error(`❌ Error creating user ${userData.email}:`, error.message);
    }
    return null;
  }
}

async function setupUsers() {
  console.log('🚀 Starting user setup...');
  
  // Create each user
  for (const userData of users) {
    await createUser(userData);
  }

  console.log('✨ User setup completed!');
  process.exit(0);
}

// Run the setup
setupUsers().catch(console.error);
