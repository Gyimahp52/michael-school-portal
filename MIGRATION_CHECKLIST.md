# Migration Checklist: Adding Offline-First to Existing App

## 📋 Pre-Migration

- [ ] **Backup your database** - Export Firebase data
- [ ] **Test in development** - Don't deploy to production immediately
- [ ] **Review current data flow** - Understand existing Firebase usage
- [ ] **Check browser compatibility** - Verify IndexedDB support

## 🔧 Step-by-Step Migration

### Phase 1: Setup (No Breaking Changes)

#### 1.1 Add OfflineProvider to App Root

**File to modify**: `src/main.tsx` or `src/App.tsx`

```tsx
// Add import
import { OfflineProvider } from './contexts/OfflineContext';

// Wrap your app
function App() {
  return (
    <OfflineProvider autoSync={true} syncInterval={30000}>
      {/* Existing app content */}
      <YourExistingApp />
    </OfflineProvider>
  );
}
```

**Status**: ✅ Non-breaking - App continues to work normally

#### 1.2 Add Sync Status Indicator

**File to modify**: Your main layout/header component

```tsx
// Add imports
import { SyncStatusIndicator, OfflineBanner } from './components/SyncStatusIndicator';

function Layout() {
  return (
    <div>
      <header>
        <h1>School Portal</h1>
        {/* Add sync indicator */}
        <SyncStatusIndicator showDetails />
      </header>
      
      {/* Add offline banner */}
      <OfflineBanner />
      
      <main>{/* Your content */}</main>
    </div>
  );
}
```

**Status**: ✅ Non-breaking - Just adds UI indicators

**Test**: 
- [ ] App loads normally
- [ ] Sync indicator appears
- [ ] Toggle offline mode in DevTools - banner should appear

---

### Phase 2: Migrate Data Reading (Low Risk)

#### 2.1 Identify Components Using Firebase Subscriptions

Search your codebase for:
- `subscribeToStudents`
- `subscribeToTeachers`
- `subscribeToClasses`
- `subscribeToAttendance`
- etc.

#### 2.2 Replace with Offline Hooks (One Component at a Time)

**Example: Students Page**

**Before:**
```tsx
import { subscribeToStudents } from './lib/database-operations';

function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = subscribeToStudents((data) => {
      setStudents(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {students.map(student => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}
```

**After:**
```tsx
import { useStudents } from './lib/offline';

function StudentsPage() {
  const { data: students, loading, error, isOnline } = useStudents();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {!isOnline && <div className="offline-notice">Working Offline</div>}
      
      {students.map(student => (
        <StudentCard key={student.id} student={student} />
      ))}
    </div>
  );
}
```

**Checklist for each component**:
- [ ] Replace subscription with hook
- [ ] Update loading state handling
- [ ] Add error handling
- [ ] Add offline indicator (optional)
- [ ] Test component works
- [ ] Test component works offline

#### 2.3 Components to Migrate (Priority Order)

**High Priority** (Most Used):
- [ ] Students list/management
- [ ] Teachers list/management
- [ ] Classes list/management
- [ ] Attendance recording
- [ ] Dashboard/home page

**Medium Priority**:
- [ ] Academic years/terms
- [ ] Subjects
- [ ] Applications
- [ ] School fees
- [ ] Student balances

**Low Priority**:
- [ ] Reports
- [ ] Documents
- [ ] Canteen collections
- [ ] Promotions

---

### Phase 3: Migrate Data Writing (Medium Risk)

#### 3.1 Identify Write Operations

Search for:
- `createStudent`
- `updateStudent`
- `deleteStudent`
- `recordAttendance`
- `createAssessmentRecord`
- etc.

#### 3.2 Wrap with Mutation Hook

**Before:**
```tsx
import { createStudent } from './lib/database-operations';

function AddStudentForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await createStudent(formData);
      alert('Student added!');
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**After:**
```tsx
import { useOfflineMutation, createStudent } from './lib/offline';

