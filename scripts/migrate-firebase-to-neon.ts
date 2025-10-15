import { readFile } from 'fs/promises';
import { Client } from 'pg';

// Neon PostgreSQL connection string
const CONNECTION_STRING = process.env.NEON_DB_URL || 
  'postgresql://neondb_owner:npg_QBvSs06eWIVP@ep-holy-shape-adfi9emy-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

interface MigrationStats {
  tableName: string;
  recordsAttempted: number;
  recordsSucceeded: number;
  recordsFailed: number;
  errors: string[];
}

class FirebaseToNeonMigration {
  private client: Client;
  private stats: MigrationStats[] = [];

  constructor(connectionString: string) {
    this.client = new Client({ connectionString });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to Neon PostgreSQL database');
    } catch (error) {
      console.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.client.end();
    console.log('✅ Disconnected from database');
  }

  private async createTables() {
    console.log('\n📊 Creating database tables...');

    const createTablesSQL = `
      -- Drop existing tables if they exist (cascade to handle foreign keys)
      DROP TABLE IF EXISTS academic_transitions CASCADE;
      DROP TABLE IF EXISTS assessments CASCADE;
      DROP TABLE IF EXISTS attendance_entries CASCADE;
      DROP TABLE IF EXISTS attendance CASCADE;
      DROP TABLE IF EXISTS canteen_collections CASCADE;
      DROP TABLE IF EXISTS invoices CASCADE;
      DROP TABLE IF EXISTS promotion_decisions CASCADE;
      DROP TABLE IF EXISTS promotion_requests CASCADE;
      DROP TABLE IF EXISTS student_balances CASCADE;
      DROP TABLE IF EXISTS school_fees CASCADE;
      DROP TABLE IF EXISTS students CASCADE;
      DROP TABLE IF EXISTS classes CASCADE;
      DROP TABLE IF EXISTS subjects CASCADE;
      DROP TABLE IF EXISTS teachers CASCADE;
      DROP TABLE IF EXISTS terms CASCADE;
      DROP TABLE IF EXISTS academic_years CASCADE;

      -- Academic Years table
      CREATE TABLE academic_years (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Terms table
      CREATE TABLE terms (
        id VARCHAR(255) PRIMARY KEY,
        academic_year_id VARCHAR(255) REFERENCES academic_years(id),
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Teachers table
      CREATE TABLE teachers (
        id VARCHAR(255) PRIMARY KEY,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255),
        phone VARCHAR(50),
        subject VARCHAR(255),
        department VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Subjects table
      CREATE TABLE subjects (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Classes table
      CREATE TABLE classes (
        id VARCHAR(255) PRIMARY KEY,
        class_name VARCHAR(255) NOT NULL,
        room VARCHAR(100),
        teacher_ids TEXT[], -- Array of teacher IDs
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Students table
      CREATE TABLE students (
        id VARCHAR(255) PRIMARY KEY,
        student_code VARCHAR(100),
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        middle_name VARCHAR(255),
        date_of_birth DATE,
        gender VARCHAR(20),
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        class_name VARCHAR(255),
        academic_year VARCHAR(100),
        enrollment_date DATE,
        status VARCHAR(50) DEFAULT 'active',
        parent_name VARCHAR(255),
        parent_email VARCHAR(255),
        parent_phone VARCHAR(50),
        parent_whatsapp VARCHAR(50),
        photo_url TEXT,
        previous_class VARCHAR(255),
        previous_academic_year VARCHAR(100),
        promotion_history JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- School Fees table
      CREATE TABLE school_fees (
        id VARCHAR(255) PRIMARY KEY,
        class_name VARCHAR(255) NOT NULL,
        academic_year VARCHAR(100),
        term_id VARCHAR(255) REFERENCES terms(id),
        term_name VARCHAR(255),
        tuition_fees DECIMAL(10, 2) DEFAULT 0,
        activity_fees DECIMAL(10, 2) DEFAULT 0,
        exam_fees DECIMAL(10, 2) DEFAULT 0,
        other_fees DECIMAL(10, 2) DEFAULT 0,
        total_fees DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Student Balances table
      CREATE TABLE student_balances (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) REFERENCES students(id),
        student_name VARCHAR(255),
        class_name VARCHAR(255),
        total_fees DECIMAL(10, 2) DEFAULT 0,
        amount_paid DECIMAL(10, 2) DEFAULT 0,
        balance DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'unpaid',
        last_payment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Invoices table
      CREATE TABLE invoices (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) REFERENCES students(id),
        student_name VARCHAR(255),
        academic_year_id VARCHAR(255) REFERENCES academic_years(id),
        academic_year_name VARCHAR(255),
        term_id VARCHAR(255) REFERENCES terms(id),
        term_name VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE,
        payment_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Assessments table
      CREATE TABLE assessments (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) REFERENCES students(id),
        student_name VARCHAR(255),
        class_id VARCHAR(255) REFERENCES classes(id),
        subject_id VARCHAR(255) REFERENCES subjects(id),
        teacher_id VARCHAR(255),
        academic_year_id VARCHAR(255) REFERENCES academic_years(id),
        academic_year_name VARCHAR(255),
        term_id VARCHAR(255) REFERENCES terms(id),
        term_name VARCHAR(255),
        assessment_type VARCHAR(50),
        score DECIMAL(5, 2),
        max_score DECIMAL(5, 2),
        date DATE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Attendance table
      CREATE TABLE attendance (
        id VARCHAR(255) PRIMARY KEY,
        class_id VARCHAR(255) REFERENCES classes(id),
        teacher_id VARCHAR(255),
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Attendance Entries table (many-to-one with attendance)
      CREATE TABLE attendance_entries (
        id SERIAL PRIMARY KEY,
        attendance_id VARCHAR(255) REFERENCES attendance(id),
        student_id VARCHAR(255) REFERENCES students(id),
        status VARCHAR(50) NOT NULL
      );

      -- Canteen Collections table
      CREATE TABLE canteen_collections (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) REFERENCES students(id),
        student_name VARCHAR(255),
        class_name VARCHAR(255),
        amount DECIMAL(10, 2) NOT NULL,
        date DATE NOT NULL,
        proof_doc_name VARCHAR(255),
        proof_doc_type VARCHAR(100),
        proof_doc_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Promotion Requests table
      CREATE TABLE promotion_requests (
        id VARCHAR(255) PRIMARY KEY,
        teacher_id VARCHAR(255),
        teacher_name VARCHAR(255),
        class_id VARCHAR(255) REFERENCES classes(id),
        class_name VARCHAR(255),
        academic_year VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        admin_comments TEXT,
        submitted_at TIMESTAMP,
        reviewed_at TIMESTAMP,
        reviewed_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Promotion Decisions table (many-to-one with promotion_requests)
      CREATE TABLE promotion_decisions (
        id SERIAL PRIMARY KEY,
        promotion_request_id VARCHAR(255) REFERENCES promotion_requests(id),
        student_id VARCHAR(255) REFERENCES students(id),
        student_name VARCHAR(255),
        current_class VARCHAR(255),
        target_class VARCHAR(255),
        decision VARCHAR(50),
        comment TEXT
      );

      -- Academic Transitions table
      CREATE TABLE academic_transitions (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(255) REFERENCES students(id),
        year VARCHAR(50),
        from_academic_year VARCHAR(100),
        to_academic_year VARCHAR(100),
        from_class VARCHAR(255),
        to_class VARCHAR(255),
        student_name VARCHAR(255),
        status VARCHAR(50),
        promotion_date TIMESTAMP,
        attendance_reset BOOLEAN DEFAULT false,
        scores_reset BOOLEAN DEFAULT false,
        carry_forward_unpaid_balances BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create indexes for better query performance
      CREATE INDEX idx_students_class ON students(class_name);
      CREATE INDEX idx_students_status ON students(status);
      CREATE INDEX idx_assessments_student ON assessments(student_id);
      CREATE INDEX idx_assessments_class ON assessments(class_id);
      CREATE INDEX idx_attendance_date ON attendance(date);
      CREATE INDEX idx_invoices_student ON invoices(student_id);
      CREATE INDEX idx_student_balances_student ON student_balances(student_id);
    `;

    try {
      await this.client.query(createTablesSQL);
      console.log('✅ All tables created successfully');
    } catch (error) {
      console.error('❌ Error creating tables:', error);
      throw error;
    }
  }

