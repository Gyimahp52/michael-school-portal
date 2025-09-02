import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const login = async (email: string, password: string): Promise<User> => {
    try {
      console.log("Attempting to sign in with email and password...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("Sign-in successful for UID:", user.uid);

      // Fetch user role from Firestore
      try {
        console.log("Fetching user document from Firestore...");
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("User document found:", userData);
          setUserRole(userData.role);
        } else {
          console.error("User document does not exist in Firestore for UID:", user.uid);
          // If user doesn't exist in Firestore, this is a problem.
          // We should not create a new user here, as roles are specific.
          // Throw an error to indicate a configuration issue.
          throw new Error('User record not found in the database.');
        }
      } catch (firestoreError) {
        console.error('Firestore error after login:', firestoreError);
        // Log out the user if Firestore access fails, to prevent an inconsistent state
        await signOut(auth);
        throw firestoreError; // Re-throw the Firestore-specific error
      }
      
      return user;
    } catch (authError) {
      console.error('Authentication error:', authError);
      throw authError; // Re-throw the authentication-specific error
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserRole(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
