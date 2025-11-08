# Sync Service Implementation Guide

## Overview

The **SyncService** provides schema-aware, bidirectional synchronization between IndexedDB and Firebase with robust data integrity, conflict resolution, and error handling.

## Key Features

✅ **Schema-Aware Operations** - Validates data structure before syncing  
✅ **Data Transformation** - Handles Firebase-specific types (Timestamps, References)  
✅ **Conflict Resolution** - Multiple strategies with special handling for critical data  
✅ **Priority-Based Syncing** - Critical data (attendance, grades) syncs first  
✅ **Error Handling** - Exponential backoff retry with detailed error logging  
✅ **Batch Operations** - Efficient processing of large datasets  
✅ **Queue Management** - FIFO ordering with dependency handling  

## Architecture

### Components

1. **Data Transformer** (`data-transformer.ts`)
   - Bidirectional data transformation
   - Firebase type handling
   - Schema validation
   - Null/undefined preservation

2. **Sync Service** (`sync-service.ts`)
   - Main synchronization logic
   - Conflict resolution
   - Priority management
   - Error handling and retry

3. **Integration** (`sync-manager.ts`)
   - Integrates SyncService with existing sync manager
   - Maintains backward compatibility

## Data Transformation

### Firebase → IndexedDB

```typescript
// Firebase Timestamp → Milliseconds
{
  createdAt: { seconds: 1699488000, nanoseconds: 0 }
}
// Becomes
{
  createdAt: 1699488000000
}

// Firebase Reference → String ID
{
  classRef: { _path: ['classes', 'class123'] }
}
// Becomes
{
  classRef: 'class123'
}

// Nested Objects → Preserved
{
  schedule: {
    monday: '8:00-9:00',
    tuesday: '8:00-9:00'
  }
}
// Remains unchanged
```

### IndexedDB → Firebase

```typescript
// Remove sync metadata
{
  id: 'student123',
  firstName: 'John',
  syncStatus: 'pending',      // REMOVED
  localUpdatedAt: 1699488000,  // REMOVED
  lastSyncedAt: 1699487000     // REMOVED
}
// Becomes
{
  id: 'student123',
  firstName: 'John'
}

// Convert timestamps to ISO strings
{
  createdAt: 1699488000000
}
// Becomes
{
  createdAt: '2023-11-09T00:00:00.000Z'
}
```

## Priority-Based Syncing

### Priority Levels

**High Priority** (Syncs first):
- `attendance` - Daily attendance records
- `assessments` - Grades and test scores
- `studentBalances` - Fee payment tracking
- `invoices` - Billing records

**Medium Priority**:
- `students` - Student profiles
- `teachers` - Teacher profiles
- `classes` - Class definitions
- `applications` - Admission applications
- `schoolFees` - Fee structures
- `canteenCollections` - Canteen fees
- `promotionRequests` - Promotion decisions

**Low Priority**:
- `academicYears` - Academic year data
- `terms` - Term definitions
- `subjects` - Subject catalog
- `studentDocuments` - Document references
- `reports` - Report configurations
- `reportStats` - Report analytics

### Sync Order

Within each priority level, items sync in FIFO order (First In, First Out) based on `localUpdatedAt` timestamp.

## Schema Validation

### Validation Rules

```typescript
// Example: Student Schema
{
  id: { type: 'string', required: true },
  firstName: { type: 'string', required: true },
  lastName: { type: 'string', required: true },
  email: { type: 'string', required: true },
  className: { type: 'string', required: true },
  status: { type: 'string', required: true },
  createdAt: { type: 'timestamp', required: true },
  updatedAt: { type: 'timestamp', required: true }
}
```

### Validation Process

1. Check all required fields are present
2. Validate field types match schema
3. Validate nested objects and arrays
4. Check timestamp formats
5. Reject malformed data with clear error messages

### Example Validation Errors

```typescript
// Missing required field
"Required field missing: students.firstName"

// Invalid type
"Invalid type at students.age: expected number, got string"

// Invalid array item
"Invalid array item type at attendance.entries[0]: expected object, got string"
```

## Conflict Resolution

### Detection

Conflicts are detected when:
1. Local item has `syncStatus: 'pending'`
2. Remote item has been modified (different `updatedAt`)
3. Timestamps differ by more than 1 second

### Resolution Strategies

#### 1. Last-Write-Wins (Default)

```typescript
// Compare timestamps
if (localTimestamp > remoteTimestamp) {
  use localData;
} else {
  use remoteData;
}
```

#### 2. Local-Wins

```typescript
// Always prefer local changes
use localData;
```

#### 3. Remote-Wins

