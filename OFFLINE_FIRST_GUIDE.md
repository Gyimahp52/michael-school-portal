# Offline-First Implementation Guide

## Overview

This implementation provides **offline-first functionality** for the Michael School Portal, allowing the application to work seamlessly with or without internet connectivity. Data is stored locally in IndexedDB and automatically syncs with Firebase when online.

## Key Features

✅ **Complete Firebase Schema Mirror** - IndexedDB structure exactly matches Firebase RTDB  
✅ **Automatic Bidirectional Sync** - Changes sync automatically between local and remote  
✅ **Real-time Updates** - Firebase changes are reflected in IndexedDB in real-time  
✅ **Conflict Resolution** - Configurable strategies for handling data conflicts  
✅ **React Hooks** - Easy-to-use hooks for accessing offline data  
✅ **Sync Status Monitoring** - Track online/offline status and sync progress  
✅ **Pending Changes Queue** - Local changes are queued and synced when online  

## Architecture

### Components

1. **IndexedDB Schema** (`indexeddb-schema.ts`)
   - Defines all object stores matching Firebase collections
   - Adds sync metadata fields to track sync status

2. **IndexedDB Manager** (`indexeddb-manager.ts`)
   - Low-level database operations
   - Database initialization and upgrades
   - Batch operations for performance

3. **CRUD Operations** (`indexeddb-operations.ts`, `indexeddb-operations-extended.ts`)
   - Complete CRUD operations for all collections
   - Maintains same interface as Firebase operations
   - Automatic sync metadata management

4. **Sync Manager** (`sync-manager.ts`)
   - Handles bidirectional synchronization
   - Monitors online/offline status
   - Manages conflict resolution
   - Provides real-time Firebase subscriptions

5. **React Hooks** (`use-offline-data.ts`)
   - Hooks for each collection type
   - Automatic refresh on sync completion
   - Loading and error states

6. **Context Provider** (`OfflineContext.tsx`)
   - Application-wide offline functionality
   - Initialization and configuration
   - Sync status management

## Database Schema

All Firebase collections are mirrored in IndexedDB with **identical field names and types**:

### Collections

- `academicYears` - Academic year periods
- `terms` - Terms within academic years
- `students` - Student profiles and enrollment
- `teachers` - Teacher profiles and assignments
- `subjects` - Academic subjects
- `classes` - Class definitions and schedules
- `applications` - Admission applications
- `assessments` - Grades and assessment records
- `attendance` - Daily attendance tracking
- `schoolFees` - Fee structures by class
- `studentBalances` - Individual student fee balances
- `invoices` - Billing records and payments
- `studentDocuments` - File storage references
- `canteenCollections` - Canteen fee collections
- `promotionRequests` - Student promotion workflow
- `reports` - Report configurations
- `reportStats` - Report analytics

### Sync Metadata Fields

Each record includes these additional fields (NOT in Firebase):

```typescript
{
  syncStatus: 'synced' | 'pending' | 'failed',
  localUpdatedAt: number,  // milliseconds timestamp
  lastSyncedAt?: number    // milliseconds timestamp
}
```

## Installation & Setup

### 1. Wrap Your App with OfflineProvider

```tsx
// src/main.tsx or src/App.tsx
import { OfflineProvider } from './contexts/OfflineContext';

function App() {
  return (
    <OfflineProvider 
      autoSync={true}        // Enable automatic syncing
      syncInterval={30000}   // Sync every 30 seconds
    >
      {/* Your app components */}
    </OfflineProvider>
  );
}
```

### 2. Use Offline Hooks in Components

```tsx
import { useStudents, useOffline, useSyncStatus } from './lib/offline';

function StudentsPage() {
  // Get students data (works offline!)
  const { data: students, loading, error, isOnline, refresh } = useStudents();
  
  // Get offline context
  const { isInitialized, syncNow } = useOffline();
  
  // Get sync status
  const syncStatus = useSyncStatus();

  if (!isInitialized) {
    return <div>Initializing offline storage...</div>;
  }

  if (loading) {
    return <div>Loading students...</div>;
  }

  return (
    <div>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="offline-banner">
          ⚠️ You are offline. Changes will sync when connection is restored.
        </div>
      )}

      {/* Sync status */}
      {syncStatus.isSyncing && <div>Syncing...</div>}
      {syncStatus.pendingChanges > 0 && (
        <div>{syncStatus.pendingChanges} changes pending sync</div>
      )}

      {/* Students list */}
      {students.map(student => (
        <div key={student.id}>{student.firstName} {student.lastName}</div>
      ))}

      {/* Manual sync button */}
      <button onClick={syncNow} disabled={!isOnline}>
        Sync Now
      </button>
    </div>
  );
}
```

## Usage Examples

