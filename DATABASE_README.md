# Database Schema Documentation

## Overview
This school management portal uses **Firebase Realtime Database** with TypeScript interfaces defining the data models. The database is organized into collections (tables) that manage academic, administrative, and financial operations.

## Database Collections (Tables)

### 1. Academic Management

#### `academicYears`
Manages academic year periods.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `name` (string): Academic year name (e.g., "2025/2026")
- `startDate` (string): Start date in ISO format
- `endDate` (string): End date in ISO format
- `status` (enum): 'active' | 'inactive' | 'archived'
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- One-to-many with `terms` (academicYearId)
- Referenced by `students`, `schoolFees`, `invoices`

---

#### `terms`
Manages terms within academic years.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `academicYearId` (string): Reference to academic year
- `academicYearName` (string): Academic year name for display
- `name` (enum): 'First Term' | 'Second Term' | 'Third Term'
- `startDate` (string): Term start date
- `endDate` (string): Term end date
- `status` (enum): 'active' | 'upcoming' | 'completed'
- `isCurrentTerm` (boolean): Marks the current active term
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- Many-to-one with `academicYears` (academicYearId)
- Referenced by `students`, `schoolFees`, `invoices`, `assessments`, `attendance`

---

### 2. User Management

#### `users` (Firestore Collection)
Manages system users and authentication.

**Parameters:**
- `uid` (string): Firebase Auth user ID
- `email` (string): User email address
- `displayName` (string): Full name
- `role` (enum): 'admin' | 'teacher' | 'accountant' | 'student'
- `status` (enum): 'active' | 'inactive' | 'suspended'
- `createdAt` (timestamp): Creation timestamp
- `updatedAt` (timestamp): Last update timestamp
- `profilePicture` (string, optional): Profile image URL
- `phone` (string, optional): Phone number
- `department` (string, optional): Department/division
- `employeeId` (string, optional): Employee ID for staff
- `studentId` (string, optional): Student ID for students

**Relationships:**
- One-to-many with `students` (teacherId)
- One-to-many with `teachers` (employeeId)
- Referenced by `attendance`, `assessments`, `canteenCollections`

---

### 3. Student Management

#### `students`
Comprehensive student profiles and academic information.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `firstName` (string): Student's first name
- `lastName` (string): Student's last name
- `email` (string): Student email
- `phone` (string): Student phone number
- `dateOfBirth` (string): Date of birth
- `className` (string): Current class enrollment
- `previousClass` (string, optional): Previous class (for promotions)
- `academicYear` (string): Current academic year
- `previousAcademicYear` (string, optional): Previous academic year
- `parentName` (string): Parent/guardian name
- `parentPhone` (string): Parent phone number
- `parentWhatsApp` (string): Parent WhatsApp number
- `parentEmail` (string): Parent email
- `address` (string): Home address
- `enrollmentDate` (string): Date of enrollment
- `status` (enum): 'active' | 'inactive' | 'graduated'
- `photoUrl` (string, optional): Student photo URL
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- Many-to-one with `classes` (className)
- Many-to-one with `academicYears` (academicYear)
- One-to-many with `assessments` (studentId)
- One-to-many with `attendance` (studentId)
- One-to-many with `invoices` (studentId)
- One-to-many with `studentBalances` (studentId)
- One-to-many with `studentDocuments` (studentId)
- One-to-many with `promotionRequests` (studentId)

---

#### `applications`
Admission applications and enrollment requests.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `studentName` (string): Applicant's name
- `parentName` (string): Parent/guardian name
- `className` (string): Applied class
- `appliedDate` (string): Application submission date
- `status` (enum): 'pending' | 'approved' | 'rejected'
- `phone` (string, optional): Contact phone
- `email` (string, optional): Contact email
- `previousSchool` (string, optional): Previous school
- `reason` (string, optional): Application reason/notes
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- Many-to-one with `classes` (className)
- Can transition to `students` when approved

---

### 4. Staff Management

