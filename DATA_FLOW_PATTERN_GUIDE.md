# Data Flow Pattern Guide for School Operations

## Overview

Complete implementation of the data flow pattern for school operations with immediate UI updates, automatic syncing, and notification system.

## Data Flow Pattern

```
Teacher marks attendance
         ↓
Write to IndexedDB (pending)
         ↓
Update UI immediately ← YOU SEE IT NOW!
         ↓
(if online) → Sync to Firebase
         ↓
Update IndexedDB (synced)
         ↓
Notify admin/parents if configured
```

## Implementation

### Core Components

1. **Data Flow Manager** (`data-flow-manager.ts`)
   - Orchestrates the complete 5-step flow
   - Handles notifications
   - Manages operation queue

2. **Data Flow Hooks** (`use-data-flow.ts`)
   - React hooks for easy integration
   - Automatic UI updates
   - Built-in loading/error states

## Step-by-Step Flow

### Step 1: Write to IndexedDB (pending)

```typescript
// Data is immediately saved locally
await indexedDBManager.putInStore('attendance', {
  ...attendanceData,
  syncStatus: 'pending',
  localUpdatedAt: Date.now(),
});
```

**Result**: Data is safe, even if device loses power!

### Step 2: Update UI Immediately

```typescript
// UI updates instantly - no waiting for Firebase!
dataFlowManager.emitUIUpdate(operation);
```

**Result**: Teacher sees attendance marked immediately!

### Step 3: Sync to Firebase (if online)

```typescript
if (navigator.onLine) {
  await set(firebaseRef, firebaseData);
}
```

**Result**: Data synced to cloud when online!

### Step 4: Update IndexedDB (synced)

```typescript
await indexedDBManager.putInStore('attendance', {
  ...attendanceData,
  syncStatus: 'synced',
  lastSyncedAt: Date.now(),
});
```

**Result**: Local data marked as synced!

### Step 5: Notify admin/parents

```typescript
await triggerNotifications({
  entityType: 'attendance',
  recipients: ['admin', 'parent'],
  data: attendanceData,
});
```

**Result**: Stakeholders notified of the change!

## Usage Examples

### Example 1: Marking Attendance (Teacher)

**Using Hook (Recommended)**:

```tsx
import { useMarkAttendance } from './lib/offline/use-data-flow';
import { useNetwork } from './lib/offline';

function AttendanceForm({ classId, students }) {
  const { mark, loading, result } = useMarkAttendance();
  const networkInfo = useNetwork();

  const handleSubmit = async (attendanceData) => {
    const result = await mark({
      classId,
      teacherId: currentUser.uid,
      date: new Date().toISOString().split('T')[0],
      entries: attendanceData,
    });

    if (result.success) {
      if (result.synced) {
        alert('✅ Attendance marked and synced!');
      } else {
        alert('✅ Attendance marked! Will sync when online.');
      }
    }
  };

  return (
    <div>
      {/* Offline indicator */}
      {!networkInfo.isOnline && (
        <div className="alert alert-warning">
          ⚠️ Working Offline - Attendance will sync when online
        </div>
      )}

      {/* Show sync status */}
      {result && (
        <div className="status-bar">
          <span>✅ Saved locally</span>
          {result.synced && <span>☁️ Synced to cloud</span>}
          {result.notificationsSent && <span>📢 Parents notified</span>}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {students.map(student => (
          <AttendanceRow key={student.id} student={student} />
        ))}
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Mark Attendance'}
        </button>
      </form>
    </div>
  );
}
```

**What Happens**:
1. Teacher clicks "Mark Attendance"
2. ✅ Data saved to IndexedDB instantly
3. ✅ UI shows "Saved locally" immediately
4. ☁️ Data syncs to Firebase (if online)
5. ✅ UI shows "Synced to cloud"
6. 📢 Parents receive notification

### Example 2: Recording Grades (Teacher)