  private trackStats(tableName: string, attempted: number, succeeded: number, failed: number, errors: string[] = []) {
    this.stats.push({
      tableName,
      recordsAttempted: attempted,
      recordsSucceeded: succeeded,
      recordsFailed: failed,
      errors
    });
  }

  private async insertAcademicYears(data: any) {
    if (!data.academicYears) return;
    
    console.log('\n📚 Migrating Academic Years...');
    const records = Object.entries(data.academicYears);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO academic_years (id, name, start_date, end_date, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [id, r.name, r.startDate, r.endDate, r.status, r.createdAt, r.updatedAt]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('academic_years', records.length, succeeded, failed, errors);
    console.log(`✅ Academic Years: ${succeeded}/${records.length} migrated`);
  }

  private async insertTerms(data: any) {
    if (!data.terms) return;
    
    console.log('\n📅 Migrating Terms...');
    const records = Object.entries(data.terms);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO terms (id, academic_year_id, name, start_date, end_date, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, r.academicYearId, r.name, r.startDate, r.endDate, r.status, r.createdAt, r.updatedAt]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('terms', records.length, succeeded, failed, errors);
    console.log(`✅ Terms: ${succeeded}/${records.length} migrated`);
  }

  private async insertTeachers(data: any) {
    if (!data.teachers) return;
    
    console.log('\n👨‍🏫 Migrating Teachers...');
    const records = Object.entries(data.teachers);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO teachers (id, first_name, last_name, email, phone, subject, department, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [id, r.firstName, r.lastName, r.email, r.phone, r.subject, r.department, r.createdAt, r.updatedAt]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('teachers', records.length, succeeded, failed, errors);
    console.log(`✅ Teachers: ${succeeded}/${records.length} migrated`);
  }

  private async insertSubjects(data: any) {
    if (!data.subjects) return;
    
    console.log('\n📖 Migrating Subjects...');
    const records = Object.entries(data.subjects);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO subjects (id, name, code, description, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, r.name, r.code, r.description, r.createdAt, r.updatedAt]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('subjects', records.length, succeeded, failed, errors);
    console.log(`✅ Subjects: ${succeeded}/${records.length} migrated`);
  }

  private async insertClasses(data: any) {
    if (!data.classes) return;
    
    console.log('\n🏫 Migrating Classes...');
    const records = Object.entries(data.classes);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO classes (id, class_name, room, teacher_ids, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, r.className, r.room, r.teacherIds || [], r.createdAt, r.updatedAt]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('classes', records.length, succeeded, failed, errors);
    console.log(`✅ Classes: ${succeeded}/${records.length} migrated`);
  }

  private async insertStudents(data: any) {
    if (!data.students) return;
    
    console.log('\n👨‍🎓 Migrating Students...');
    const records = Object.entries(data.students);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO students (
            id, student_code, first_name, last_name, middle_name, date_of_birth, gender,
            email, phone, address, class_name, academic_year, enrollment_date, status,
            parent_name, parent_email, parent_phone, parent_whatsapp, photo_url,
            previous_class, previous_academic_year, promotion_history, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)`,
          [
            id, r.studentCode, r.firstName, r.lastName, r.middleName, r.dateOfBirth, r.gender,
            r.email, r.phone, r.address, r.className, r.academicYear, r.enrollmentDate, r.status,
            r.parentName, r.parentEmail, r.parentPhone, r.parentWhatsApp, r.photoUrl,
            r.previousClass, r.previousAcademicYear, JSON.stringify(r.promotionHistory || {}), r.createdAt, r.updatedAt
          ]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('students', records.length, succeeded, failed, errors);
    console.log(`✅ Students: ${succeeded}/${records.length} migrated`);
  }

  private async insertSchoolFees(data: any) {
    if (!data.schoolFees) return;
    
    console.log('\n💰 Migrating School Fees...');
    const records = Object.entries(data.schoolFees);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO school_fees (
            id, class_name, academic_year, term_id, term_name,
            tuition_fees, activity_fees, exam_fees, other_fees, total_fees, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
          [
            id, r.className, r.academicYear, r.termId, r.termName,
            r.tuitionFees, r.activityFees, r.examFees, r.otherFees, r.totalFees, r.createdAt, r.updatedAt
          ]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('school_fees', records.length, succeeded, failed, errors);
    console.log(`✅ School Fees: ${succeeded}/${records.length} migrated`);
  }

  private async insertStudentBalances(data: any) {
    if (!data.studentBalances) return;
    
    console.log('\n💵 Migrating Student Balances...');
    const records = Object.entries(data.studentBalances);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO student_balances (
            id, student_id, student_name, class_name, total_fees, amount_paid, balance, status, last_payment_date, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            id, r.studentId, r.studentName, r.className, r.totalFees, r.amountPaid, r.balance, r.status, r.lastPaymentDate, r.createdAt, r.updatedAt
          ]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('student_balances', records.length, succeeded, failed, errors);
    console.log(`✅ Student Balances: ${succeeded}/${records.length} migrated`);
  }

  private async insertInvoices(data: any) {
    if (!data.invoices) return;
    
    console.log('\n🧾 Migrating Invoices...');
    const records = Object.entries(data.invoices);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO invoices (
            id, student_id, student_name, academic_year_id, academic_year_name, term_id, term_name,
            amount, description, status, due_date, payment_date, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [
            id, r.studentId, r.studentName, r.academicYearId, r.academicYearName, r.termId, r.termName,
            r.amount, r.description, r.status, r.dueDate, r.paymentDate, r.createdAt, r.updatedAt
          ]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('invoices', records.length, succeeded, failed, errors);
    console.log(`✅ Invoices: ${succeeded}/${records.length} migrated`);
  }

  private async insertAssessments(data: any) {
    if (!data.assessments) return;
    
    console.log('\n📝 Migrating Assessments...');
    const records = Object.entries(data.assessments);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO assessments (
            id, student_id, student_name, class_id, subject_id, teacher_id,
            academic_year_id, academic_year_name, term_id, term_name,
            assessment_type, score, max_score, date, description, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
          [
            id, r.studentId, r.studentName, r.classId, r.subjectId, r.teacherId,
            r.academicYearId, r.academicYearName, r.termId, r.termName,
            r.assessmentType, r.score, r.maxScore, r.date, r.description, r.createdAt, r.updatedAt
          ]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('assessments', records.length, succeeded, failed, errors);
    console.log(`✅ Assessments: ${succeeded}/${records.length} migrated`);
  }

  private async insertAttendance(data: any) {
    if (!data.attendance) return;
    
    console.log('\n✋ Migrating Attendance...');
    const records = Object.entries(data.attendance);
    let succeeded = 0, failed = 0, entryCount = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO attendance (id, class_id, teacher_id, date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [id, r.classId, r.teacherId, r.date, r.createdAt, r.updatedAt]
        );

        // Insert attendance entries
        if (r.entries && Array.isArray(r.entries)) {
          for (const entry of r.entries) {
            await this.client.query(
              `INSERT INTO attendance_entries (attendance_id, student_id, status)
               VALUES ($1, $2, $3)`,
              [id, entry.studentId, entry.status]
            );
            entryCount++;
          }
        }
        
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('attendance', records.length, succeeded, failed, errors);
    this.trackStats('attendance_entries', entryCount, entryCount, 0, []);
    console.log(`✅ Attendance: ${succeeded}/${records.length} migrated (${entryCount} entries)`);
  }

  private async insertCanteenCollections(data: any) {
    if (!data.canteenCollections) return;
    
    console.log('\n🍽️ Migrating Canteen Collections...');
    const records = Object.entries(data.canteenCollections);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        // Skip the base64 proof doc for now as it's too large
        await this.client.query(
          `INSERT INTO canteen_collections (
            id, student_id, student_name, class_name, amount, date,
            proof_doc_name, proof_doc_type, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id, r.studentId, r.studentName, r.className, r.amount, r.date,
            r.proofDocName, r.proofDocType, r.createdAt, r.updatedAt
          ]
        );
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('canteen_collections', records.length, succeeded, failed, errors);
    console.log(`✅ Canteen Collections: ${succeeded}/${records.length} migrated`);
  }

  private async insertPromotionRequests(data: any) {
    if (!data.promotionRequests) return;
    
    console.log('\n📈 Migrating Promotion Requests...');
    const records = Object.entries(data.promotionRequests);
    let succeeded = 0, failed = 0, decisionCount = 0;
    const errors: string[] = [];

    for (const [id, record] of records) {
      try {
        const r: any = record;
        await this.client.query(
          `INSERT INTO promotion_requests (
            id, teacher_id, teacher_name, class_id, class_name, academic_year, status,
            admin_comments, submitted_at, reviewed_at, reviewed_by, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            id, r.teacherId, r.teacherName, r.classId, r.className, r.academicYear, r.status,
            r.adminComments, r.submittedAt, r.reviewedAt, r.reviewedBy, r.createdAt, r.updatedAt
          ]
        );

        // Insert promotion decisions
        if (r.decisions && Array.isArray(r.decisions)) {
          for (const decision of r.decisions) {
            await this.client.query(
              `INSERT INTO promotion_decisions (
                promotion_request_id, student_id, student_name, current_class, target_class, decision, comment
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [id, decision.studentId, decision.studentName, decision.currentClass, decision.targetClass, decision.decision, decision.comment]
            );
            decisionCount++;
          }
        }
        
        succeeded++;
      } catch (error: any) {
        failed++;
        errors.push(`${id}: ${error.message}`);
      }
    }

    this.trackStats('promotion_requests', records.length, succeeded, failed, errors);
    this.trackStats('promotion_decisions', decisionCount, decisionCount, 0, []);
    console.log(`✅ Promotion Requests: ${succeeded}/${records.length} migrated (${decisionCount} decisions)`);
  }

