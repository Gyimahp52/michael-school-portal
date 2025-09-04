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
    
    // Build object without undefined fields (RTDB rejects undefined)
    const base: Partial<LoginAttempt> = {
      userId,
      email,
      status,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    };
    if (role !== undefined) base.role = role;
    if (errorMessage !== undefined) base.errorMessage = errorMessage;

    await push(loginRef, {
      ...base,
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