```tsx
import { useRecordGrade } from './lib/offline/use-data-flow';

function GradeEntryForm({ studentId, subjectId }) {
  const { record, loading, result } = useRecordGrade();

  const handleSubmit = async (gradeData) => {
    const result = await record({
      studentId,
      studentName: student.name,
      classId: student.classId,
      subjectId,
      teacherId: currentUser.uid,
      assessmentType: 'exam',
      score: gradeData.score,
      maxScore: 100,
      date: new Date().toISOString(),
    });

    if (result.success) {
      console.log('Grade recorded!');
      console.log('Synced:', result.synced);
      console.log('Notifications sent:', result.notificationsSent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="number" name="score" max="100" required />
      <button type="submit" disabled={loading}>
        {loading ? 'Recording...' : 'Record Grade'}
      </button>
      
      {result && (
        <div className="success-message">
          ✅ Grade recorded
          {result.synced && ' and synced'}
          {result.notificationsSent && ' - Parent notified'}
        </div>
      )}
    </form>
  );
}
```

### Example 3: Fee Payment (Admin)

```tsx
import { useRecordFeePayment } from './lib/offline/use-data-flow';

function FeePaymentForm({ studentId }) {
  const { record, loading, result } = useRecordFeePayment();

  const handlePayment = async (paymentData) => {
    const result = await record({
      studentId,
      studentName: student.name,
      className: student.className,
      amountPaid: paymentData.amount,
      paymentDate: new Date().toISOString(),
      paymentMethod: paymentData.method,
      receiptNumber: paymentData.receiptNumber,
    });

    if (result.success) {
      // Payment recorded!
      // Parent will be notified automatically
    }
  };

  return (
    <form onSubmit={handlePayment}>
      <input type="number" name="amount" required />
      <select name="method">
        <option value="cash">Cash</option>
        <option value="mobile">Mobile Money</option>
        <option value="bank">Bank Transfer</option>
      </select>
      <button type="submit" disabled={loading}>
        Record Payment
      </button>
    </form>
  );
}
```

### Example 4: Student Enrollment (Admin)

```tsx
import { useEnrollStudent } from './lib/offline/use-data-flow';

function StudentEnrollmentForm() {
  const { enroll, loading, result } = useEnrollStudent();

  const handleSubmit = async (formData) => {
    const result = await enroll({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      className: formData.className,
      parentName: formData.parentName,
      parentPhone: formData.parentPhone,
      parentEmail: formData.parentEmail,
      address: formData.address,
      enrollmentDate: new Date().toISOString(),
      status: 'active',
    });

    if (result.success) {
      alert('Student enrolled successfully!');
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

## Real-Time UI Updates

### Listening for Updates

```tsx
import { useDataFlow } from './lib/offline/use-data-flow';

function AttendanceMonitor() {
  const { operations } = useDataFlow('attendance');

  return (
    <div>
      <h2>Recent Attendance Records</h2>
      {operations.map(op => (
        <div key={op.id}>
          <span>{op.data.className}</span>
          <span>{new Date(op.timestamp).toLocaleTimeString()}</span>
          <span>{op.data.syncStatus}</span>
        </div>
      ))}
    </div>
  );
}
```

### Viewing Recent Operations

```tsx
import { useRecentOperations } from './lib/offline/use-data-flow';