#### `teachers`
Teacher profiles and professional information.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `firstName` (string): Teacher's first name
- `lastName` (string): Teacher's last name
- `email` (string): Teacher email
- `phone` (string): Teacher phone number
- `employeeId` (string): Unique employee identifier
- `department` (string): Teaching department
- `position` (string): Job position/title
- `qualifications` (string[]): Array of qualifications
- `subjects` (string[]): Array of subjects taught
- `dateOfJoining` (string): Employment start date
- `salary` (number): Monthly salary
- `status` (enum): 'active' | 'inactive' | 'terminated'
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- One-to-many with `subjects` (teacherId)
- One-to-many with `classes` (teacherIds)
- One-to-many with `assessments` (teacherId)
- One-to-many with `attendance` (teacherId)
- One-to-many with `promotionRequests` (teacherId)

---

### 5. Academic Structure

#### `subjects`
Academic subjects and curriculum management.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `name` (string): Subject name
- `code` (string, optional): Subject code
- `description` (string, optional): Subject description
- `category` (enum, optional): 'core' | 'elective' | 'extracurricular'
- `grade` (string, optional): Applicable grade level
- `department` (string, optional): Subject department
- `credits` (number, optional): Credit hours
- `teacherId` (string, optional): Assigned teacher
- `status` (enum, optional): 'active' | 'inactive'
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- Many-to-one with `teachers` (teacherId)
- One-to-many with `classes` (subjects array)
- One-to-many with `assessments` (subjectId)

---

#### `classes`
Class definitions and scheduling.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `className` (string): Class name (e.g., "Primary 1")
- `name` (string, optional): Display name
- `section` (string, optional): Class section
- `academicYear` (string, optional): Academic year
- `subjectId` (string, optional): Primary subject (legacy)
- `teacherIds` (string[], optional): Array of assigned teachers
- `room` (string, optional): Classroom location
- `capacity` (number, optional): Maximum students
- `currentStrength` (number, optional): Current enrollment
- `subjects` (string[], optional): Array of subjects
- `schedule` (object, optional): Weekly schedule
  - `monday` (string, optional): Monday schedule
  - `tuesday` (string, optional): Tuesday schedule
  - `wednesday` (string, optional): Wednesday schedule
  - `thursday` (string, optional): Thursday schedule
  - `friday` (string, optional): Friday schedule
- `status` (enum, optional): 'active' | 'inactive'
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- One-to-many with `students` (className)
- Many-to-many with `teachers` (teacherIds)
- Many-to-many with `subjects` (subjects array)
- One-to-many with `attendance` (classId)
- One-to-many with `assessments` (classId)

---

### 6. Academic Records

#### `assessments`
Student grades and assessment records.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `studentId` (string): Student reference
- `studentName` (string): Student name for display
- `classId` (string): Class reference
- `subjectId` (string): Subject reference
- `teacherId` (string): Teacher reference
- `assessmentType` (enum): 'assignment' | 'exercise' | 'exam'
- `description` (string, optional): Assessment description
- `score` (number): Student's score
- `maxScore` (number): Maximum possible score
- `date` (string): Assessment date (ISO format)
- `termId` (string, optional): Term reference
- `termName` (string, optional): Term name for display
- `academicYearId` (string, optional): Academic year reference
- `academicYearName` (string, optional): Academic year name
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- Many-to-one with `students` (studentId)
- Many-to-one with `classes` (classId)
- Many-to-one with `subjects` (subjectId)
- Many-to-one with `teachers` (teacherId)
- Many-to-one with `terms` (termId)

---

#### `attendance`
Daily attendance tracking.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `classId` (string): Class reference
- `teacherId` (string): Teacher reference
- `date` (string): Attendance date (yyyy-mm-dd)
- `entries` (array): Array of attendance entries
  - `studentId` (string): Student reference
  - `status` (enum): 'present' | 'absent' | 'late'
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- Many-to-one with `classes` (classId)
- Many-to-one with `teachers` (teacherId)
- References `students` through entries array

---

### 7. Financial Management

