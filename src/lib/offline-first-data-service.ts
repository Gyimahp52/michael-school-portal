import { 
  ref, 
  get, 
  set, 
  push, 
  update as firebaseUpdate, 
  remove 
} from 'firebase/database';
import { rtdb } from '../firebase';
import { DatabaseService, db } from './database';
import { SyncService } from './sync-service';
import { 
  User, 
  Student, 
  Attendance, 
  Assessment, 
  Fee, 
  CanteenCollection 
} from './database';

export interface DataOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  id?: string;
}

export class OfflineFirstDataService {
  private static isOnline = SyncService.getOnlineStatus();

  // Initialize the service
  static initialize(): void {
    const unsubscribe = SyncService.addSyncListener(() => {
      this.isOnline = SyncService.getOnlineStatus();
    });
    return unsubscribe;
  }

  // Generic create operation
  private static async createRecord<T>(
    tableName: string,
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
    createLocalFn: (data: any) => Promise<string>,
    createFirebaseFn?: (id: string, data: any) => Promise<void>
  ): Promise<DataOperationResult<T>> {
    try {
      // Always create locally first
      const id = await createLocalFn(data);
      
      // If online, also create in Firebase
      if (this.isOnline && createFirebaseFn) {
        try {
          await createFirebaseFn(id, { ...data, id });
        } catch (firebaseError) {
          console.warn(`Firebase create failed for ${tableName}:`, firebaseError);
          // Continue with local creation - will sync later
        }
      }

      // Fetch the created record
      const createdRecord = await this.getRecordById(tableName, id);
      
      return {
        success: true,
        data: createdRecord as T,
        id
      };
    } catch (error) {
      console.error(`Create error for ${tableName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Generic update operation
  private static async updateRecord<T>(
    tableName: string,
    id: string,
    data: Partial<T>,
    updateLocalFn: (id: string, data: any) => Promise<void>,
    updateFirebaseFn?: (id: string, data: any) => Promise<void>
  ): Promise<DataOperationResult<T>> {
    try {
      // Always update locally first
      await updateLocalFn(id, data);
      
      // If online, also update in Firebase
      if (this.isOnline && updateFirebaseFn) {
        try {
          await updateFirebaseFn(id, data);
        } catch (firebaseError) {
          console.warn(`Firebase update failed for ${tableName}:`, firebaseError);
          // Continue with local update - will sync later
        }
      }

      // Fetch the updated record
      const updatedRecord = await this.getRecordById(tableName, id);
      
      return {
        success: true,
        data: updatedRecord as T
      };
    } catch (error) {
      console.error(`Update error for ${tableName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Generic delete operation
  private static async deleteRecord<T>(
    tableName: string,
    id: string,
    deleteLocalFn: (id: string) => Promise<void>,
    deleteFirebaseFn?: (id: string) => Promise<void>
  ): Promise<DataOperationResult<T>> {
    try {
      // Always delete locally first
      await deleteLocalFn(id);
      
      // If online, also delete in Firebase
      if (this.isOnline && deleteFirebaseFn) {
        try {
          await deleteFirebaseFn(id);
        } catch (firebaseError) {
          console.warn(`Firebase delete failed for ${tableName}:`, firebaseError);
          // Continue with local delete - will sync later
        }
      }

      return {
        success: true
      };
    } catch (error) {
      console.error(`Delete error for ${tableName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get record by ID
  private static async getRecordById(tableName: string, id: string): Promise<any> {
    switch (tableName) {
      case 'users':
        return await DatabaseService.getUserById(id);
      case 'students':
        return await DatabaseService.getStudentById(id);
      case 'attendance':
        return await DatabaseService.read(db.attendance, id);
      case 'assessments':
        return await DatabaseService.read(db.assessments, id);
      case 'fees':
        return await DatabaseService.read(db.fees, id);
      case 'canteenCollections':
        return await DatabaseService.read(db.canteenCollections, id);
      default:
        return null;
    }
  }

  // User operations
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataOperationResult<User>> {
    return await this.createRecord(
      'users',
      userData,
      (data) => DatabaseService.createUser(data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `users/${id}`);
        await set(firebaseRef, { ...data, createdAt: data.createdAt.toISOString(), updatedAt: data.updatedAt.toISOString() });
      }
    );
  }

  static async updateUser(id: string, userData: Partial<User>): Promise<DataOperationResult<User>> {
    return await this.updateRecord(
      'users',
      id,
      userData,
      (id, data) => DatabaseService.updateUser(id, data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `users/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.updatedAt) {
          firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        }
        await firebaseUpdate(firebaseRef, firebaseData);
      }
    );
  }

  static async deleteUser(id: string): Promise<DataOperationResult<User>> {
    return await this.deleteRecord(
      'users',
      id,
      (id) => DatabaseService.delete(db.users, id),
      async (id) => {
        const firebaseRef = ref(rtdb, `users/${id}`);
        await remove(firebaseRef);
      }
    );
  }

  static async getUserById(id: string): Promise<User | undefined> {
    return await DatabaseService.getUserById(id);
  }

  static async getAllUsers(): Promise<User[]> {
    return await DatabaseService.getAllUsers();
  }

  // Student operations
  static async createStudent(studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataOperationResult<Student>> {
    return await this.createRecord(
      'students',
      studentData,
      (data) => DatabaseService.createStudent(data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `students/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.dateOfBirth) firebaseData.dateOfBirth = firebaseData.dateOfBirth.toISOString();
        if (firebaseData.admissionDate) firebaseData.admissionDate = firebaseData.admissionDate.toISOString();
        if (firebaseData.createdAt) firebaseData.createdAt = firebaseData.createdAt.toISOString();
        if (firebaseData.updatedAt) firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        await set(firebaseRef, firebaseData);
      }
    );
  }

  static async updateStudent(id: string, studentData: Partial<Student>): Promise<DataOperationResult<Student>> {
    return await this.updateRecord(
      'students',
      id,
      studentData,
      (id, data) => DatabaseService.updateStudent(id, data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `students/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.dateOfBirth) firebaseData.dateOfBirth = firebaseData.dateOfBirth.toISOString();
        if (firebaseData.admissionDate) firebaseData.admissionDate = firebaseData.admissionDate.toISOString();
        if (firebaseData.updatedAt) firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        await firebaseUpdate(firebaseRef, firebaseData);
      }
    );
  }

  static async deleteStudent(id: string): Promise<DataOperationResult<Student>> {
    return await this.deleteRecord(
      'students',
      id,
      (id) => DatabaseService.delete(db.students, id),
      async (id) => {
        const firebaseRef = ref(rtdb, `students/${id}`);
        await remove(firebaseRef);
      }
    );
  }

  static async getStudentById(id: string): Promise<Student | undefined> {
    return await DatabaseService.getStudentById(id);
  }

  static async getStudentsByClass(classId: string): Promise<Student[]> {
    return await DatabaseService.getStudentsByClass(classId);
  }

  static async getAllStudents(): Promise<Student[]> {
    return await DatabaseService.getAllStudents();
  }

  // Attendance operations
  static async createAttendance(attendanceData: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataOperationResult<Attendance>> {
    return await this.createRecord(
      'attendance',
      attendanceData,
      (data) => DatabaseService.createAttendance(data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `attendance/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.date) firebaseData.date = firebaseData.date.toISOString();
        if (firebaseData.createdAt) firebaseData.createdAt = firebaseData.createdAt.toISOString();
        if (firebaseData.updatedAt) firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        await set(firebaseRef, firebaseData);
      }
    );
  }

  static async updateAttendance(id: string, attendanceData: Partial<Attendance>): Promise<DataOperationResult<Attendance>> {
    return await this.updateRecord(
      'attendance',
      id,
      attendanceData,
      (id, data) => DatabaseService.updateAttendance(id, data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `attendance/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.date) firebaseData.date = firebaseData.date.toISOString();
        if (firebaseData.updatedAt) firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        await firebaseUpdate(firebaseRef, firebaseData);
      }
    );
  }

  static async getAttendanceByStudent(studentId: string, term?: string): Promise<Attendance[]> {
    return await DatabaseService.getAttendanceByStudent(studentId, term);
  }

  static async getAttendanceByClass(classId: string, date: Date): Promise<Attendance[]> {
    return await DatabaseService.getAttendanceByClass(classId, date);
  }

  // Assessment operations
  static async createAssessment(assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataOperationResult<Assessment>> {
    return await this.createRecord(
      'assessments',
      assessmentData,
      (data) => DatabaseService.createAssessment(data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `assessments/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.createdAt) firebaseData.createdAt = firebaseData.createdAt.toISOString();
        if (firebaseData.updatedAt) firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        await set(firebaseRef, firebaseData);
      }
    );
  }

  static async updateAssessment(id: string, assessmentData: Partial<Assessment>): Promise<DataOperationResult<Assessment>> {
    return await this.updateRecord(
      'assessments',
      id,
      assessmentData,
      (id, data) => DatabaseService.updateAssessment(id, data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `assessments/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.updatedAt) firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        await firebaseUpdate(firebaseRef, firebaseData);
      }
    );
  }

  static async getAssessmentsByStudent(studentId: string, term?: string): Promise<Assessment[]> {
    return await DatabaseService.getAssessmentsByStudent(studentId, term);
  }

  // Fee operations
  static async createFee(feeData: Omit<Fee, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataOperationResult<Fee>> {
    return await this.createRecord(
      'fees',
      feeData,
      (data) => DatabaseService.createFee(data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `fees/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.datePaid) firebaseData.datePaid = firebaseData.datePaid.toISOString();
        if (firebaseData.createdAt) firebaseData.createdAt = firebaseData.createdAt.toISOString();
        if (firebaseData.updatedAt) firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        await set(firebaseRef, firebaseData);
      }
    );
  }

  static async updateFee(id: string, feeData: Partial<Fee>): Promise<DataOperationResult<Fee>> {
    return await this.updateRecord(
      'fees',
      id,
      feeData,
      (id, data) => DatabaseService.updateFee(id, data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `fees/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.datePaid) firebaseData.datePaid = firebaseData.datePaid.toISOString();
        if (firebaseData.updatedAt) firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        await firebaseUpdate(firebaseRef, firebaseData);
      }
    );
  }

  static async getFeesByStudent(studentId: string, term?: string): Promise<Fee[]> {
    return await DatabaseService.getFeesByStudent(studentId, term);
  }

  // Canteen collection operations
  static async createCanteenCollection(collectionData: Omit<CanteenCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<DataOperationResult<CanteenCollection>> {
    return await this.createRecord(
      'canteenCollections',
      collectionData,
      (data) => DatabaseService.createCanteenCollection(data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `canteenCollections/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.date) firebaseData.date = firebaseData.date.toISOString();
        if (firebaseData.createdAt) firebaseData.createdAt = firebaseData.createdAt.toISOString();
        if (firebaseData.updatedAt) firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        await set(firebaseRef, firebaseData);
      }
    );
  }

  static async updateCanteenCollection(id: string, collectionData: Partial<CanteenCollection>): Promise<DataOperationResult<CanteenCollection>> {
    return await this.updateRecord(
      'canteenCollections',
      id,
      collectionData,
      (id, data) => DatabaseService.updateCanteenCollection(id, data),
      async (id, data) => {
        const firebaseRef = ref(rtdb, `canteenCollections/${id}`);
        const firebaseData = { ...data };
        if (firebaseData.date) firebaseData.date = firebaseData.date.toISOString();
        if (firebaseData.updatedAt) firebaseData.updatedAt = firebaseData.updatedAt.toISOString();
        await firebaseUpdate(firebaseRef, firebaseData);
      }
    );
  }

  static async getCanteenCollectionsByDateRange(startDate: Date, endDate: Date): Promise<CanteenCollection[]> {
    return await DatabaseService.getCanteenCollectionsByDateRange(startDate, endDate);
  }

  // Utility methods
  static async syncAllData(): Promise<void> {
    await SyncService.syncAllTables();
  }

  static async getSyncStatus() {
    return await SyncService.getSyncStatus();
  }

  static isOnline(): boolean {
    return this.isOnline;
  }
}