function RecentActivity() {
  const operations = useRecentOperations('*', 20); // Last 20 operations

  return (
    <div>
      <h2>Recent Activity</h2>
      {operations.map(op => (
        <div key={op.id}>
          <span>{op.entityType}</span>
          <span>{op.operationType}</span>
          <span>{op.userRole}</span>
          <span>{new Date(op.timestamp).toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}
```

## Notification System

### Notification Configuration

Notifications are automatically configured per entity type:

```typescript
// Attendance notifications
{
  enabled: true,
  channels: ['in-app'],
  recipients: {
    admins: true,
    parents: true, // Parents notified of their child's attendance
  }
}

// Grade notifications
{
  enabled: true,
  channels: ['in-app'],
  recipients: {
    admins: true,
    parents: true, // Parents notified of grades
  }
}

// Fee payment notifications
{
  enabled: true,
  channels: ['in-app'],
  recipients: {
    admins: true,
    parents: true, // Parents notified of payments
  }
}
```

### Custom Notifications

```typescript
import { dataFlowManager } from './lib/offline/data-flow-manager';

// Send custom notification
await dataFlowManager.executeFlow({
  id: 'custom-123',
  entityType: 'attendance',
  operationType: 'create',
  data: attendanceData,
  userId: currentUser.uid,
  userRole: 'teacher',
  timestamp: Date.now(),
  notifyRoles: ['admin', 'parent'], // Who to notify
  notifyUsers: ['user123', 'user456'], // Specific users
});
```

## Flow Visualization

### Successful Online Flow

```
[Teacher] Mark Attendance
    ↓ (instant)
[IndexedDB] Save (pending)
    ↓ (instant)
[UI] Show "Saved ✅"
    ↓ (1-2 seconds)
[Firebase] Sync to cloud
    ↓ (instant)
[IndexedDB] Update (synced)
    ↓ (instant)
[UI] Show "Synced ☁️"
    ↓ (instant)
[Notifications] Notify parents 📢
    ↓ (instant)
[UI] Show "Parents notified"
```

### Offline Flow

```
[Teacher] Mark Attendance
    ↓ (instant)
[IndexedDB] Save (pending)
    ↓ (instant)
[UI] Show "Saved ✅ (Offline)"
    ↓ (waiting for connection...)
[Network] Comes online
    ↓ (auto-triggered)
[Firebase] Sync to cloud
    ↓ (instant)
[IndexedDB] Update (synced)
    ↓ (instant)
[UI] Show "Synced ☁️"
    ↓ (instant)
[Notifications] Notify parents 📢
```

## Benefits

### For Teachers

✅ **Instant Feedback** - See results immediately  
✅ **No Waiting** - Don't wait for Firebase  
✅ **Works Offline** - Mark attendance anywhere  
✅ **Auto-Sync** - Data syncs automatically  
✅ **No Data Loss** - Everything saved locally first  

### For Admins

✅ **Real-Time Monitoring** - See operations as they happen  
✅ **Automatic Notifications** - Parents notified automatically  
✅ **Audit Trail** - All operations logged  
✅ **Sync Status** - Know what's synced and what's pending  

### For Parents

✅ **Instant Notifications** - Know when child is marked present/absent  
✅ **Grade Alerts** - Notified when grades are posted  
✅ **Payment Confirmations** - Notified of fee payments  

## Testing the Flow

### Test 1: Online Flow

1. Ensure device is online
2. Mark attendance
3. Verify:
   - ✅ UI updates instantly
   - ✅ Data appears in Firebase console
   - ✅ Status shows "synced"
   - ✅ Notifications sent

### Test 2: Offline Flow

1. Go offline (DevTools → Network → Offline)
2. Mark attendance
3. Verify:
   - ✅ UI updates instantly
   - ✅ Status shows "pending"
   - ✅ Data in IndexedDB
4. Go online
5. Wait for auto-sync
6. Verify:
   - ✅ Status changes to "synced"
   - ✅ Data in Firebase console
   - ✅ Notifications sent

### Test 3: Multiple Operations

1. Go offline
2. Mark attendance for 3 classes
3. Record 5 grades
4. Go online
5. Verify:
   - ✅ All operations sync
   - ✅ All notifications sent
   - ✅ No data loss

## Monitoring

### View Operation Status

```tsx
import { useOperationStatus } from './lib/offline/use-data-flow';

function OperationStatus({ operationId }) {
  const status = useOperationStatus(operationId);

  return (
    <div>
      {status.pending && <span>⏳ Pending</span>}
      {status.synced && <span>✅ Synced</span>}
      {status.notified && <span>📢 Notified</span>}
    </div>
  );
}
```

### View Notification Queue

```typescript
import { dataFlowManager } from './lib/offline/data-flow-manager';

const queueSize = dataFlowManager.getQueueSize();
console.log(`${queueSize} notifications queued`);
```

## Summary

The data flow pattern provides:

✅ **Immediate UI Updates** - No waiting for Firebase  
✅ **Offline Support** - Works without internet  
✅ **Automatic Sync** - Syncs when online  
✅ **Notifications** - Automatic stakeholder alerts  
✅ **Audit Trail** - Complete operation history  
✅ **Data Integrity** - No data loss  
✅ **Real-Time Monitoring** - See operations as they happen  

**Your school operations now have enterprise-grade data flow! 🎉**
