import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

type UserRole = 'admin' | 'teacher' | 'accountant' | 'student';

export interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  createdAt: any; // Firestore timestamp
  updatedAt: any; // Firestore timestamp
}

export const createUserInFirestore = async (user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
}): Promise<void> => {
  const userRef = doc(db, 'users', user.uid);
  const userData = {
    email: user.email,
    displayName: user.displayName || 'New User',
    role: user.role,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(userRef, userData, { merge: true });
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { uid, ...userSnap.data() } as UserData;
  }
  return null;
};

export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  const userRef = doc(db, 'users', uid);
  await setDoc(
    userRef,
    { role, updatedAt: serverTimestamp() },
    { merge: true }
  );
};