```typescript
// Always prefer Firebase data
use remoteData;
```

#### 4. Manual-Review

```typescript
// Flag for admin review
store in 'conflicts' collection;
notify admin;
```

### Special Handling for Critical Data

#### Attendance Records

```typescript
// Merge entries, prefer local for same student
mergedEntries = new Map();

// Add remote entries
remoteData.entries.forEach(entry => {
  mergedEntries.set(entry.studentId, entry);
});

// Override with local entries (local wins)
localData.entries.forEach(entry => {
  mergedEntries.set(entry.studentId, entry);
});

result = {
  ...remoteData,
  entries: Array.from(mergedEntries.values())
};
```

#### Assessments & Balances

```typescript
// Use latest timestamp
result = localTimestamp > remoteTimestamp ? localData : remoteData;
```

### Conflict Logging

All conflicts are logged with:
- Collection name
- Item ID
- Local data snapshot
- Remote data snapshot
- Timestamps
- Resolution applied
- Timestamp of conflict

## Error Handling

### Retry Logic

```typescript
// Exponential backoff
retryDelay = baseDelay * 2^(retryCount - 1)

// Example:
// Retry 1: 1000ms (1 second)
// Retry 2: 2000ms (2 seconds)
// Retry 3: 4000ms (4 seconds)
```

### Maximum Retries

Default: 3 retries

After max retries:
- Item marked as `syncStatus: 'failed'`
- Error details stored
- Item queued for manual review

### Error Types

1. **Schema Validation Errors**
   ```
   "Schema validation failed: Required field missing: studentId"
   ```

2. **Firebase Permission Errors**
   ```
   "Firebase permission denied: Insufficient privileges"
   ```

3. **Network Errors**
   ```
   "Network error: Failed to fetch"
   ```

4. **Conflict Resolution Errors**
   ```
   "Conflict resolution failed: Manual review required"
   ```

### Error Storage

```typescript
{
  collectionName: 'students',
  itemId: 'student123',
  operation: 'update',
  error: 'Schema validation failed',
  timestamp: 1699488000000,
  retryCount: 3,
  lastRetryAt: 1699488120000
}
```

## Usage Examples

### Basic Sync

```typescript
import { syncService } from './lib/offline/sync-service';

// Bidirectional sync
const result = await syncService.bidirectionalSync();

console.log(`Synced: ${result.push.synced + result.pull.synced}`);
console.log(`Failed: ${result.push.failed + result.pull.failed}`);
console.log(`Conflicts: ${result.push.conflicts + result.pull.conflicts}`);
```

### Push Only (Local → Firebase)

```typescript
const result = await syncService.syncToFirebase();

if (result.success) {
  console.log(`Pushed ${result.synced} items to Firebase`);
} else {
  console.error('Sync failed:', result.errors);
}
```

### Pull Only (Firebase → Local)

```typescript
// Sync all collections
const result = await syncService.syncFromFirebase();

// Sync specific collections
const result = await syncService.syncFromFirebase([
  'students',
  'attendance',
  'assessments'
]);
```

### Configure Sync Behavior

```typescript
import { SyncService } from './lib/offline/sync-service';

const customSync = new SyncService({
  conflictStrategy: 'local-wins',  // Prefer local changes
  maxRetries: 5,                   // More retry attempts
  retryDelay: 2000,                // 2 second initial delay
  batchSize: 100,                  // Larger batches
  validateSchema: true,            // Enable validation
  logConflicts: true               // Log all conflicts
});

await customSync.bidirectionalSync();
```

### Get Sync Statistics

```typescript
const stats = await syncService.getSyncStatistics();

console.log('Overall:', stats);
// {
//   pendingCount: 15,
//   failedCount: 2,
//   syncedCount: 483,
//   conflictCount: 1,
//   byCollection: {
//     students: { pending: 5, failed: 0, synced: 150 },
//     attendance: { pending: 10, failed: 2, synced: 200 },
//     ...
//   }
// }
```

### View Conflict Log

```typescript
const conflicts = syncService.getConflictLog();

conflicts.forEach(conflict => {
  console.log(`Conflict in ${conflict.collectionName}/${conflict.itemId}`);
  console.log('Local:', conflict.localData);
  console.log('Remote:', conflict.remoteData);
  console.log('Resolution:', conflict.resolution);
});
```

### View Error Log

```typescript
const errors = syncService.getErrorLog();

errors.forEach(error => {
  console.error(`Error in ${error.collectionName}/${error.itemId}`);
  console.error('Operation:', error.operation);
  console.error('Error:', error.error);
  console.error('Time:', new Date(error.timestamp));
});
```

### Clear Logs

