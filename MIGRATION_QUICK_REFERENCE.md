# Migration Quick Reference

## One-Line Changes

### Students

```typescript
// Before
import { createStudent, getAllStudents, updateStudent, deleteStudent, subscribeToStudents } from './lib/database-operations';

// After
import { offlineStudents } from './lib/offline/offline-wrapper';
```

| Before | After |
|--------|-------|
| `await createStudent(data)` | `await offlineStudents.create(data)` |
| `await getAllStudents()` | `await offlineStudents.getAll()` |
| `await updateStudent(id, updates)` | `await offlineStudents.update(id, updates)` |
| `await deleteStudent(id)` | `await offlineStudents.delete(id)` |
| `subscribeToStudents(callback)` | `offlineStudents.subscribe(callback)` |

### Teachers

```typescript
// Before
import { createTeacher, getAllTeachers, updateTeacher } from './lib/database-operations';

// After
import { offlineTeachers } from './lib/offline/offline-wrapper';
```

| Before | After |
|--------|-------|
| `await createTeacher(data)` | `await offlineTeachers.create(data)` |
| `await getAllTeachers()` | `await offlineTeachers.getAll()` |
| `await updateTeacher(id, updates)` | `await offlineTeachers.update(id, updates)` |

### Attendance

```typescript
// Before
import { recordAttendance, subscribeToAttendance } from './lib/database-operations';

// After
import { offlineAttendance } from './lib/offline/offline-wrapper';
```

| Before | After |
|--------|-------|
| `await recordAttendance(data)` | `await offlineAttendance.create(data)` |
| `subscribeToAttendance(callback)` | `offlineAttendance.subscribe(callback)` |

### Assessments/Grades

```typescript
// Before
import { createAssessmentRecord, subscribeToAssessments, updateAssessmentRecord, deleteAssessmentRecord } from './lib/database-operations';

// After
import { offlineAssessments } from './lib/offline/offline-wrapper';
```

| Before | After |
|--------|-------|
| `await createAssessmentRecord(data)` | `await offlineAssessments.create(data)` |
| `subscribeToAssessments(callback)` | `offlineAssessments.subscribe(callback)` |
| `await updateAssessmentRecord(id, updates)` | `await offlineAssessments.update(id, updates)` |
| `await deleteAssessmentRecord(id)` | `await offlineAssessments.delete(id)` |

### School Fees

```typescript
// Before
import { createSchoolFees, getAllSchoolFees, updateSchoolFees, subscribeToSchoolFees } from './lib/database-operations';

// After
import { offlineSchoolFees } from './lib/offline/offline-wrapper';
```

| Before | After |
|--------|-------|
| `await createSchoolFees(data)` | `await offlineSchoolFees.create(data)` |
| `await getAllSchoolFees()` | `await offlineSchoolFees.getAll()` |
| `await updateSchoolFees(id, updates)` | `await offlineSchoolFees.update(id, updates)` |
| `subscribeToSchoolFees(callback)` | `offlineSchoolFees.subscribe(callback)` |

### Student Balances

```typescript
// Before
import { createStudentBalance, updateStudentBalance, subscribeToStudentBalances } from './lib/database-operations';

// After
import { offlineStudentBalances } from './lib/offline/offline-wrapper';
```

| Before | After |
|--------|-------|
| `await createStudentBalance(data)` | `await offlineStudentBalances.create(data)` |
| `await updateStudentBalance(id, amount)` | `await offlineStudentBalances.update(id, { amountPaid: amount })` |
| `subscribeToStudentBalances(callback)` | `offlineStudentBalances.subscribe(callback)` |

## All Available Wrappers

```typescript
import {
  offlineStudents,
  offlineTeachers,
  offlineSubjects,
  offlineClasses,
  offlineApplications,
  offlineAssessments,
  offlineAttendance,
  offlineSchoolFees,
  offlineStudentBalances,
  offlineInvoices,
  offlineStudentDocuments,
  offlineCanteenCollections,
  offlinePromotionRequests,
  offlineAcademicYears,
  offlineTerms,
} from './lib/offline/offline-wrapper';
```

## Common Patterns

### Pattern 1: Subscribe to Data

```typescript
// Before
useEffect(() => {
  const unsubscribe = subscribeToStudents(setStudents);
  return unsubscribe;
}, []);

// After
useEffect(() => {
  const unsubscribe = offlineStudents.subscribe(setStudents);
  return unsubscribe;
}, []);
```

### Pattern 2: Create Record

```typescript
// Before
const handleSubmit = async (formData) => {
  const id = await createStudent(formData);
  alert('Created!');
};

// After
const handleSubmit = async (formData) => {
  const id = await offlineStudents.create(formData);
  alert('Created! Will sync when online.');
};
```

### Pattern 3: Update Record