#### `schoolFees`
Fee structures by class and academic year.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `className` (string): Class reference
- `tuitionFees` (number): Tuition fee amount
- `examFees` (number): Examination fee amount
- `activityFees` (number): Activity fee amount
- `otherFees` (number): Other miscellaneous fees
- `totalFees` (number): Calculated total fees
- `academicYear` (string): Academic year reference
- `termId` (string, optional): Term reference
- `termName` (string, optional): Term name for display
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- Many-to-one with `classes` (className)
- Many-to-one with `academicYears` (academicYear)
- Many-to-one with `terms` (termId)
- Used to calculate `studentBalances`

---

#### `studentBalances`
Individual student fee balances and payment tracking.

**Parameters:**
- `id` (string): Student ID (used as key)
- `studentId` (string): Student reference
- `studentName` (string): Student name for display
- `className` (string): Class reference
- `totalFees` (number): Total fees owed
- `amountPaid` (number): Amount paid to date
- `balance` (number): Outstanding balance
- `lastPaymentDate` (string, optional): Last payment date
- `status` (enum): 'paid' | 'partial' | 'overdue'
- `termId` (string, optional): Term reference
- `termName` (string, optional): Term name
- `academicYearId` (string, optional): Academic year reference
- `academicYearName` (string, optional): Academic year name
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- One-to-one with `students` (studentId)
- Many-to-one with `classes` (className)
- Many-to-one with `terms` (termId)
- Updated by `invoices` payments

---

#### `invoices`
Billing records and payment tracking.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `studentId` (string): Student reference
- `studentName` (string): Student name for display
- `description` (string): Invoice description
- `amount` (number): Invoice amount
- `dueDate` (string): Payment due date
- `status` (enum): 'Paid' | 'Pending' | 'Overdue'
- `paymentDate` (string, optional): Payment date
- `termId` (string, optional): Term reference
- `termName` (string, optional): Term name
- `academicYearId` (string, optional): Academic year reference
- `academicYearName` (string, optional): Academic year name
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- Many-to-one with `students` (studentId)
- Many-to-one with `terms` (termId)
- Many-to-one with `academicYears` (academicYearId)
- Updates `studentBalances` when paid

---

#### `canteenCollections`
Canteen/feeding fee collections tracking.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `date` (string): Collection date
- `totalAmount` (number): Total amount collected
- `numberOfStudents` (number, optional): Number of students
- `proofDocUrl` (string, optional): Proof document URL
- `proofDocName` (string, optional): Proof document name
- `proofDocType` (string, optional): Proof document type
- `notes` (string, optional): Additional notes
- `recordedBy` (string): Recorder user ID
- `recordedByName` (string): Recorder name
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- Many-to-one with `users` (recordedBy)

---

### 8. Administrative

#### `promotionRequests`
Student promotion decisions and workflow.

**Parameters:**
- `id` (string): Unique identifier
- `teacherId` (string): Teacher reference
- `teacherName` (string): Teacher name
- `classId` (string): Class reference
- `className` (string): Class name
- `academicYear` (string): Academic year
- `decisions` (array): Array of promotion decisions
  - `studentId` (string): Student reference
  - `studentName` (string): Student name
  - `currentClass` (string): Current class
  - `decision` (enum): 'promote' | 'repeat'
  - `targetClass` (string, optional): Target class for promotion
  - `comment` (string, optional): Decision comment
- `status` (enum): 'pending' | 'approved' | 'rejected'
- `submittedAt` (string): Submission timestamp
- `reviewedAt` (string, optional): Review timestamp
- `reviewedBy` (string, optional): Reviewer user ID
- `adminComments` (string, optional): Admin comments
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

**Relationships:**
- Many-to-one with `teachers` (teacherId)
- Many-to-one with `classes` (classId)
- References `students` through decisions array

---

#### `studentDocuments`
File and document storage for students.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `studentId` (string): Student reference
- `studentName` (string): Student name
- `fileName` (string): Original file name
- `fileUrl` (string): File storage URL
- `fileType` (string): File MIME type
- `fileSize` (number): File size in bytes
- `uploadedBy` (string): Uploader user ID
- `uploadDate` (string): Upload timestamp
- `description` (string, optional): File description
- `category` (enum, optional): 'ID' | 'Certificate' | 'Medical' | 'Report' | 'Other'

**Relationships:**
- Many-to-one with `students` (studentId)
- Many-to-one with `users` (uploadedBy)

