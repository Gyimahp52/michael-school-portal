import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OfflineAuthService } from '../lib/offline-auth';
import { SyncService } from '../lib/sync-service';
import { User } from '../lib/database';

interface AuthContextType {
  currentUser: User | null;
  userRole: string | null;
  loading: boolean;
  isOnline: boolean;
  login: (username: string, password: string) => Promise<User>;
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
  const [isOnline, setIsOnline] = useState(SyncService.getOnlineStatus());
  const navigate = useNavigate();

  // Initialize sync service
  useEffect(() => {
    SyncService.initialize();
    
    const unsubscribe = SyncService.addSyncListener(() => {
      setIsOnline(SyncService.getOnlineStatus());
    });

    return unsubscribe;
  }, []);

  const login = async (username: string, password: string): Promise<User> => {
    try {
      console.log("Attempting offline login...");
      const result = await OfflineAuthService.loginOffline({ username, password });
      
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setUserRole(result.user.role);
        console.log("Login successful for user:", result.user.displayName);
        return result.user;
      } else {
        throw new Error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await OfflineAuthService.logout();
      setCurrentUser(null);
      setUserRole(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  useEffect(() => {
    // Check for existing offline session on mount
    const checkOfflineSession = () => {
      if (OfflineAuthService.isLoggedIn()) {
        const offlineUser = OfflineAuthService.getCurrentUser();
        if (offlineUser) {
          setCurrentUser(offlineUser);
          setUserRole(offlineUser.role);
        }
      }
      setLoading(false);
    };

    checkOfflineSession();
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    isOnline,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
