import Dexie, { Table } from 'dexie';

// Define interfaces for our database tables
export interface User {
  id: string;
  username: string;
  displayName: string;
  password: string;
  role: string;
  lastLogin?: Date;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

export interface Student {
  id: string;
  name: string;
  studentCode: string;
  classId: string;
  academicYear: string;
  term: string;
  dateOfBirth: Date;
  admissionDate: Date;
  guardianInfo: {
    name: string;
    phone: string;
    email?: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: Date;
  status: 'present' | 'absent' | 'late' | 'excused';
  term: string;
  teacherId: string;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

export interface Assessment {
  id: string;
  studentId: string;
  subjectId: string;
  term: string;
  classwork: number;
  exam: number;
  total: number;
  teacherId: string;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

export interface Fee {
  id: string;
  studentId: string;
  term: string;
  academicYear: string;
  amount: number;
  paid: number;
  balance: number;
  datePaid?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

export interface CanteenCollection {
  id: string;
  date: Date;
  totalCollected: number;
  numberOfStudents: number;
  proofDocumentUrl?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastSyncAt?: Date;
}

// Sync status tracking
export interface SyncStatus {
  id: string;
  tableName: string;
  lastSyncAt: Date;
  pendingChanges: number;
  lastError?: string;
}

export class SchoolDB extends Dexie {
  users!: Table<User>;
  students!: Table<Student>;
  attendance!: Table<Attendance>;
  assessments!: Table<Assessment>;
  fees!: Table<Fee>;
  canteenCollections!: Table<CanteenCollection>;
  syncStatus!: Table<SyncStatus>;

  constructor() {
    super('SchoolDB');
    
    this.version(1).stores({
      users: 'id, username, displayName, role, status, lastLogin, createdAt, updatedAt, lastSyncAt',
      students: 'id, name, studentCode, classId, academicYear, term, createdAt, updatedAt, lastSyncAt',
      attendance: 'id, studentId, classId, date, status, term, teacherId, academicYear, createdAt, updatedAt, lastSyncAt',
      assessments: 'id, studentId, subjectId, term, teacherId, academicYear, createdAt, updatedAt, lastSyncAt',
      fees: 'id, studentId, term, academicYear, createdAt, updatedAt, lastSyncAt',
      canteenCollections: 'id, date, recordedBy, createdAt, updatedAt, lastSyncAt',
      syncStatus: 'id, tableName, lastSyncAt, pendingChanges'
    });

    // Add hooks for automatic timestamp updates
    this.users.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.users.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.students.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.students.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.attendance.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.attendance.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.assessments.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.assessments.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.fees.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.fees.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });

    this.canteenCollections.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.canteenCollections.hook('updating', (modifications, primKey, obj, trans) => {
      (modifications as any).updatedAt = new Date();
    });
  }
}

// Create and export the database instance
export const db = new SchoolDB();

// Database utility functions
export class DatabaseService {
  // Generic CRUD operations
  static async create<T>(table: Table<T>, data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const id = crypto.randomUUID();
    await table.add({ ...data, id } as T);
    return id;
  }

  static async read<T>(table: Table<T>, id: string): Promise<T | undefined> {
    return await table.get(id);
  }

  static async update<T>(table: Table<T>, id: string, data: Partial<T>): Promise<void> {
    await table.update(id, data as any);
  }

  static async delete<T>(table: Table<T>, id: string): Promise<void> {
    await table.delete(id);
  }

  static async list<T>(table: Table<T>, filter?: (item: T) => boolean): Promise<T[]> {
    if (filter) {
      return await table.filter(filter).toArray();
    }
    return await table.toArray();
  }

  static async clearAllData(): Promise<void> {
    await db.users.clear();
    await db.students.clear();
    await db.attendance.clear();
    await db.assessments.clear();
    await db.fees.clear();
    await db.canteenCollections.clear();
    await db.syncStatus.clear();
  }

  // User-specific operations
  static async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await this.create(db.users, userData);
  }

  static async getUserById(id: string): Promise<User | undefined> {
    return await this.read(db.users, id);
  }

  static async getUserByUsername(username: string): Promise<User | undefined> {
    return await db.users.where('username').equals(username).first();
  }

  static async updateUser(id: string, userData: Partial<User>): Promise<void> {
    await this.update(db.users, id, userData);
  }

  static async getAllUsers(): Promise<User[]> {
    return await this.list(db.users);
  }

  // Student-specific operations
  static async createStudent(studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await this.create(db.students, studentData);
  }

  static async getStudentById(id: string): Promise<Student | undefined> {
    return await this.read(db.students, id);
  }

  static async getStudentsByClass(classId: string): Promise<Student[]> {
    return await db.students.where('classId').equals(classId).toArray();
  }

  static async updateStudent(id: string, studentData: Partial<Student>): Promise<void> {
    await this.update(db.students, id, studentData);
  }

  static async getAllStudents(): Promise<Student[]> {
    return await this.list(db.students);
  }

  // Attendance-specific operations
  static async createAttendance(attendanceData: Omit<Attendance, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await this.create(db.attendance, attendanceData);
  }

  static async getAttendanceByStudent(studentId: string, term?: string): Promise<Attendance[]> {
    let query = db.attendance.where('studentId').equals(studentId);
    if (term) {
      query = query.and(att => att.term === term);
    }
    return await query.toArray();
  }

  static async getAttendanceByClass(classId: string, date: Date): Promise<Attendance[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return await db.attendance
      .where('classId').equals(classId)
      .and(att => att.date >= startOfDay && att.date <= endOfDay)
      .toArray();
  }

  static async updateAttendance(id: string, attendanceData: Partial<Attendance>): Promise<void> {
    await this.update(db.attendance, id, attendanceData);
  }

  // Assessment-specific operations
  static async createAssessment(assessmentData: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await this.create(db.assessments, assessmentData);
  }

  static async getAssessmentsByStudent(studentId: string, term?: string): Promise<Assessment[]> {
    let query = db.assessments.where('studentId').equals(studentId);
    if (term) {
      query = query.and(ass => ass.term === term);
    }
    return await query.toArray();
  }

  static async updateAssessment(id: string, assessmentData: Partial<Assessment>): Promise<void> {
    await this.update(db.assessments, id, assessmentData);
  }

  // Fee-specific operations
  static async createFee(feeData: Omit<Fee, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await this.create(db.fees, feeData);
  }

  static async getFeesByStudent(studentId: string, term?: string): Promise<Fee[]> {
    let query = db.fees.where('studentId').equals(studentId);
    if (term) {
      query = query.and(fee => fee.term === term);
    }
    return await query.toArray();
  }

  static async updateFee(id: string, feeData: Partial<Fee>): Promise<void> {
    await this.update(db.fees, id, feeData);
  }

  // Canteen collection operations
  static async createCanteenCollection(collectionData: Omit<CanteenCollection, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    return await this.create(db.canteenCollections, collectionData);
  }

  static async getCanteenCollectionsByDateRange(startDate: Date, endDate: Date): Promise<CanteenCollection[]> {
    return await db.canteenCollections
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  }

  static async updateCanteenCollection(id: string, collectionData: Partial<CanteenCollection>): Promise<void> {
    await this.update(db.canteenCollections, id, collectionData);
  }

  // Sync status operations
  static async updateSyncStatus(tableName: string, lastSyncAt: Date, pendingChanges: number = 0, lastError?: string): Promise<void> {
    await db.syncStatus.put({
      id: tableName,
      tableName,
      lastSyncAt,
      pendingChanges,
      lastError
    });
  }

  static async getSyncStatus(tableName: string): Promise<SyncStatus | undefined> {
    return await db.syncStatus.get(tableName);
  }

  static async getAllSyncStatus(): Promise<SyncStatus[]> {
    return await db.syncStatus.toArray();
  }
}
