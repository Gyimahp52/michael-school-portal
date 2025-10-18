import { DatabaseService, db } from './database';
import { OfflineAuthService } from './offline-auth';
import { OfflineFirstDataService } from './offline-first-data-service';

export class DatabaseSetupService {
  static async initializeDatabase(): Promise<void> {
    try {
      console.log('Initializing offline database...');
      
      // Create default admin user
      await this.createDefaultUsers();
      
      // Create sample students
      await this.createSampleStudents();
      
      // Create sample data for other tables
      await this.createSampleData();
      
      console.log('Database initialization completed successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  private static async createDefaultUsers(): Promise<void> {
    const existingUsers = await DatabaseService.getAllUsers();
    
    if (existingUsers.length === 0) {
      // Create default admin user
      const adminResult = await OfflineAuthService.createUser({
        username: 'admin',
        displayName: 'Administrator',
        password: 'admin123',
        role: 'admin'
      });

      if (adminResult.success) {
        console.log('Default admin user created');
      }

      // Create sample teacher
      const teacherResult = await OfflineAuthService.createUser({
        username: 'teacher',
        displayName: 'John Teacher',
        password: 'teacher123',
        role: 'teacher'
      });

      if (teacherResult.success) {
        console.log('Sample teacher user created');
      }

      // Create sample accountant
      const accountantResult = await OfflineAuthService.createUser({
        username: 'accountant',
        displayName: 'Jane Accountant',
        password: 'accountant123',
        role: 'accountant'
      });

      if (accountantResult.success) {
        console.log('Sample accountant user created');
      }
    }
  }

  private static async createSampleStudents(): Promise<void> {
    const existingStudents = await DatabaseService.getAllStudents();
    
    if (existingStudents.length === 0) {
      const sampleStudents = [
        {
          name: 'Alice Johnson',
          studentCode: 'STU001',
          classId: 'class1',
          academicYear: '2024',
          term: 'Term 1',
          dateOfBirth: new Date('2010-05-15'),
          admissionDate: new Date('2024-01-15'),
          guardianInfo: {
            name: 'Robert Johnson',
            phone: '+1234567890',
            email: 'robert.johnson@email.com',
            relationship: 'Father'
          }
        },
        {
          name: 'Bob Smith',
          studentCode: 'STU002',
          classId: 'class1',
          academicYear: '2024',
          term: 'Term 1',
          dateOfBirth: new Date('2010-08-22'),
          admissionDate: new Date('2024-01-15'),
          guardianInfo: {
            name: 'Mary Smith',
            phone: '+1234567891',
            email: 'mary.smith@email.com',
            relationship: 'Mother'
          }
        },
        {
          name: 'Carol Davis',
          studentCode: 'STU003',
          classId: 'class2',
          academicYear: '2024',
          term: 'Term 1',
          dateOfBirth: new Date('2009-12-10'),
          admissionDate: new Date('2024-01-15'),
          guardianInfo: {
            name: 'David Davis',
            phone: '+1234567892',
            email: 'david.davis@email.com',
            relationship: 'Father'
          }
        }
      ];

      for (const student of sampleStudents) {
        await OfflineFirstDataService.createStudent(student);
      }

      console.log('Sample students created');
    }
  }

  private static async createSampleData(): Promise<void> {
    const students = await DatabaseService.getAllStudents();
    
    if (students.length > 0) {
      // Create sample attendance records
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      for (const student of students.slice(0, 2)) {
        await OfflineFirstDataService.createAttendance({
          studentId: student.id,
          classId: student.classId,
          date: today,
          status: 'present',
          term: student.term,
          teacherId: 'teacher1',
          academicYear: student.academicYear
        });

        await OfflineFirstDataService.createAttendance({
          studentId: student.id,
          classId: student.classId,
          date: yesterday,
          status: 'present',
          term: student.term,
          teacherId: 'teacher1',
          academicYear: student.academicYear
        });
      }

      // Create sample assessments
      for (const student of students.slice(0, 2)) {
        await OfflineFirstDataService.createAssessment({
          studentId: student.id,
          subjectId: 'math',
          term: student.term,
          classwork: 85,
          exam: 90,
          total: 87.5,
          teacherId: 'teacher1',
          academicYear: student.academicYear
        });
      }

      // Create sample fees
      for (const student of students) {
        await OfflineFirstDataService.createFee({
          studentId: student.id,
          term: student.term,
          academicYear: student.academicYear,
          amount: 500,
          paid: 300,
          balance: 200,
          datePaid: new Date('2024-01-20')
        });
      }

      // Create sample canteen collection
      await OfflineFirstDataService.createCanteenCollection({
        date: today,
        totalCollected: 150.50,
        numberOfStudents: 25,
        recordedBy: 'accountant1'
      });

      console.log('Sample data created');
    }
  }

  static async clearAllData(): Promise<void> {
    try {
      await DatabaseService.clearAllData();
      console.log('All data cleared');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }

  static async getDatabaseStats(): Promise<{
    users: number;
    students: number;
    attendance: number;
    assessments: number;
    fees: number;
    canteenCollections: number;
  }> {
    const users = await DatabaseService.getAllUsers();
    const students = await DatabaseService.getAllStudents();
    const attendance = await DatabaseService.list(db.attendance);
    const assessments = await DatabaseService.list(db.assessments);
    const fees = await DatabaseService.list(db.fees);
    const canteenCollections = await DatabaseService.list(db.canteenCollections);

    return {
      users: users.length,
      students: students.length,
      attendance: attendance.length,
      assessments: assessments.length,
      fees: fees.length,
      canteenCollections: canteenCollections.length
    };
  }
}
