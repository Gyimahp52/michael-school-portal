import bcrypt from 'bcryptjs';
import { DatabaseService, User } from './database';

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export class OfflineAuthService {
  private static readonly SESSION_KEY = 'school_session';
  private static readonly SALT_ROUNDS = 10;

  // Hash password for storage
  static async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  // Verify password against hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Login with offline credentials
  static async loginOffline(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const user = await DatabaseService.getUserByUsername(credentials.username);
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (user.status !== 'active') {
        return { success: false, error: 'Account is inactive' };
      }

      // For now, we'll do simple password comparison
      // In production, you might want to hash passwords before storing
      const isValidPassword = credentials.password === user.password;
      
      if (!isValidPassword) {
        return { success: false, error: 'Invalid password' };
      }

      // Update last login
      await DatabaseService.updateUser(user.id, {
        lastLogin: new Date()
      });

      // Store session
      this.setSession(user);

      return { success: true, user };
    } catch (error) {
      console.error('Offline login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Create user with password
  static async createUser(userData: {
    username: string;
    displayName: string;
    password: string;
    role: string;
  }): Promise<AuthResult> {
    try {
      const user = await DatabaseService.createUser({
        username: userData.username,
        displayName: userData.displayName,
        password: userData.password,
        role: userData.role,
        status: 'active',
        lastLogin: undefined
      });

      const createdUser = await DatabaseService.getUserById(user);
      return { success: true, user: createdUser };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: 'Failed to create user' };
    }
  }

  // Check if user is logged in
  static isLoggedIn(): boolean {
    const session = this.getSession();
    return !!session;
  }

  // Get current user from session
  static getCurrentUser(): User | null {
    return this.getSession();
  }

  // Set user session
  private static setSession(user: User): void {
    const sessionData = {
      user,
      timestamp: Date.now()
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
  }

  // Get user session
  private static getSession(): User | null {
    try {
      const sessionData = localStorage.getItem(this.SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      
      // Check if session is still valid (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - session.timestamp > maxAge) {
        this.clearSession();
        return null;
      }

      return session.user;
    } catch (error) {
      console.error('Session error:', error);
      this.clearSession();
      return null;
    }
  }

  // Clear user session
  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // Logout user
  static async logout(): Promise<void> {
    this.clearSession();
  }

  // Update user password
  static async updatePassword(userId: string, newPassword: string): Promise<AuthResult> {
    try {
      await DatabaseService.updateUser(userId, { password: newPassword });
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: 'Failed to update password' };
    }
  }

  // Check if user has permission for a specific role
  static hasPermission(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole);
  }

  // Get user permissions based on role
  static getUserPermissions(role: string): {
    canManageUsers: boolean;
    canManageStudents: boolean;
    canManageAttendance: boolean;
    canManageAssessments: boolean;
    canManageFees: boolean;
    canManageCanteen: boolean;
    canViewReports: boolean;
  } {
    const permissions = {
      canManageUsers: false,
      canManageStudents: false,
      canManageAttendance: false,
      canManageAssessments: false,
      canManageFees: false,
      canManageCanteen: false,
      canViewReports: false,
    };

    switch (role) {
      case 'admin':
        permissions.canManageUsers = true;
        permissions.canManageStudents = true;
        permissions.canManageAttendance = true;
        permissions.canManageAssessments = true;
        permissions.canManageFees = true;
        permissions.canManageCanteen = true;
        permissions.canViewReports = true;
        break;
      
      case 'teacher':
        permissions.canManageAttendance = true;
        permissions.canManageAssessments = true;
        permissions.canViewReports = true;
        break;
      
      case 'accountant':
        permissions.canManageFees = true;
        permissions.canManageCanteen = true;
        permissions.canViewReports = true;
        break;
      
      case 'principal':
        permissions.canManageStudents = true;
        permissions.canManageAttendance = true;
        permissions.canManageAssessments = true;
        permissions.canManageFees = true;
        permissions.canManageCanteen = true;
        permissions.canViewReports = true;
        break;
    }

    return permissions;
  }
}