function AddStudentForm() {
  const { mutate, loading, error } = useOfflineMutation();

  const handleSubmit = async (formData) => {
    const result = await mutate(() => createStudent(formData));
    if (result) {
      alert('Student added! Will sync when online.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save'}
      </button>
      {error && <div>Error: {error.message}</div>}
    </form>
  );
}
```

**Checklist for each write operation**:
- [ ] Wrap with `useOfflineMutation()`
- [ ] Update loading state
- [ ] Add error handling
- [ ] Test online
- [ ] Test offline
- [ ] Verify sync after coming online

---

### Phase 4: Testing (Critical)

#### 4.1 Online Testing

- [ ] All pages load correctly
- [ ] Data displays correctly
- [ ] Create operations work
- [ ] Update operations work
- [ ] Delete operations work
- [ ] Real-time updates work
- [ ] Sync indicator shows "synced"

#### 4.2 Offline Testing

**How to test offline**:
1. Open Chrome DevTools (F12)
2. Go to Network tab
3. Change throttling to "Offline"

**Tests**:
- [ ] App continues to work offline
- [ ] Offline banner appears
- [ ] Can view existing data
- [ ] Can create new records
- [ ] Can update records
- [ ] Can delete records
- [ ] Sync status shows "pending"
- [ ] Pending changes count increases

#### 4.3 Sync Testing

**Test sync after offline work**:
1. Work offline (create/update data)
2. Go back online
3. Wait for auto-sync or click "Sync Now"

**Verify**:
- [ ] Pending changes sync to Firebase
- [ ] Sync status updates
- [ ] Firebase console shows new data
- [ ] Other devices receive updates
- [ ] No data loss
- [ ] No duplicate records

#### 4.4 Edge Cases

- [ ] **Network interruption during sync**
  - Start sync, go offline mid-sync
  - Verify: Failed items marked, retry on reconnect

- [ ] **Conflicting changes**
  - Change same record offline and online
  - Verify: Conflict resolution works (latest wins)

- [ ] **Large dataset**
  - Test with 1000+ students
  - Verify: Performance acceptable

- [ ] **Multiple tabs**
  - Open app in multiple tabs
  - Verify: Changes sync across tabs

- [ ] **Browser refresh**
  - Refresh page while offline
  - Verify: Data persists

---

### Phase 5: Deployment

#### 5.1 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Team trained on new features

#### 5.2 Deployment Strategy

**Option A: Gradual Rollout** (Recommended)
1. Deploy to staging environment
2. Test with small user group
3. Monitor for issues
4. Deploy to production
5. Monitor sync statistics

**Option B: Feature Flag**
```tsx
const ENABLE_OFFLINE = process.env.REACT_APP_ENABLE_OFFLINE === 'true';

function App() {
  return (
    <>
      {ENABLE_OFFLINE ? (
        <OfflineProvider>
          <AppContent />
        </OfflineProvider>
      ) : (
        <AppContent />
      )}
    </>
  );
}
```

#### 5.3 Post-Deployment Monitoring

Monitor for:
- [ ] Sync errors in console
- [ ] Failed sync counts
- [ ] User reports of data issues
- [ ] Performance degradation
- [ ] IndexedDB storage usage

---

## 🔍 Verification Commands

### Check IndexedDB Data

```javascript
// In browser console
// List all databases
indexedDB.databases()

// Open database
const request = indexedDB.open('MichaelSchoolPortalDB');
request.onsuccess = (e) => {
  const db = e.target.result;
  console.log('Object stores:', db.objectStoreNames);
};
```

### Check Sync Statistics

```tsx
import { getSyncStats } from './lib/offline';

// In component or console
const stats = await getSyncStats();
console.log('Sync stats:', stats);
```

### Manual Sync

```tsx
import { syncManager } from './lib/offline';

// Force sync all
await syncManager.syncAll();

// Sync specific collection
await syncManager.syncCollection('students');
```

---

## 🚨 Rollback Plan

If issues occur:

### Quick Rollback
1. Remove `<OfflineProvider>` wrapper
2. Revert hook changes to Firebase subscriptions
3. Deploy previous version

### Data Recovery
```tsx
// Clear local data if corrupted
import { indexedDBManager } from './lib/offline';
await indexedDBManager.deleteDatabase();

// Data is still in Firebase - no data loss
```

---

## 📊 Success Metrics

After migration, track:
- [ ] **Sync success rate** - Should be >95%
- [ ] **Offline usage** - How often users work offline
- [ ] **Pending changes** - Average queue size
- [ ] **Failed syncs** - Should be <5%
- [ ] **User feedback** - Satisfaction with offline mode
- [ ] **Performance** - Page load times
- [ ] **Storage usage** - IndexedDB size

---

## 🎯 Migration Timeline

**Recommended timeline**:

- **Week 1**: Phase 1 (Setup) - 1-2 days
- **Week 2**: Phase 2 (Read operations) - 3-5 days
- **Week 3**: Phase 3 (Write operations) - 3-5 days
- **Week 4**: Phase 4 (Testing) - 5 days
- **Week 5**: Phase 5 (Deployment) - 2-3 days

**Total**: 4-5 weeks for complete migration

---

## 💡 Tips

1. **Migrate gradually** - One component at a time
2. **Test thoroughly** - Especially offline scenarios
3. **Monitor closely** - Watch for sync issues
4. **Communicate** - Inform users about new offline capability
5. **Document** - Keep track of migrated components
6. **Backup** - Always have rollback plan ready

---

## ✅ Final Checklist

Before considering migration complete:

- [ ] All components migrated
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Team trained
- [ ] Users informed
- [ ] Monitoring in place
- [ ] Rollback plan ready
- [ ] Performance acceptable
- [ ] No critical bugs
- [ ] Sync working reliably

---

## 🎉 Post-Migration

After successful migration:

1. **Monitor** sync statistics daily for first week
2. **Gather feedback** from users
3. **Optimize** based on usage patterns
4. **Document** any issues and solutions
5. **Celebrate** - You've made the app more reliable! 🎊

---

**Need Help?** Refer to:
- [QUICK_START_OFFLINE.md](./QUICK_START_OFFLINE.md) - Quick reference
- [OFFLINE_FIRST_GUIDE.md](./OFFLINE_FIRST_GUIDE.md) - Complete guide
- [OFFLINE_IMPLEMENTATION_SUMMARY.md](./OFFLINE_IMPLEMENTATION_SUMMARY.md) - Technical details
