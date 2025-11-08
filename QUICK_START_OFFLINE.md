# Quick Start: Offline-First Implementation

## 🚀 Get Started in 3 Steps

### Step 1: Wrap Your App with OfflineProvider

Update your `src/main.tsx` or `src/App.tsx`:

```tsx
import { OfflineProvider } from './contexts/OfflineContext';

function App() {
  return (
    <OfflineProvider autoSync={true} syncInterval={30000}>
      {/* Your existing app components */}
      <YourAppContent />
    </OfflineProvider>
  );
}
```

### Step 2: Add Sync Status to Your UI

Add the sync indicator to your header/navbar:

```tsx
import { SyncStatusIndicator, OfflineBanner } from './components/SyncStatusIndicator';

function Header() {
  return (
    <header>
      <div className="container">
        <h1>Michael School Portal</h1>
        
        {/* Add sync status indicator */}
        <SyncStatusIndicator showDetails={true} />
      </div>
      
      {/* Add offline banner */}
      <OfflineBanner />
    </header>
  );
}
```

### Step 3: Use Offline Hooks in Your Components

Replace Firebase hooks with offline hooks:

**Before (Firebase only):**
```tsx
import { subscribeToStudents } from './lib/database-operations';

function StudentsPage() {
  const [students, setStudents] = useState([]);
  
  useEffect(() => {
    const unsubscribe = subscribeToStudents(setStudents);
    return unsubscribe;
  }, []);

  return (
    <div>
      {students.map(student => (
        <div key={student.id}>{student.firstName}</div>
      ))}
    </div>
  );
}
```

**After (Offline-first):**
```tsx
import { useStudents } from './lib/offline';

function StudentsPage() {
  const { data: students, loading, error, isOnline } = useStudents();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {!isOnline && <div>⚠️ Offline Mode</div>}
      
      {students.map(student => (
        <div key={student.id}>{student.firstName}</div>
      ))}
    </div>
  );
}
```

## ✅ That's It!

Your app now works offline! 

### What You Get:

✅ **Automatic offline storage** - All data is cached in IndexedDB  
✅ **Automatic syncing** - Changes sync every 30 seconds when online  
✅ **Real-time updates** - Firebase changes are reflected immediately  
✅ **Pending changes queue** - Offline changes sync when connection returns  
✅ **Conflict resolution** - Latest changes win by default  

## 📝 Common Use Cases

### Creating Data Offline

```tsx
import { useOfflineMutation, createStudent } from './lib/offline';

function AddStudentForm() {
  const { mutate, loading } = useOfflineMutation();

  const handleSubmit = async (formData) => {
    await mutate(async () => {
      await createStudent({
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
      
      alert('Student added! Will sync when online.');
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Recording Attendance Offline

```tsx
import { useOfflineMutation, recordAttendance } from './lib/offline';

function AttendanceForm({ classId, teacherId, students }) {
  const { mutate } = useOfflineMutation();

  const handleSubmit = async (attendanceData) => {
    await mutate(async () => {
      await recordAttendance({
        classId,
        teacherId,
        date: new Date().toISOString().split('T')[0],
        entries: attendanceData, // [{ studentId, status: 'present' | 'absent' | 'late' }]
      });
      
      alert('Attendance recorded!');
    });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Manual Sync Control

```tsx
import { useOffline } from './contexts/OfflineContext';
import { SyncButton } from './components/SyncStatusIndicator';

function SettingsPage() {
  const { syncNow, clearLocalData, isOnline } = useOffline();

  return (
    <div>
      <h2>Sync Settings</h2>
      
      {/* Manual sync button */}
      <SyncButton onSync={syncNow} />
      
      {/* Clear local data */}
      <button onClick={clearLocalData}>
        Clear Local Data
      </button>
      
      <p>Status: {isOnline ? 'Online' : 'Offline'}</p>
    </div>
  );
}
```

## 🧪 Testing Offline Mode

### In Chrome DevTools:

1. Open DevTools (F12)
2. Go to **Network** tab
3. Change throttling to **Offline**
4. Your app continues to work!

### Check IndexedDB:

1. Open DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** → **MichaelSchoolPortalDB**
4. View all your offline data

## 📊 Available Hooks

```tsx
// Data hooks
useAcademicYears()
useTerms()
useCurrentTerm()
useStudents()
useStudentsByClass(className)
useTeachers()
useSubjects()
useClasses()
useApplications()
useAssessments()
useAssessmentsByStudent(studentId)
useAttendance()
useAttendanceByClass(classId)
useSchoolFees()
useStudentBalances()
useInvoices()
useInvoicesByStudent(studentId)
useStudentDocuments(studentId)
useCanteenCollections()
usePromotionRequests()
useReports()

// Status hooks
useSyncStatus()
useOnlineStatus()
useOffline()
useOfflineReady()

// Mutation hook
useOfflineMutation()
```

## 🔧 Configuration Options

```tsx
<OfflineProvider
  autoSync={true}          // Enable automatic syncing
  syncInterval={30000}     // Sync every 30 seconds (30000ms)
>
```

## 📚 Full Documentation

See [OFFLINE_FIRST_GUIDE.md](./OFFLINE_FIRST_GUIDE.md) for complete documentation.

## 🆘 Troubleshooting

### App not working offline?

1. Check if `OfflineProvider` is wrapping your app
2. Verify IndexedDB is enabled in browser settings
3. Check browser console for errors

### Data not syncing?

1. Check internet connection
2. View sync status with `useSyncStatus()`
3. Manually trigger sync with `syncNow()`

### Clear corrupted data:

```tsx
const { clearLocalData } = useOffline();
await clearLocalData();
```

## 🎉 You're Done!

Your school portal now works seamlessly offline and online!

**Key Benefits:**
- ✅ Works in areas with poor connectivity
- ✅ No data loss during network interruptions
- ✅ Faster app performance (local data access)
- ✅ Automatic background synchronization
- ✅ Real-time updates when online

---

**Need Help?** Check the full guide: [OFFLINE_FIRST_GUIDE.md](./OFFLINE_FIRST_GUIDE.md)
