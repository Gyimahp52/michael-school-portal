import { ref, push, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebase';

type LoginStatus = 'success' | 'failed' | 'unauthorized';

interface LoginAttempt {
  userId: string;
  email: string;
  status: LoginStatus;
  timestamp: any; // Firebase server timestamp
  ipAddress?: string;
  userAgent?: string;
  role?: string;
  errorMessage?: string;
}

export const logLoginAttempt = async (
  userId: string,
  email: string,
  status: LoginStatus,
  role?: string,
  errorMessage?: string
): Promise<void> => {
  try {
    const loginRef = ref(rtdb, 'loginAttempts');
    const newLogin: Omit<LoginAttempt, 'timestamp'> = {
      userId,
      email,
      status,
      role,
      errorMessage,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      // Note: In a real app, you'd want to get the IP address from the server-side
      // as client-side IP detection can be unreliable
    };

    await push(loginRef, {
      ...newLogin,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to log login attempt:', error);
    // Fail silently - we don't want login to fail because logging failed
  }
};

// Optional: Function to get recent login attempts for a user
export const getUserLoginHistory = async (userId: string, limit = 10) => {
  // In a real app, you would implement this to query the login attempts
  // and return them sorted by timestamp
  return [];
};