```typescript
// Clear conflict and error logs
syncService.clearLogs();
```

## Integration with Existing Code

### Update Sync Manager

The SyncService is already integrated into `sync-manager.ts`:

```typescript
// In sync-manager.ts
async syncAll(): Promise<void> {
  // Uses syncService.bidirectionalSync() internally
  const result = await syncService.bidirectionalSync();
  // Updates status and emits events
}
```

### No Changes Required

Your existing code continues to work:

```typescript
// Existing code still works
import { syncManager } from './lib/offline';

await syncManager.syncAll();
```

## Advanced Features

### Custom Conflict Resolution

```typescript
class CustomSyncService extends SyncService {
  protected async resolveConflict(
    collectionName: string,
    itemId: string,
    remoteData: any,
    localData?: any
  ): Promise<boolean> {
    // Custom logic for your school's needs
    if (collectionName === 'attendance') {
      // Always prefer teacher's local attendance
      return this.useLocalData(localData);
    }
    
    // Fall back to default
    return super.resolveConflict(collectionName, itemId, remoteData, localData);
  }
}
```

### Priority Customization

```typescript
// Modify priorities in sync-service.ts
const COLLECTION_PRIORITIES: Record<string, SyncPriority> = {
  attendance: 'high',
  myCustomCollection: 'high',  // Add custom priority
  // ...
};
```

### Schema Extension

```typescript
// Add custom schema in data-transformer.ts
export const CUSTOM_SCHEMA: Schema = {
  id: { type: 'string', required: true },
  customField: { type: 'string', required: true },
  // ...
};

// Register schema
export function getSchemaForCollection(collectionName: string): Schema | null {
  const schemas: Record<string, Schema> = {
    students: STUDENT_SCHEMA,
    myCustomCollection: CUSTOM_SCHEMA,  // Add here
    // ...
  };
  return schemas[collectionName] || null;
}
```

## Monitoring & Debugging

### Enable Debug Logging

```typescript
// In browser console
localStorage.setItem('DEBUG_SYNC', 'true');

// Sync service will log detailed information
await syncService.bidirectionalSync();
```

### Monitor Sync Progress

```typescript
import { syncManager } from './lib/offline';

syncManager.on('sync-start', () => {
  console.log('Sync started');
});

syncManager.on('sync-complete', (event) => {
  console.log('Sync completed:', event.data);
});

syncManager.on('sync-error', (event) => {
  console.error('Sync error:', event.data);
});
```

### Inspect IndexedDB

```javascript
// In browser console
const db = await indexedDB.open('MichaelSchoolPortalDB');

// View pending items
const tx = db.transaction('students', 'readonly');
const store = tx.objectStore('students');
const index = store.index('syncStatus');
const pending = await index.getAll('pending');
console.log('Pending students:', pending);
```

## Best Practices

1. **Validate Before Sync**
   - Always enable schema validation in production
   - Add custom validation for business rules

2. **Handle Conflicts Gracefully**
   - Use appropriate strategy for each data type
   - Log conflicts for audit trail
   - Notify users of critical conflicts

3. **Monitor Sync Health**
   - Check sync statistics regularly
   - Alert on high failure rates
   - Review conflict logs

4. **Optimize Batch Size**
   - Larger batches for good connections
   - Smaller batches for poor connections
   - Default 50 items works well

5. **Prioritize Critical Data**
   - Ensure attendance syncs first
   - Grades and fees are high priority
   - Reference data can sync later

6. **Test Offline Scenarios**
   - Create data offline
   - Modify data offline
   - Delete data offline
   - Verify sync when online

7. **Handle Permissions**
   - Validate user permissions before sync
   - Handle permission errors gracefully
   - Don't retry permission errors

## Troubleshooting

### Sync Not Working

1. Check online status
2. Verify Firebase permissions
3. Check error log
4. Inspect pending items

### High Failure Rate

1. Check schema validation errors
2. Verify Firebase rules
3. Check network connectivity
4. Review error messages

### Conflicts Not Resolving

1. Check conflict strategy
2. Review conflict log
3. Verify timestamp accuracy
4. Check for manual review flags

### Performance Issues

1. Reduce batch size
2. Sync specific collections only
3. Disable schema validation temporarily
4. Check IndexedDB size

## Summary

The SyncService provides:
- ✅ **Data Integrity** - Schema validation and type checking
- ✅ **Reliability** - Retry logic and error handling
- ✅ **Flexibility** - Configurable strategies and priorities
- ✅ **Transparency** - Detailed logging and monitoring
- ✅ **Performance** - Batch operations and efficient queuing

Your school portal now has enterprise-grade synchronization! 🎉