```typescript
// Before
const handleUpdate = async (id, updates) => {
  await updateStudent(id, updates);
};

// After
const handleUpdate = async (id, updates) => {
  await offlineStudents.update(id, updates);
};
```

### Pattern 4: Delete Record

```typescript
// Before
const handleDelete = async (id) => {
  await deleteStudent(id);
};

// After
const handleDelete = async (id) => {
  await offlineStudents.delete(id);
};
```

## Using React Hooks (Alternative)

```typescript
// Instead of manual subscription
import { useStudents } from './lib/offline';

function StudentsPage() {
  const { data: students, loading, error } = useStudents();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{/* render students */}</div>;
}
```

## Adding Visual Indicators

```typescript
import { NetworkStatusBar } from './components/NetworkStatusBar';
import { ModuleSyncStatus } from './components/ModuleSyncStatus';
import { useNetwork } from './lib/offline';

function MyPage() {
  const networkInfo = useNetwork();
  
  return (
    <div>
      {/* Top status bar */}
      <NetworkStatusBar />
      
      {/* Offline warning */}
      {!networkInfo.isOnline && (
        <div className="alert">⚠️ Working Offline</div>
      )}
      
      {/* Module status */}
      <ModuleSyncStatus module="students" displayName="Students" />
      
      {/* Your content */}
    </div>
  );
}
```

## Search & Replace Guide

Use your IDE's search & replace feature:

### Students
- Find: `import.*createStudent.*from.*database-operations`
- Replace: `import { offlineStudents } from './lib/offline/offline-wrapper'`

- Find: `createStudent\(`
- Replace: `offlineStudents.create(`

- Find: `getAllStudents\(\)`
- Replace: `offlineStudents.getAll()`

- Find: `updateStudent\(`
- Replace: `offlineStudents.update(`

- Find: `deleteStudent\(`
- Replace: `offlineStudents.delete(`

- Find: `subscribeToStudents\(`
- Replace: `offlineStudents.subscribe(`

### Teachers
- Find: `createTeacher\(`
- Replace: `offlineTeachers.create(`

- Find: `getAllTeachers\(\)`
- Replace: `offlineTeachers.getAll()`

- Find: `updateTeacher\(`
- Replace: `offlineTeachers.update(`

- Find: `subscribeToTeachers\(`
- Replace: `offlineTeachers.subscribe(`

### Attendance
- Find: `recordAttendance\(`
- Replace: `offlineAttendance.create(`

- Find: `subscribeToAttendance\(`
- Replace: `offlineAttendance.subscribe(`

### Assessments
- Find: `createAssessmentRecord\(`
- Replace: `offlineAssessments.create(`

- Find: `subscribeToAssessments\(`
- Replace: `offlineAssessments.subscribe(`

- Find: `updateAssessmentRecord\(`
- Replace: `offlineAssessments.update(`

- Find: `deleteAssessmentRecord\(`
- Replace: `offlineAssessments.delete(`

## Testing Checklist

- [ ] Replace imports
- [ ] Test create operation
- [ ] Test read operation
- [ ] Test update operation
- [ ] Test delete operation
- [ ] Test offline mode
- [ ] Test sync after offline
- [ ] Verify Firebase data
- [ ] Check role-based access

## Common Issues

### Issue: "Cannot read property 'create' of undefined"
**Solution**: Check import path
```typescript
// ❌ Wrong
import { offlineStudents } from './lib/offline';

// ✅ Correct
import { offlineStudents } from './lib/offline/offline-wrapper';
```

### Issue: Data not syncing
**Solution**: Check network status
```typescript
import { syncManager } from './lib/offline';
await syncManager.syncAll();
```

### Issue: Duplicate data
**Solution**: Clear and re-sync
```typescript
import { indexedDBManager, syncManager } from './lib/offline';
await indexedDBManager.clearObjectStore('students');
await syncManager.syncAll();
```

## Quick Setup

```bash
# 1. Wrap app with OfflineProvider
# In src/main.tsx or src/App.tsx

import { OfflineProvider } from './contexts/OfflineContext';

<OfflineProvider autoSync={true} syncInterval={30000}>
  <YourApp />
</OfflineProvider>

# 2. Replace imports in your components
# Change from './lib/database-operations'
# To './lib/offline/offline-wrapper'

# 3. Update function calls
# createStudent → offlineStudents.create
# getAllStudents → offlineStudents.getAll
# etc.

# 4. Add visual indicators (optional)
import { NetworkStatusBar } from './components/NetworkStatusBar';
<NetworkStatusBar />

# 5. Test!
```

## That's It!

Your app now works offline with minimal changes. Just change imports and function calls!

**Before**: `await createStudent(data)`  
**After**: `await offlineStudents.create(data)`

✅ Same API  
✅ Works offline  
✅ Auto-syncs  
✅ No UI changes needed  

🎉 **Done!**
