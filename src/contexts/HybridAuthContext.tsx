import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, initializeUsers, User } from '../lib/custom-auth';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  loading: boolean;
  isOnline: boolean;
  isOfflineMode: boolean;
  login: (username: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setupUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const SESSION_EXPIRY_DAYS = 7;

interface StoredSession {
  user: User;
  timestamp: number;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check and restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedSession = localStorage.getItem('authSession');
        if (!storedSession) {
          setLoading(false);
          return;
        }

        const session: StoredSession = JSON.parse(storedSession);
        const now = Date.now();
        const sessionAge = now - session.timestamp;
        const maxAge = SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

        // Check if session is expired
        if (sessionAge > maxAge) {
          console.log('Session expired');
          localStorage.removeItem('authSession');
          setLoading(false);
          return;
        }

        // Restore user session
        setCurrentUser(session.user);
        setUserRole(session.user.role);

      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('authSession');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const saveSession = (user: User) => {
    const session: StoredSession = {
      user,
      timestamp: Date.now(),
    };
    localStorage.setItem('authSession', JSON.stringify(session));
  };

  const login = async (username: string, password: string): Promise<User> => {
    try {
      setLoading(true);

      if (!isOnline) {
        throw new Error('Cannot login while offline. Please check your internet connection.');
      }

      console.log('Attempting login...');
      const user = await loginUser(username, password);
      
      setCurrentUser(user);
      setUserRole(user.role);
      saveSession(user);
      
      console.log('Login successful');
      toast({
        title: "Login Successful",
        description: `Welcome back, ${user.displayName}!`,
      });

      return user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setCurrentUser(null);
      setUserRole(null);
      localStorage.removeItem('authSession');
      navigate('/login');
      
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const setupUsers = async () => {
    try {
      await initializeUsers();
      toast({
        title: "Users Initialized",
        description: "Default users have been created successfully.",
      });
    } catch (error) {
      console.error('Error setting up users:', error);
      toast({
        title: "Setup Error",
        description: "Failed to initialize users.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    currentUser,
    userRole,
    loading,
    isOnline,
    isOfflineMode: false, // No offline mode anymore
    login,
    logout,
    setupUsers,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
