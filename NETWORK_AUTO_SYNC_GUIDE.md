# Network Detection & Auto-Sync Guide

## Overview

Comprehensive network monitoring and automatic synchronization system with visual indicators for online/offline status, sync progress, and per-module status tracking.

## Features Implemented

✅ **Network Detection**
- Real-time online/offline monitoring
- Connection quality detection (good/slow/unstable)
- Connection type detection (WiFi/Cellular/Ethernet)
- Network metrics (latency, bandwidth)

✅ **Auto-Sync**
- Automatic sync when connection restored
- Configurable sync intervals
- Smart retry with exponential backoff
- Priority-based syncing

✅ **Visual Indicators**
- Online/Offline status badge
- Sync progress indicator
- Pending changes count by entity
- Sync errors with details
- Last successful sync time
- Per-module sync status

✅ **Manual Controls**
- Manual sync button
- Per-collection sync
- Sync statistics dashboard
- Error and conflict logs

## Components

### 1. Network Monitor (`network-monitor.ts`)

**Core Functionality:**
- Monitors `navigator.onLine` status
- Listens to online/offline events
- Detects connection quality
- Triggers auto-sync on reconnection
- Provides network metrics

**Usage:**
```typescript
import { networkMonitor } from './lib/offline';

// Get current network info
const info = networkMonitor.getInfo();
console.log('Online:', info.isOnline);
console.log('Quality:', info.status);
console.log('Type:', info.connectionType);

// Listen for network changes
const unsubscribe = networkMonitor.on((event) => {
  console.log('Network event:', event.type);
  console.log('Network info:', event.info);
});

// Check if good for syncing
if (networkMonitor.isGoodForSync()) {
  // Trigger sync
}
```

### 2. Network Status Bar (`NetworkStatusBar.tsx`)

**Comprehensive Status Display:**
- Online/offline indicator
- Network quality badge
- Sync status (syncing/pending/failed)
- Pending changes count
- Failed items count
- Last sync time
- Manual sync button
- Expandable details panel

**Usage:**
```tsx
import { NetworkStatusBar } from './components/NetworkStatusBar';

function App() {
  return (
    <div>
      <NetworkStatusBar />
      {/* Your app content */}
    </div>
  );
}
```

**Features:**
- Click to expand/collapse details
- Shows network quality (Good/Slow/Unstable)
- Displays connection type (WiFi/Cellular/Ethernet)
- Real-time sync status updates
- Manual sync button (disabled when offline)
- Pending and failed counts with badges

### 3. Module Sync Status (`ModuleSyncStatus.tsx`)

**Per-Module Status Tracking:**
- Individual module sync status
- Synced/pending/failed counts
- Visual status indicators
- Critical modules highlighting

**Components:**

#### ModuleSyncStatus
```tsx
<ModuleSyncStatus
  module="attendance"
  displayName="Attendance"
  icon="📝"
  showDetails={true}
/>
```

#### ModuleSyncStatusGrid
```tsx
<ModuleSyncStatusGrid />
```
Shows all modules in a grid layout

#### CriticalModulesStatus
```tsx
<CriticalModulesStatus />
```
Shows only critical modules (attendance, grades, fees)

#### PendingItemsByEntity
```tsx
<PendingItemsByEntity />
```
Detailed breakdown of pending items by entity

### 4. Network Hooks (`use-network.ts`)

**React Hooks for Network Monitoring:**

```typescript
// Get full network info
const networkInfo = useNetwork();

// Get network status only
const status = useNetworkStatus(); // 'online' | 'offline' | 'slow' | 'unstable'

// Check if good for syncing
const isGoodForSync = useIsGoodForSync();

// Get connection type
const connectionType = useConnectionType(); // 'wifi' | 'cellular' | 'ethernet' | 'unknown'

// Get network quality metrics
const { effectiveType, downlink, rtt, saveData } = useNetworkQuality();
```

## Visual Indicators

### Status Colors

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Synced | Green | ✅ | All data synced |
| Pending | Orange | ⏳ | Changes waiting to sync |
| Syncing | Blue | 🔄 | Sync in progress |
| Failed | Red | ❌ | Sync errors |
| Offline | Red | 🔴 | No connection |

### Network Quality

| Quality | Description | Indicator |
|---------|-------------|-----------|
| Good | Fast, stable connection | 📶 Good |
| Slow | Slow connection (2G, high latency) | 📶 Slow |
| Unstable | Unstable connection | 📶 Unstable |
| Offline | No connection | 🔴 No Connection |

