# Offline Mode Activation Guide

## 🔴 Current Issue

Your offline infrastructure is built but **not connected** to your app. Your pages are still using direct Firebase operations instead of offline-first wrappers.

**Status**:
- ✅ Offline infrastructure created (IndexedDB, sync, wrappers)
- ✅ OfflineProvider now added to main.tsx
- ❌ Pages still using old Firebase operations
- ❌ Data not being saved to IndexedDB

## 🎯 Solution: Connect Offline Infrastructure

You have **3 options** to activate offline mode:

---

## Option 1: Quick Fix - Use React Hooks (Recommended for New Features)

### For Attendance Pages

**Before** (TeacherClassStudentsPage.tsx):
```typescript
import { recordAttendance } from "@/lib/database-operations";

// In component
const handleSubmit = async () => {
  await recordAttendance(data); // Direct Firebase
};
```

**After**:
```typescript
import { useMarkAttendance } from "@/lib/offline";

// In component
const { mark, loading, result } = useMarkAttendance();

const handleSubmit = async () => {
  await mark(data); // Offline-first with auto-sync!
};
```

### For Grades Pages

**Before** (GradesPage.tsx):
```typescript
import { updateAssessmentRecord } from "@/lib/database-operations";

await updateAssessmentRecord(id, data);
```

**After**:
```typescript
import { useRecordGrade } from "@/lib/offline";

const { record } = useRecordGrade();
await record(data);
```

### For Fee Payments

**Before** (BillingPage.tsx):
```typescript
import { createInvoice } from "@/lib/database-operations";

await createInvoice(data);
```

**After**:
```typescript
import { useRecordFeePayment } from "@/lib/offline";

const { record } = useRecordFeePayment();
await record(data);
```

---

## Option 2: Gradual Migration - Use Offline Wrappers

Replace Firebase operations with offline wrappers that have the **same API**:

### Students

**Before**:
```typescript
import { createStudent, updateStudent, subscribeToStudents } from "@/lib/database-operations";
```

**After**:
```typescript
import { offlineStudents } from "@/lib/offline/offline-wrapper";

// Same API!
await offlineStudents.create(data);
await offlineStudents.update(id, updates);
offlineStudents.subscribe(callback);
```

### Attendance

**Before**:
```typescript
import { recordAttendance } from "@/lib/database-operations";
```

**After**:
```typescript
import { offlineAttendance } from "@/lib/offline/offline-wrapper";

await offlineAttendance.create(data);
```

### Assessments (Grades)

**Before**:
```typescript
import { createAssessmentRecord, updateAssessmentRecord } from "@/lib/database-operations";
```

**After**:
```typescript
import { offlineAssessments } from "@/lib/offline/offline-wrapper";

await offlineAssessments.create(data);
await offlineAssessments.update(id, updates);
```

---

## Option 3: Hybrid Approach (Easiest to Start)

Keep existing code but **intercept at the database-operations level**:

### Step 1: Create a Bridge File

Create `src/lib/database-operations-offline.ts`:

```typescript
/**
 * Offline-first bridge for database operations
 * Drop-in replacement for database-operations.ts
 */

// Re-export types (unchanged)
export * from './database-operations';

// Import offline wrappers
import {
  offlineStudents,
  offlineTeachers,
  offlineClasses,
  offlineAttendance,
  offlineAssessments,
  offlineStudentBalances,
  offlineInvoices,
  offlineApplications,
} from './offline/offline-wrapper';

// Override operations with offline versions
export const createStudent = offlineStudents.create;
export const updateStudent = offlineStudents.update;
export const deleteStudent = offlineStudents.delete;
export const subscribeToStudents = offlineStudents.subscribe;

export const createTeacher = offlineTeachers.create;
export const updateTeacher = offlineTeachers.update;
export const deleteTeacher = offlineTeachers.delete;
export const subscribeToTeachers = offlineTeachers.subscribe;

export const createClass = offlineClasses.create;
export const updateClass = offlineClasses.update;
export const deleteClass = offlineClasses.delete;
export const subscribeToClasses = offlineClasses.subscribe;

export const recordAttendance = offlineAttendance.create;
export const subscribeToAttendance = offlineAttendance.subscribe;

export const createAssessmentRecord = offlineAssessments.create;
export const updateAssessmentRecord = offlineAssessments.update;
export const deleteAssessmentRecord = offlineAssessments.delete;
export const subscribeToAssessments = offlineAssessments.subscribe;

export const subscribeToStudentBalances = offlineStudentBalances.subscribe;

export const createInvoice = offlineInvoices.create;
export const updateInvoice = offlineInvoices.update;
export const subscribeToInvoices = offlineInvoices.subscribe;

export const createApplication = offlineApplications.create;
export const updateApplication = offlineApplications.update;
export const subscribeToApplications = offlineApplications.subscribe;

// Keep read-only operations as-is (they're fast enough)
export { getAllClasses, getCurrentTerm } from './database-operations';
```