### Reading Data

```tsx
// Get all students
const { data: students } = useStudents();

// Get students by class
const { data: classStudents } = useStudentsByClass('Primary 1');

// Get current term
const { term } = useCurrentTerm();

// Get assessments for a student
const { data: assessments } = useAssessmentsByStudent(studentId);

// Get attendance by class
const { data: attendance } = useAttendanceByClass(classId);
```

### Creating/Updating Data

```tsx
import { useOfflineMutation } from './lib/offline';
import { createStudent, updateStudent } from './lib/offline';

function StudentForm() {
  const { mutate, loading, error } = useOfflineMutation();

  const handleSubmit = async (formData) => {
    await mutate(async () => {
      const studentId = await createStudent({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        className: formData.className,
        parentName: formData.parentName,
        parentPhone: formData.parentPhone,
        parentWhatsApp: formData.parentWhatsApp,
        parentEmail: formData.parentEmail,
        address: formData.address,
        enrollmentDate: new Date().toISOString(),
        status: 'active',
      });
      
      console.log('Student created:', studentId);
      // Data is saved locally and will sync automatically
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Student'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
```

### Monitoring Sync Status

```tsx
import { useSyncStatus, useOnlineStatus } from './lib/offline';

function SyncStatusIndicator() {
  const syncStatus = useSyncStatus();
  const isOnline = useOnlineStatus();

  return (
    <div className="sync-status">
      {/* Online/Offline indicator */}
      <div className={isOnline ? 'online' : 'offline'}>
        {isOnline ? '🟢 Online' : '🔴 Offline'}
      </div>

      {/* Sync progress */}
      {syncStatus.isSyncing && (
        <div>🔄 Syncing...</div>
      )}

      {/* Pending changes */}
      {syncStatus.pendingChanges > 0 && (
        <div>📤 {syncStatus.pendingChanges} changes pending</div>
      )}

      {/* Failed changes */}
      {syncStatus.failedChanges > 0 && (
        <div>❌ {syncStatus.failedChanges} changes failed</div>
      )}

      {/* Last sync time */}
      {syncStatus.lastSyncTime && (
        <div>
          Last synced: {new Date(syncStatus.lastSyncTime).toLocaleTimeString()}
        </div>
      )}

      {/* Sync error */}
      {syncStatus.error && (
        <div>Error: {syncStatus.error}</div>
      )}
    </div>
  );
}
```

### Manual Sync Control

```tsx
import { useOffline } from './contexts/OfflineContext';
import { syncManager } from './lib/offline';

function SyncControls() {
  const { syncNow, clearLocalData, isOnline } = useOffline();

  const handleSyncNow = async () => {
    try {
      await syncNow();
      alert('Sync completed successfully!');
    } catch (error) {
      alert('Sync failed: ' + error.message);
    }
  };

  const handleSyncCollection = async (collectionName: string) => {
    try {
      await syncManager.syncCollection(collectionName);
      alert(`${collectionName} synced successfully!`);
    } catch (error) {
      alert('Sync failed: ' + error.message);
    }
  };

  const handleClearData = async () => {
    if (confirm('Are you sure? This will delete all local data.')) {
      await clearLocalData();
      alert('Local data cleared!');
    }
  };

  return (
    <div>
      <button onClick={handleSyncNow} disabled={!isOnline}>
        Sync All Data
      </button>
      
      <button onClick={() => handleSyncCollection('students')} disabled={!isOnline}>
        Sync Students Only
      </button>
      
      <button onClick={handleClearData}>
        Clear Local Data
      </button>
    </div>
  );
}
```

## Advanced Configuration

### Conflict Resolution Strategies

```tsx
import { syncManager } from './lib/offline';

// Configure conflict resolution
syncManager.configure({
  autoSync: true,
  syncInterval: 30000,
  conflictResolution: 'latest'  // 'local' | 'remote' | 'latest'
});
```

- **`latest`** (default): Use the most recently updated version
- **`local`**: Always prefer local changes
- **`remote`**: Always prefer remote (Firebase) changes

### Custom Sync Intervals

```tsx
// Sync every minute
syncManager.configure({ syncInterval: 60000 });

// Sync every 5 minutes
syncManager.configure({ syncInterval: 300000 });

// Disable auto-sync (manual only)
syncManager.configure({ autoSync: false });
```

### Real-time Firebase Subscriptions

```tsx
// Subscribe to specific collections for real-time updates
syncManager.subscribeToFirebaseUpdates('students');
syncManager.subscribeToFirebaseUpdates('attendance');

// Unsubscribe when no longer needed
syncManager.unsubscribeFromFirebaseUpdates('students');

// Subscribe to all collections
syncManager.subscribeToAllFirebaseUpdates();

// Unsubscribe from all
syncManager.unsubscribeFromAllFirebaseUpdates();
```