---

#### `reports`
System reports configuration and metadata.

**Parameters:**
- `id` (string, auto-generated): Unique identifier
- `title` (string): Report title
- `description` (string): Report description
- `category` (enum): 'Academic' | 'Finance' | 'Administrative'
- `lastGenerated` (string, optional): Last generation timestamp
- `format` (string): Report format (PDF, Excel, etc.)
- `icon` (string, optional): Report icon
- `status` (enum, optional): 'active' | 'inactive'
- `createdAt` (string): Creation timestamp
- `updatedAt` (string): Last update timestamp

---

#### `reportStats`
Analytics and usage statistics for reports.

**Parameters:**
- `reportsGenerated` (number): Total reports generated
- `downloads` (number): Total downloads
- `activeReports` (number): Active report count
- `lastUpdated` (string): Last update timestamp

---

## Database Relationships Summary

### Primary Relationships
1. **Academic Hierarchy**: `academicYears` → `terms` → `students`/`classes`
2. **Student Management**: `students` ↔ `classes` ↔ `teachers` ↔ `subjects`
3. **Academic Records**: `students` → `assessments` → `subjects`/`teachers`
4. **Financial Flow**: `schoolFees` → `studentBalances` ← `invoices`
5. **User System**: `users` (Firestore) ↔ All collections (RTDB)

### Key Foreign Key Relationships
- `students.academicYear` → `academicYears.name`
- `students.className` → `classes.className`
- `terms.academicYearId` → `academicYears.id`
- `assessments.studentId` → `students.id`
- `assessments.subjectId` → `subjects.id`
- `assessments.teacherId` → `teachers.id`
- `attendance.classId` → `classes.id`
- `invoices.studentId` → `students.id`
- `studentBalances.studentId` → `students.id`

### Data Flow Patterns
1. **Enrollment**: `applications` → `students` → `studentBalances`
2. **Academic Progress**: `assessments` + `attendance` → `promotionRequests`
3. **Financial Management**: `schoolFees` → `invoices` → `studentBalances`
4. **Administrative**: `users` → All operational collections

## Database Operations

### Real-time Subscriptions
All collections support real-time listeners for live updates:
- `subscribeToStudents()`
- `subscribeToTeachers()`
- `subscribeToSubjects()`
- `subscribeToClasses()`
- `subscribeToAssessments()`
- `subscribeToAttendance()`
- `subscribeToInvoices()`
- `subscribeToStudentBalances()`
- `subscribeToCanteenCollections()`
- `subscribeToPromotionRequests()`

### CRUD Operations
Each collection has standard CRUD operations:
- `create*()` - Create new records
- `getAll*()` - Fetch all records
- `update*()` - Update existing records
- `delete*()` - Remove records (where applicable)

### Special Operations
- **Promotions**: `executePromotion()` - Bulk student promotions
- **Balance Updates**: `updateStudentBalance()` - Payment processing
- **Attendance**: `recordAttendance()` - Batch attendance entry
- **Reports**: `updateReportStats()` - Analytics tracking

## Data Validation and Constraints

### Required Fields
- All collections require `id`, `createdAt`, `updatedAt`
- User references are required for audit trails
- Academic references maintain data integrity

### Enum Values
- **Status fields**: 'active' | 'inactive' | 'archived'/'suspended'/'terminated'/'graduated'
- **User roles**: 'admin' | 'teacher' | 'accountant' | 'student'
- **Payment status**: 'Paid' | 'Pending' | 'Overdue'
- **Assessment types**: 'assignment' | 'exercise' | 'exam'

### Business Rules
- Only one current term per academic year
- Student balances auto-calculate from fees and payments
- Promotion requests require teacher and admin approval
- Attendance records are date-specific and class-specific

## Security and Access Control

### Authentication
- Firebase Authentication for user management
- Role-based access control (RBAC)
- User roles determine data access permissions

### Data Security
- Real-time database rules for read/write permissions
- User-specific data filtering
- Audit trails for all modifications

### Backup and Recovery
- Firebase automatic backups
- Data export capabilities
- Point-in-time recovery options
