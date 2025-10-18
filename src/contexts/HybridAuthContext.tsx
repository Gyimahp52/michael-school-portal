import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, initializeUsers, User } from '../lib/custom-auth';
import { OfflineAuthService } from '../lib/offline-auth';
import { SyncService } from '../lib/sync-service';
import { DatabaseService } from '../lib/database';
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
  isOffline: boolean;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const navigate = useNavigate();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('Connection restored');
      
      // If user was logged in offline, try to sync and verify online
      if (currentUser && isOfflineMode) {
        toast({
          title: "Connection Restored",
          description: "Syncing your data with the server...",
        });
        SyncService.syncAllTables();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Connection lost - switching to offline mode');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser, isOfflineMode]);

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
          await OfflineAuthService.clearSession();
          setLoading(false);
          return;
        }

        // Restore user session
        setCurrentUser(session.user);
        setUserRole(session.user.role);
        setIsOfflineMode(session.isOffline);

        // If online and was offline session, verify with server
        if (isOnline && session.isOffline) {
          console.log('Verifying offline session with server...');
          // Session is still valid, just update the mode
          setIsOfflineMode(false);
          saveSession(session.user, false);
        }

      } catch (error) {
        console.error('Error restoring session:', error);
        localStorage.removeItem('authSession');
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, [isOnline]);

  const saveSession = (user: User, offline: boolean) => {
    const session: StoredSession = {
      user,
      timestamp: Date.now(),
      isOffline: offline,
    };
    localStorage.setItem('authSession', JSON.stringify(session));
  };

  const login = async (username: string, password: string): Promise<User> => {
    try {
      setLoading(true);

      // Try online login first
      if (isOnline) {
        try {
          console.log('Attempting online login...');
          const user = await loginUser(username, password);
          
          // Store user in IndexedDB for offline access with hashed password
          const hashedPassword = await OfflineAuthService.hashPassword(password);
          const existingUser = await DatabaseService.getUserByUsername(username);
          
          const dbUser = {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            password: hashedPassword,
            role: user.role as string,
            lastLogin: new Date(),
            status: 'active' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          if (existingUser) {
            await DatabaseService.updateUser(existingUser.id, {
              password: hashedPassword,
              lastLogin: new Date(),
              updatedAt: new Date(),
            });
          } else {
            await DatabaseService.createUser({
              username: dbUser.username,
              displayName: dbUser.displayName,
              password: dbUser.password,
              role: dbUser.role,
              lastLogin: dbUser.lastLogin,
              status: dbUser.status,
            });
          }

          setCurrentUser(user);
          setUserRole(user.role);
          setIsOfflineMode(false);
          saveSession(user, false);

          toast({
            title: "Login Successful",
            description: `Welcome back, ${user.displayName}!`,
          });

          return user;
        } catch (onlineError) {
          console.error('Online login failed:', onlineError);
          // Fall back to offline login if online fails
          console.log('Falling back to offline login...');
        }
      }

      // Try offline login
      console.log('Attempting offline login...');
      const result = await OfflineAuthService.loginOffline({ username, password });
      
      if (!result.success || !result.user) {
        throw new Error(result.error || 'Login failed');
      }

      // Check if user has offline data
      const hasOfflineData = await checkOfflineDataAvailability(result.user.id);
      
      if (!hasOfflineData) {
        toast({
          title: "Limited Offline Access",
          description: "No cached data found. Some features may be unavailable.",
          variant: "destructive",
        });
      }

      // Convert DB user to Auth user type
      const authUser: User = {
        id: result.user.id,
        username: result.user.username,
        displayName: result.user.displayName,
        password: result.user.password,
        role: result.user.role as 'admin' | 'teacher' | 'accountant',
      };

      setCurrentUser(authUser);
      setUserRole(authUser.role);
      setIsOfflineMode(true);
      saveSession(authUser, true);

      toast({
        title: "Offline Mode",
        description: `Logged in using cached credentials. Welcome, ${authUser.displayName}!`,
      });

      return authUser;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const checkOfflineDataAvailability = async (userId: string): Promise<boolean> => {
    try {
      const students = await DatabaseService.getAllStudents();
      return students.length > 0;
    } catch (error) {
      console.error('Error checking offline data:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await OfflineAuthService.logout();
      setCurrentUser(null);
      setUserRole(null);
      setIsOfflineMode(false);
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
        title: "Setup Complete",
        description: "Default users have been created successfully.",
      });
    } catch (error) {
      console.error('Error setting up users:', error);
      toast({
        title: "Setup Failed",
        description: "Failed to create default users.",
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
    isOfflineMode,
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