  private async insertAcademicTransitions(data: any) {
    if (!data.academicTransitions) return;
    
    console.log('\n🔄 Migrating Academic Transitions...');
    const studentRecords = Object.entries(data.academicTransitions);
    let succeeded = 0, failed = 0;
    const errors: string[] = [];

    for (const [studentId, yearRecords] of studentRecords) {
      const years: any = yearRecords;
      for (const [year, record] of Object.entries(years)) {
        try {
          const r: any = record;
          await this.client.query(
            `INSERT INTO academic_transitions (
              student_id, year, from_academic_year, to_academic_year, from_class, to_class,
              student_name, status, promotion_date, attendance_reset, scores_reset,
              carry_forward_unpaid_balances, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              studentId, year, r.fromAcademicYear, r.toAcademicYear, r.fromClass, r.toClass,
              r.studentName, r.status, r.promotionDate, r.attendanceReset, r.scoresReset,
              r.carryForwardUnpaidBalances, r.createdAt
            ]
          );
          succeeded++;
        } catch (error: any) {
          failed++;
          errors.push(`${studentId}-${year}: ${error.message}`);
        }
      }
    }

    this.trackStats('academic_transitions', succeeded + failed, succeeded, failed, errors);
    console.log(`✅ Academic Transitions: ${succeeded} migrated`);
  }

  async migrate(firebaseJsonPath: string) {
    try {
      console.log('🚀 Starting Firebase to Neon PostgreSQL Migration...\n');
      
      // Read Firebase JSON file
      console.log('📖 Reading Firebase JSON export...');
      const fileContent = await readFile(firebaseJsonPath, 'utf-8');
      const firebaseData = JSON.parse(fileContent);
      console.log('✅ Firebase JSON loaded successfully\n');

      // Connect to database
      await this.connect();

      // Create all tables
      await this.createTables();

      // Migrate data in order (respecting foreign key constraints)
      await this.insertAcademicYears(firebaseData);
      await this.insertTerms(firebaseData);
      await this.insertTeachers(firebaseData);
      await this.insertSubjects(firebaseData);
      await this.insertClasses(firebaseData);
      await this.insertStudents(firebaseData);
      await this.insertSchoolFees(firebaseData);
      await this.insertStudentBalances(firebaseData);
      await this.insertInvoices(firebaseData);
      await this.insertAssessments(firebaseData);
      await this.insertAttendance(firebaseData);
      await this.insertCanteenCollections(firebaseData);
      await this.insertPromotionRequests(firebaseData);
      await this.insertAcademicTransitions(firebaseData);

      // Print summary
      this.printSummary();

      await this.disconnect();
      
      console.log('\n✨ Migration completed successfully!');
    } catch (error) {
      console.error('\n❌ Migration failed:', error);
      throw error;
    }
  }

  private printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));

    let totalAttempted = 0;
    let totalSucceeded = 0;
    let totalFailed = 0;

    console.log('\nTable                        | Attempted | Succeeded | Failed');
    console.log('-'.repeat(80));

    for (const stat of this.stats) {
      const tableName = stat.tableName.padEnd(28);
      const attempted = stat.recordsAttempted.toString().padStart(9);
      const succeeded = stat.recordsSucceeded.toString().padStart(9);
      const failed = stat.recordsFailed.toString().padStart(6);
      
      console.log(`${tableName} | ${attempted} | ${succeeded} | ${failed}`);

      totalAttempted += stat.recordsAttempted;
      totalSucceeded += stat.recordsSucceeded;
      totalFailed += stat.recordsFailed;

      if (stat.errors.length > 0 && stat.errors.length <= 5) {
        console.log(`  Errors: ${stat.errors.join(', ')}`);
      } else if (stat.errors.length > 5) {
        console.log(`  Errors (first 5): ${stat.errors.slice(0, 5).join(', ')}`);
      }
    }

    console.log('-'.repeat(80));
    console.log(`TOTAL                        | ${totalAttempted.toString().padStart(9)} | ${totalSucceeded.toString().padStart(9)} | ${totalFailed.toString().padStart(6)}`);
    console.log('='.repeat(80));

    if (totalFailed > 0) {
      console.log(`\n⚠️  ${totalFailed} records failed to migrate. Check errors above.`);
    } else {
      console.log('\n✅ All records migrated successfully!');
    }
  }
}

// Run migration
const migration = new FirebaseToNeonMigration(CONNECTION_STRING);
migration.migrate('./firebase-export.json')
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