## Auto-Sync Behavior

### Trigger Conditions

Auto-sync is triggered when:
1. **Connection Restored**: Device comes back online
2. **Periodic Interval**: Every 30 seconds (configurable)
3. **User Action**: Manual sync button clicked
4. **App Startup**: When app initializes (if online)

### Sync Process

```
1. Detect Online Event
   ↓
2. Wait 1 second (connection stabilization)
   ↓
3. Verify still online
   ↓
4. Trigger Sync Manager
   ↓
5. Push pending changes to Firebase
   ↓
6. Pull latest data from Firebase
   ↓
7. Update UI with results
```

### Smart Retry

- **Exponential Backoff**: 1s, 2s, 4s delays
- **Max Retries**: 3 attempts (configurable)
- **Connection Check**: Verifies online before retry
- **Quality Check**: Delays sync if connection is slow/unstable

## Usage Examples

### Basic Setup

```tsx
import { NetworkStatusBar } from './components/NetworkStatusBar';
import { ModuleSyncStatusGrid } from './components/ModuleSyncStatus';

function Layout() {
  return (
    <div>
      {/* Top status bar */}
      <NetworkStatusBar />
      
      <main>
        {/* Your content */}
      </main>
      
      {/* Sidebar with module status */}
      <aside>
        <ModuleSyncStatusGrid />
      </aside>
    </div>
  );
}
```

### Attendance Page Example

```tsx
import { NetworkStatusBadge } from './components/NetworkStatusBar';
import { ModuleSyncStatus } from './components/ModuleSyncStatus';
import { useNetwork } from './lib/offline';

function AttendancePage() {
  const networkInfo = useNetwork();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1>Mark Attendance</h1>
        <NetworkStatusBadge />
      </div>

      {/* Critical: Show offline warning for attendance */}
      {!networkInfo.isOnline && (
        <div className="bg-orange-100 border-l-4 border-orange-500 p-4 mb-4">
          <div className="flex items-center">
            <span className="text-2xl mr-2">⚠️</span>
            <div>
              <p className="font-medium">Working Offline</p>
              <p className="text-sm">
                Attendance will be saved locally and synced when connection is restored.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Show attendance sync status */}
      <ModuleSyncStatus
        module="attendance"
        displayName="Attendance Records"
        icon="📝"
        showDetails={true}
      />

      {/* Attendance form */}
      <AttendanceForm />
    </div>
  );
}
```

### Dashboard with Sync Overview

```tsx
import { SyncDashboard } from './components/SyncDashboard';
import { CriticalModulesStatus } from './components/ModuleSyncStatus';
import { useNetwork } from './lib/offline';

function AdminDashboard() {
  const networkInfo = useNetwork();

  return (
    <div className="p-6">
      <h1>Admin Dashboard</h1>

      {/* Network status */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <span className={networkInfo.isOnline ? 'text-green-600' : 'text-red-600'}>
            {networkInfo.isOnline ? '🟢 Online' : '🔴 Offline'}
          </span>
          {networkInfo.connectionType !== 'unknown' && (
            <span className="text-gray-600">
              ({networkInfo.connectionType})
            </span>
          )}
        </div>
      </div>

      {/* Critical modules status */}
      <CriticalModulesStatus />

      {/* Full sync dashboard */}
      <SyncDashboard />
    </div>
  );
}
```

### Mobile-Friendly Status

```tsx
import { NetworkStatusBadge } from './components/NetworkStatusBar';
import { ModuleSyncBadge } from './components/ModuleSyncStatus';

function MobileHeader() {
  return (
    <header className="flex items-center justify-between p-4">
      <h1>School Portal</h1>
      
      <div className="flex items-center gap-4">
        {/* Compact network status */}
        <NetworkStatusBadge />
        
        {/* Module badges */}
        <div className="flex items-center gap-1">
          <ModuleSyncBadge module="attendance" />
          <ModuleSyncBadge module="assessments" />
          <ModuleSyncBadge module="studentBalances" />
        </div>
      </div>
    </header>
  );
}
```

## Configuration

### Network Monitor Configuration

```typescript
// In OfflineContext.tsx or app initialization
import { networkMonitor } from './lib/offline';

// Network monitor starts automatically
// No configuration needed for basic usage

// To customize auto-sync behavior
import { syncManager } from './lib/offline';

syncManager.configure({
  autoSync: true,
  syncInterval: 30000, // 30 seconds
  conflictResolution: 'latest',
});
```

### Sync Manager Configuration