## Common Queries

### Students by Class and Status

```tsx
const { data: students } = useStudents();
const activeStudents = students.filter(s => 
  s.className === 'Primary 1' && s.status === 'active'
);
```

### Assessments by Term

```tsx
const { data: assessments } = useAssessmentsByStudent(studentId);
const termAssessments = assessments.filter(a => a.termId === termId);
```

### Attendance by Date Range

```tsx
const { data: attendance } = useAttendanceByClass(classId);
const dateRangeAttendance = attendance.filter(a => {
  const date = new Date(a.date);
  return date >= startDate && date <= endDate;
});
```

### Overdue Invoices

```tsx
const { data: invoices } = useInvoices();
const overdueInvoices = invoices.filter(i => 
  i.status === 'Overdue' && new Date(i.dueDate) < new Date()
);
```

## Performance Optimization

### Batch Operations

```tsx
import { indexedDBManager } from './lib/offline';

// Batch insert multiple students
const students = [/* array of student objects */];
await indexedDBManager.batchPut('students', students);
```

### Selective Syncing

```tsx
// Only sync specific collections
await syncManager.syncCollection('students');
await syncManager.syncCollection('attendance');
```

### Lazy Loading

```tsx
// Load data only when needed
const [students, setStudents] = useState([]);

const loadStudents = async () => {
  const data = await getAllStudents();
  setStudents(data);
};

// Call loadStudents() only when component mounts or on user action
```

## Troubleshooting

### Database Not Initializing

```tsx
const { isInitialized, initError } = useOffline();

if (initError) {
  console.error('Initialization error:', initError);
  // Show error to user or retry initialization
}
```

### Sync Failures

```tsx
const syncStatus = useSyncStatus();

if (syncStatus.failedChanges > 0) {
  // Retry failed syncs
  await syncManager.syncAll();
}
```

### Clear Corrupted Data

```tsx
import { indexedDBManager } from './lib/offline';

// Clear specific collection
await indexedDBManager.clearObjectStore('students');

// Delete entire database
await indexedDBManager.deleteDatabase();
```

### Debug Sync Issues

```tsx
import { getSyncStats } from './lib/offline';

// Get detailed sync statistics
const stats = await getSyncStats();
console.log('Sync stats:', stats);
// Output: { students: { total: 100, pending: 5, failed: 2, synced: 93 }, ... }
```

## Migration from Firebase-Only

### Step 1: Install Offline Provider

Wrap your app with `OfflineProvider` as shown in setup.

### Step 2: Replace Firebase Hooks

**Before:**
```tsx
import { subscribeToStudents } from './lib/database-operations';

const [students, setStudents] = useState([]);
useEffect(() => {
  const unsubscribe = subscribeToStudents(setStudents);
  return unsubscribe;
}, []);
```

**After:**
```tsx
import { useStudents } from './lib/offline';

const { data: students, loading, error } = useStudents();
```

### Step 3: Update CRUD Operations

**Before:**
```tsx
import { createStudent } from './lib/database-operations';

await createStudent(studentData);
```

**After:**
```tsx
import { createStudent } from './lib/offline';
import { useOfflineMutation } from './lib/offline';

const { mutate } = useOfflineMutation();
await mutate(() => createStudent(studentData));
```

## Best Practices

1. **Always use hooks for data access** - They handle offline/online transitions automatically
2. **Use mutation hooks for writes** - Ensures proper sync metadata
3. **Monitor sync status** - Show users when changes are pending
4. **Handle offline gracefully** - Disable features that require online connectivity
5. **Test offline scenarios** - Use browser DevTools to simulate offline mode
6. **Clear local data on logout** - Prevent data leakage between users
7. **Validate data before sync** - Ensure data integrity before pushing to Firebase

## Security Considerations

- Local data is stored in IndexedDB (browser storage)
- Data is NOT encrypted by default
- Clear local data when user logs out
- Implement proper authentication checks before syncing
- Validate data on both client and server

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support (iOS 10+)
- Opera: ✅ Full support

## Future Enhancements

- [ ] Data encryption for sensitive information
- [ ] Selective sync (sync only specific collections)
- [ ] Compression for large datasets
- [ ] Background sync using Service Workers
- [ ] Offline file storage for documents
- [ ] Conflict resolution UI for manual resolution
- [ ] Sync progress indicators
- [ ] Data export/import functionality

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify IndexedDB is enabled in browser
3. Check network connectivity
4. Review sync status and statistics
5. Clear local data and re-sync if corrupted

---

**Implementation Complete!** 🎉

Your school portal now works seamlessly offline and online, ensuring uninterrupted access even with unreliable internet connectivity.
