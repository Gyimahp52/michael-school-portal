// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB1Rn0z9qmGtIGrdYkE8n7bXPqq06QlT7c",
  authDomain: "macl-school.firebaseapp.com",
  projectId: "macl-school",
  storageBucket: "macl-school.firebasestorage.app",
  messagingSenderId: "198394118967",
  appId: "1:198394118967:web:defe2198c8f3dad33290b2",
  measurementId: "G-NF31NQEBYY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics: ReturnType<typeof getAnalytics> | null = null;
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
  }
} catch (_) {
  analytics = null;
}
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);

export { app, analytics, auth, db, rtdb, storage };
