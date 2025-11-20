# Audit Log System Guide

## Overview
The audit log system tracks all important changes and activities in the school management system, allowing administrators to monitor who did what and when.

## Features
- ✅ Real-time audit logging for all key operations
- ✅ Automatic login/logout tracking
- ✅ Searchable and filterable logs
- ✅ Admin-only access
- ✅ Detailed change tracking
- ✅ User, action, and entity filtering

## Accessing Audit Logs

### For Admins
1. Log in with an admin account
2. Click on "Audit Log" in the System section of the sidebar
3. View all system activities with filters and search

### Viewing Logs
- **Search**: Type in the search box to find specific users, entities, or activities
- **Filter by Action**: Create, Update, Delete, Login, Payment, Grade, Attendance
- **Filter by Entity**: Student, Teacher, Payment, Grade, Attendance, User
- **Real-time Updates**: Logs update automatically as activities occur

## How It Works

### Automatic Logging
The system automatically logs:
- User logins (via `login-logger.ts`)
- Student creation and updates
- Invoice/payment creation
- And more operations

### Manual Logging in Your Code
To add audit logging to your operations:

```typescript
import { logAuditEvent } from '@/lib/audit-logger';

// Example: Log when creating a record
await logAuditEvent(
  currentUser.id,           // userId
  currentUser.name,          // userName
  'create',                  // action: 'create' | 'update' | 'delete' | 'login' | 'payment' | 'grade' | 'attendance' | 'promotion' | 'admission'
  'student',                 // entity: 'student' | 'teacher' | 'class' | 'payment' | etc.
  newRecordId,              // entityId
  {
    userRole: currentUser.role,
    entityName: 'John Doe',
    details: 'Created new student in Grade 5',
    changes: {               // Optional: track specific field changes
      className: { old: 'Grade 4', new: 'Grade 5' }
    }
  }
);
```

### Updated Functions
The following functions have been enhanced with audit logging:
- `createStudent()` - Now accepts optional `createdBy` parameter
- `updateStudent()` - Now accepts optional `updatedBy` parameter
- `createInvoice()` - Now accepts optional `createdBy` parameter

Example usage:
```typescript
// Creating a student with audit log
await createStudent(
  studentData,
  {
    userId: currentUser.id,
    userName: currentUser.displayName,
    userRole: currentUser.role
  }
);
```

## Adding Audit Logging to More Operations

### Step 1: Import the logger
```typescript
import { logAuditEvent } from '@/lib/audit-logger';
```

### Step 2: Add logging after successful operations
```typescript
// After creating/updating/deleting
await logAuditEvent(
  userId,
  userName,
  'create', // or 'update', 'delete', etc.
  'entityType',
  entityId,
  {
    userRole: role,
    entityName: 'Friendly Name',
    details: 'What was done'
  }
);
```

### Step 3: Add change tracking (optional)
```typescript
import { trackChanges } from '@/lib/audit-logger';

// Before update
const oldData = await getRecord(id);

// After update
await updateRecord(id, newData);

// Log with changes
await logAuditEvent(
  userId,
  userName,
  'update',
  'student',
  id,
  {
    entityName: 'John Doe',
    details: 'Updated student information',
    changes: trackChanges(oldData, newData, ['firstName', 'lastName', 'className'])
  }
);
```

## Audit Event Types

### Actions
- `create` - New records created
- `update` - Existing records modified
- `delete` - Records deleted
- `login` - User authentication
- `logout` - User sign out
- `payment` - Financial transactions
- `grade` - Grade entries
- `attendance` - Attendance records
- `promotion` - Student promotions
- `admission` - New student admissions

### Entities
- `student` - Student records
- `teacher` - Teacher records
- `class` - Class records
- `subject` - Subject records
- `payment` - Payment transactions
- `grade` - Grade entries
- `attendance` - Attendance records
- `assessment` - Assessments
- `application` - Applications
- `promotion` - Promotion requests
- `user` - User accounts
- `invoice` - Invoices
- `term` - Academic terms
- `academicYear` - Academic years
- `balance` - Student balances

## Security
- Only administrators can view audit logs
- Logs are stored in Firebase Realtime Database
- All operations are tracked with timestamps
- User information is recorded for accountability

## Best Practices
1. Always pass user information when calling CRUD operations
2. Add descriptive details to help understand what changed
3. Use change tracking for important updates
4. Don't log sensitive information (passwords, etc.)
5. Log all user-initiated actions that modify data
6. Include entity names for better readability

## Example Implementation in a Component

```typescript
import { logAuditEvent } from '@/lib/audit-logger';
import { useAuth } from '@/contexts/HybridAuthContext';

function MyComponent() {
  const { currentUser } = useAuth();

  const handleCreateStudent = async (studentData) => {
    try {
      const studentId = await createStudent(
        studentData,
        {
          userId: currentUser.id,
          userName: currentUser.displayName || currentUser.username,
          userRole: currentUser.role
        }
      );
      
      toast.success('Student created successfully');
    } catch (error) {
      toast.error('Failed to create student');
    }
  };

  return (
    // Your component JSX
  );
}
```

## Troubleshooting

### Logs not appearing?
- Ensure you're logged in as an admin
- Check that the operation is calling `logAuditEvent()`
- Verify Firebase Realtime Database rules allow writing to `auditLogs`

### Missing user information?
- Make sure to pass the optional user parameters to CRUD functions
- Check that `currentUser` is available in your component

## Future Enhancements
- Export logs to CSV/PDF
- Advanced filtering (date range, multiple users)
- Detailed change diffs
- Log retention policies
- Email notifications for critical actions
