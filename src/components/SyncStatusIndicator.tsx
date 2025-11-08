/**
 * Sync Status Indicator Component
 * 
 * Displays online/offline status and sync progress in the UI
 */

import React from 'react';
import { useSyncStatus, useOnlineStatus } from '../lib/offline';

interface SyncStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function SyncStatusIndicator({ 
  showDetails = false, 
  className = '' 
}: SyncStatusIndicatorProps) {
  const syncStatus = useSyncStatus();
  const isOnline = useOnlineStatus();

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`sync-status-indicator ${className}`}>
      {/* Compact view */}
      <div className="flex items-center gap-2">
        {/* Online/Offline indicator */}
        <div className={`flex items-center gap-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
          <span className="text-lg">{isOnline ? '🟢' : '🔴'}</span>
          <span className="text-sm font-medium">
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Syncing indicator */}
        {syncStatus.isSyncing && (
          <div className="flex items-center gap-1 text-blue-600">
            <svg 
              className="animate-spin h-4 w-4" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm">Syncing...</span>
          </div>
        )}

        {/* Pending changes badge */}
        {syncStatus.pendingChanges > 0 && !syncStatus.isSyncing && (
          <div className="flex items-center gap-1 text-orange-600">
            <span className="text-sm">📤</span>
            <span className="text-sm font-medium">
              {syncStatus.pendingChanges} pending
            </span>
          </div>
        )}

        {/* Failed changes badge */}
        {syncStatus.failedChanges > 0 && (
          <div className="flex items-center gap-1 text-red-600">
            <span className="text-sm">❌</span>
            <span className="text-sm font-medium">
              {syncStatus.failedChanges} failed
            </span>
          </div>
        )}
      </div>

      {/* Detailed view */}
      {showDetails && (
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <div>
            Last sync: {formatLastSync(syncStatus.lastSyncTime)}
          </div>
          
          {syncStatus.error && (
            <div className="text-red-600">
              Error: {syncStatus.error}
            </div>
          )}
          
          {!isOnline && (
            <div className="text-orange-600">
              ⚠️ Working offline. Changes will sync when connection is restored.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Offline Banner Component
 * 
 * Full-width banner to display when offline
 */
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const syncStatus = useSyncStatus();

  if (isOnline) return null;

  return (
    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg 
            className="h-5 w-5 text-orange-500" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path 
              fillRule="evenodd" 
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" 
              clipRule="evenodd" 
            />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">
            You are currently offline. Changes will be saved locally and synced when connection is restored.
          </p>
          {syncStatus.pendingChanges > 0 && (
            <p className="text-xs mt-1">
              {syncStatus.pendingChanges} change(s) waiting to sync
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Sync Button Component
 * 
 * Button to manually trigger sync
 */
interface SyncButtonProps {
  onSync?: () => void;
  className?: string;
}

export function SyncButton({ onSync, className = '' }: SyncButtonProps) {
  const isOnline = useOnlineStatus();
  const syncStatus = useSyncStatus();
  const [syncing, setSyncing] = React.useState(false);

  const handleSync = async () => {
    if (!isOnline || syncing) return;
    
    setSyncing(true);
    try {
      if (onSync) {
        await onSync();
      }
    } finally {
      setSyncing(false);
    }
  };

  return (
    <button
      onClick={handleSync}
      disabled={!isOnline || syncing || syncStatus.isSyncing}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-md
        ${isOnline && !syncing && !syncStatus.isSyncing
          ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }
        transition-colors duration-200
        ${className}
      `}
    >
      {(syncing || syncStatus.isSyncing) ? (
        <>
          <svg 
            className="animate-spin h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <svg 
            className="h-4 w-4" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
            />
          </svg>
          <span>Sync Now</span>
        </>
      )}
    </button>
  );
}