```typescript
import { syncManager } from './lib/offline';

syncManager.configure({
  autoSync: true,           // Enable auto-sync
  syncInterval: 30000,      // Sync every 30 seconds
  conflictResolution: 'latest', // Conflict strategy
});

// Start auto-sync
syncManager.startAutoSync();

// Stop auto-sync
syncManager.stopAutoSync();
```

## Best Practices

### 1. Always Show Network Status

```tsx
// Good: Always visible
<NetworkStatusBar />

// Better: Persistent across all pages
function Layout({ children }) {
  return (
    <>
      <NetworkStatusBar />
      {children}
    </>
  );
}
```

### 2. Warn Users for Critical Operations

```tsx
function AttendanceForm() {
  const networkInfo = useNetwork();

  return (
    <form onSubmit={handleSubmit}>
      {!networkInfo.isOnline && (
        <div className="alert alert-warning">
          ⚠️ Offline: Changes will sync when connection is restored
        </div>
      )}
      {/* Form fields */}
    </form>
  );
}
```

### 3. Show Per-Module Status

```tsx
function GradesPage() {
  return (
    <div>
      <h1>Grades</h1>
      
      {/* Show grades sync status */}
      <ModuleSyncStatus
        module="assessments"
        displayName="Grade Entries"
        icon="📊"
        showDetails={true}
      />
      
      {/* Grades content */}
    </div>
  );
}
```

### 4. Provide Manual Sync Option

```tsx
import { useManualSync } from './lib/offline';

function SyncControls() {
  const { sync, syncing } = useManualSync();
  const networkInfo = useNetwork();

  return (
    <button
      onClick={sync}
      disabled={!networkInfo.isOnline || syncing}
    >
      {syncing ? 'Syncing...' : 'Sync Now'}
    </button>
  );
}
```

### 5. Monitor Critical Modules

```tsx
function TeacherDashboard() {
  return (
    <div>
      <h1>Teacher Dashboard</h1>
      
      {/* Show critical modules only */}
      <CriticalModulesStatus />
    </div>
  );
}
```

## Troubleshooting

### Network Not Detecting

**Issue**: Network status not updating

**Solution**:
```typescript
// Check if network monitor is initialized
import { networkMonitor } from './lib/offline';

console.log('Network info:', networkMonitor.getInfo());

// Verify event listeners
const unsubscribe = networkMonitor.on((event) => {
  console.log('Network event:', event);
});
```

### Auto-Sync Not Triggering

**Issue**: Sync not happening when coming online

**Solution**:
```typescript
// Verify sync manager is configured
import { syncManager } from './lib/offline';

console.log('Sync config:', syncManager.getConfig());
console.log('Sync status:', syncManager.getStatus());

// Manually trigger sync
await syncManager.syncAll();
```

### Pending Count Not Updating

**Issue**: Pending items count not reflecting changes

**Solution**:
```typescript
// Check sync statistics
import { syncService } from './lib/offline';

const stats = await syncService.getSyncStatistics();
console.log('Sync stats:', stats);
```

## Performance Considerations

### 1. Debounce Network Events

Network events are already debounced internally, but for custom handlers:

```typescript
import { debounce } from 'lodash';

const handleNetworkChange = debounce((event) => {
  // Handle event
}, 1000);

networkMonitor.on(handleNetworkChange);
```

### 2. Lazy Load Sync Dashboard

```tsx
import { lazy, Suspense } from 'react';

const SyncDashboard = lazy(() => import('./components/SyncDashboard'));

function AdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SyncDashboard />
    </Suspense>
  );
}
```

### 3. Optimize Sync Intervals

```typescript
// For good connections
syncManager.configure({ syncInterval: 15000 }); // 15 seconds

// For slow connections
syncManager.configure({ syncInterval: 60000 }); // 60 seconds

// Disable auto-sync and sync manually
syncManager.configure({ autoSync: false });
```

## Summary

The network detection and auto-sync system provides:

✅ **Real-time Monitoring** - Instant network status updates  
✅ **Auto-Sync** - Automatic sync when connection restored  
✅ **Visual Feedback** - Clear indicators for all states  
✅ **Per-Module Status** - Track sync status by entity  
✅ **Manual Controls** - User-initiated sync options  
✅ **Smart Retry** - Exponential backoff for failed syncs  
✅ **Quality Detection** - Adapts to connection quality  
✅ **Mobile-Friendly** - Compact badges for small screens  

**Your school portal now has enterprise-grade network monitoring and auto-sync! 🎉**
