/**
 * Network Status Bar
 * 
 * Comprehensive network and sync status display with detailed information
 */

import React, { useState, useEffect } from 'react';
import { networkMonitor, type NetworkInfo } from '../lib/offline/network-monitor';
import { useSyncStatus, usePendingItemsCount, useFailedItemsCount } from '../lib/offline';
import { useOffline } from '../contexts/OfflineContext';

export function NetworkStatusBar() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(networkMonitor.getInfo());
  const [showDetails, setShowDetails] = useState(false);
  const syncStatus = useSyncStatus();
  const { count: pendingCount } = usePendingItemsCount();
  const { count: failedCount } = useFailedItemsCount();
  const { syncNow } = useOffline();

  useEffect(() => {
    const unsubscribe = networkMonitor.on((event) => {
      setNetworkInfo(event.info);
    });

    return unsubscribe;
  }, []);

  const getStatusColor = () => {
    if (!networkInfo.isOnline) return 'bg-red-500';
    if (syncStatus.isSyncing) return 'bg-blue-500';
    if (pendingCount > 0) return 'bg-orange-500';
    if (failedCount > 0) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!networkInfo.isOnline) return 'Offline';
    if (syncStatus.isSyncing) return 'Syncing...';
    if (pendingCount > 0) return `${pendingCount} Pending`;
    if (failedCount > 0) return `${failedCount} Failed`;
    return 'Synced';
  };

  const getStatusIcon = () => {
    if (!networkInfo.isOnline) return '🔴';
    if (syncStatus.isSyncing) return '🔄';
    if (pendingCount > 0) return '⏳';
    if (failedCount > 0) return '❌';
    return '✅';
  };

  const getNetworkQualityText = () => {
    switch (networkInfo.status) {
      case 'online': return 'Good';
      case 'slow': return 'Slow';
      case 'unstable': return 'Unstable';
      case 'offline': return 'No Connection';
      default: return 'Unknown';
    }
  };

  const formatLastSync = () => {
    if (!syncStatus.lastSyncTime) return 'Never';
    const date = new Date(syncStatus.lastSyncTime);
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
    <div className="bg-white border-b border-gray-200 shadow-sm">
      {/* Main Status Bar */}
      <div className="px-4 py-2 flex items-center justify-between">
        {/* Left: Network & Sync Status */}
        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 hover:bg-gray-50 px-3 py-1.5 rounded-md transition-colors"
          >
            <div className={`w-3 h-3 rounded-full ${getStatusColor()} ${syncStatus.isSyncing ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium text-gray-700">
              {getStatusIcon()} {getStatusText()}
            </span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${showDetails ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Network Quality */}
          {networkInfo.isOnline && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>📶</span>
              <span>{getNetworkQualityText()}</span>
              {networkInfo.connectionType !== 'unknown' && (
                <span className="capitalize">({networkInfo.connectionType})</span>
              )}
            </div>
          )}

          {/* Last Sync Time */}
          {syncStatus.lastSyncTime && (
            <div className="text-xs text-gray-500">
              Last sync: {formatLastSync()}
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Pending Count */}
          {pendingCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-700 rounded-md text-xs font-medium">
              <span>⏳</span>
              <span>{pendingCount} pending</span>
            </div>
          )}

          {/* Failed Count */}
          {failedCount > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded-md text-xs font-medium">
              <span>❌</span>
              <span>{failedCount} failed</span>
            </div>
          )}

          {/* Manual Sync Button */}
          <button
            onClick={() => syncNow()}
            disabled={!networkInfo.isOnline || syncStatus.isSyncing}
            className={`
              flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
              ${networkInfo.isOnline && !syncStatus.isSyncing
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }
            `}
            title={!networkInfo.isOnline ? 'Cannot sync while offline' : 'Sync now'}
          >
            {syncStatus.isSyncing ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Syncing...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Sync</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Detailed Status (Expandable) */}
      {showDetails && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            {/* Network Details */}
            <div>
              <div className="font-medium text-gray-700 mb-2">Network</div>
              <div className="space-y-1 text-gray-600">
                <div>Status: <span className="font-medium">{networkInfo.isOnline ? 'Online' : 'Offline'}</span></div>
                <div>Quality: <span className="font-medium">{getNetworkQualityText()}</span></div>
                {networkInfo.effectiveType && (
                  <div>Type: <span className="font-medium uppercase">{networkInfo.effectiveType}</span></div>
                )}
                {networkInfo.rtt && (
                  <div>Latency: <span className="font-medium">{networkInfo.rtt}ms</span></div>
                )}
              </div>
            </div>

            {/* Sync Details */}
            <div>
              <div className="font-medium text-gray-700 mb-2">Sync Status</div>
              <div className="space-y-1 text-gray-600">
                <div>Synced: <span className="font-medium text-green-600">{syncStatus.lastSyncTime ? '✓' : '✗'}</span></div>
                <div>Pending: <span className="font-medium text-orange-600">{pendingCount}</span></div>
                <div>Failed: <span className="font-medium text-red-600">{failedCount}</span></div>
                {syncStatus.error && (
                  <div className="text-red-600">Error: {syncStatus.error}</div>
                )}
              </div>
            </div>

            {/* Connection History */}
            <div>
              <div className="font-medium text-gray-700 mb-2">Connection</div>
              <div className="space-y-1 text-gray-600">
                {networkInfo.lastOnlineTime && (
                  <div>Last online: <span className="font-medium">{new Date(networkInfo.lastOnlineTime).toLocaleTimeString()}</span></div>
                )}
                {networkInfo.lastOfflineTime && (
                  <div>Last offline: <span className="font-medium">{new Date(networkInfo.lastOfflineTime).toLocaleTimeString()}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact Network Status Badge (for mobile/small screens)
 */
export function NetworkStatusBadge() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(networkMonitor.getInfo());
  const syncStatus = useSyncStatus();
  const { count: pendingCount } = usePendingItemsCount();

  useEffect(() => {
    const unsubscribe = networkMonitor.on((event) => {
      setNetworkInfo(event.info);
    });

    return unsubscribe;
  }, []);

  const getStatusColor = () => {
    if (!networkInfo.isOnline) return 'bg-red-500';
    if (syncStatus.isSyncing) return 'bg-blue-500';
    if (pendingCount > 0) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${syncStatus.isSyncing ? 'animate-pulse' : ''}`} />
      {pendingCount > 0 && (
        <span className="text-xs text-gray-600">{pendingCount}</span>
      )}
    </div>
  );
}