### Step 2: Search & Replace in All Files

Replace:
```typescript
from "@/lib/database-operations"
```

With:
```typescript
from "@/lib/database-operations-offline"
```

**Files to update** (11 files):
1. `src/pages/TeacherClassStudentsPage.tsx`
2. `src/pages/StudentsPage.tsx`
3. `src/pages/StudentProfilePage.tsx`
4. `src/pages/SchoolFeesPage.tsx`
5. `src/pages/ReportsPage.tsx`
6. `src/pages/ReportCardPrintPage.tsx`
7. `src/pages/PromotionsPage.tsx`
8. `src/pages/GradesPage.tsx`
9. `src/pages/ClassAssignmentsPage.tsx`
10. `src/pages/BillingPage.tsx`
11. `src/pages/AdmissionsPage.tsx`
12. `src/pages/AcademicTermsPage.tsx`
13. `src/pages/AcademicsPage.tsx`

---

## 🚀 Quick Start: Activate Offline Mode Now

### Step 1: ✅ Already Done
The `OfflineProvider` is now wrapped around your app in `main.tsx`.

### Step 2: Choose Your Approach

**Fastest (5 minutes)**:
1. Create `database-operations-offline.ts` bridge file (copy code above)
2. Search & replace imports in 13 page files
3. Done! Offline mode activated

**Best for New Features**:
- Use hooks like `useMarkAttendance()`, `useRecordGrade()`
- Gradually migrate existing pages

**Most Control**:
- Import offline wrappers directly
- Replace operations one by one

---

## 🧪 Testing After Activation

### Test 1: Verify IndexedDB Initialization

1. Open DevTools → Application → IndexedDB
2. Look for `MichaelSchoolPortalDB`
3. Should see 17 object stores (students, teachers, etc.)

### Test 2: Test Offline Write

1. Go to Students page
2. Open DevTools → Network → Set to Offline
3. Add a new student
4. Check IndexedDB → students store
5. Should see the student with `syncStatus: 'pending'`

### Test 3: Test Auto-Sync

1. Stay on Students page
2. Go back online (Network → Online)
3. Wait 2-3 seconds
4. Check Firebase console
5. Student should appear in Firebase
6. Check IndexedDB → `syncStatus` should be 'synced'

### Test 4: Test Attendance Offline

1. Go offline
2. Mark attendance for a class
3. Should save instantly
4. Go online
5. Should auto-sync within 30 seconds

---

## 📊 What Happens After Activation

### Immediate Changes

**Writes** (create, update, delete):
- ✅ Save to IndexedDB first (instant)
- ✅ Update UI immediately
- ✅ Sync to Firebase in background (if online)
- ✅ Queue for later if offline

**Reads** (get, subscribe):
- ✅ Read from IndexedDB (5-20ms vs 500-2000ms Firebase)
- ✅ Subscribe to local changes
- ✅ Auto-refresh from Firebase periodically

### User Experience

**Online**:
- Same as before but faster
- Data saved locally + cloud
- Instant UI updates

**Offline**:
- Everything works normally
- Data saved locally
- Auto-syncs when online

---

## 🎯 Recommended: Use Option 3 (Hybrid)

**Why**:
- ✅ Minimal code changes (just import path)
- ✅ Activates offline for entire app
- ✅ Can migrate to hooks gradually
- ✅ Keeps existing code structure

**Steps**:
1. Create `database-operations-offline.ts` (1 file)
2. Update imports in 13 page files
3. Test
4. Done!

---

## 🔧 Troubleshooting

### Issue: "useOffline must be used within OfflineProvider"
**Solution**: Already fixed - OfflineProvider added to main.tsx

### Issue: Data not saving to IndexedDB
**Solution**: Pages still using old imports - follow Option 3 above

### Issue: Sync not working
**Solution**: Check browser console for errors, verify Firebase config

### Issue: Duplicate data
**Solution**: Use idempotency helpers:
```typescript
import { upsertAttendanceIdempotent } from '@/lib/offline';
```

---

## 📚 Next Steps

1. **Choose an option** (recommend Option 3)
2. **Implement** (5-30 minutes depending on option)
3. **Test** (use testing checklist above)
4. **Add visual indicators** (optional):
   ```tsx
   import { NetworkStatusBar } from '@/components/NetworkStatusBar';
   <NetworkStatusBar />
   ```

---

## ✅ Success Criteria

After activation, you should see:

- ✅ `MichaelSchoolPortalDB` in IndexedDB
- ✅ Data saving to IndexedDB on create/update
- ✅ `syncStatus` field on records
- ✅ Auto-sync when online
- ✅ Pending count in UI (if using NetworkStatusBar)
- ✅ Offline operations work smoothly
- ✅ No "limited features" message

**The offline mode will work smoothly like online once you connect the infrastructure!** 🚀
