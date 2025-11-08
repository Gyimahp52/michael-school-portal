/**
 * Sync Dashboard Component
 * 
 * Comprehensive dashboard for monitoring sync status, conflicts, and errors
 */

import React from 'react';
import {
  useSyncStatistics,
  useConflictLog,
  useErrorLog,
  useManualSync,
  usePendingItemsCount,
  useFailedItemsCount,
} from '../lib/offline/sync-hooks';
import { useOnlineStatus } from '../lib/offline/use-offline-data';

export function SyncDashboard() {
  const { stats, loading: statsLoading, refresh } = useSyncStatistics();
  const { conflicts, clearConflicts } = useConflictLog();
  const { errors, clearErrors } = useErrorLog();
  const { sync, syncing, result } = useManualSync();
  const isOnline = useOnlineStatus();
  const { count: pendingCount } = usePendingItemsCount();
  const { count: failedCount } = useFailedItemsCount();

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sync Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
            <span className="text-lg">{isOnline ? '🟢' : '🔴'}</span>
            <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button
            onClick={() => sync()}
            disabled={!isOnline || syncing}
            className={`
              px-4 py-2 rounded-md font-medium
              ${isOnline && !syncing
                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Synced"
          value={stats?.syncedCount || 0}
          icon="✅"
          color="green"
        />
        <StatCard
          title="Pending"
          value={pendingCount}
          icon="⏳"
          color="orange"
        />
        <StatCard
          title="Failed"
          value={failedCount}
          icon="❌"
          color="red"
        />
        <StatCard
          title="Conflicts"
          value={stats?.conflictCount || 0}
          icon="⚠️"
          color="yellow"
        />
      </div>

      {/* Last Sync Result */}
      {result && (
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">Last Sync Result</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Push (Local → Firebase)</h3>
              <div className="space-y-1 text-sm">
                <div>✅ Synced: {result.push.synced}</div>
                <div>❌ Failed: {result.push.failed}</div>
                <div>⚠️ Conflicts: {result.push.conflicts}</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Pull (Firebase → Local)</h3>
              <div className="space-y-1 text-sm">
                <div>✅ Synced: {result.pull.synced}</div>
                <div>❌ Failed: {result.pull.failed}</div>
                <div>⚠️ Conflicts: {result.pull.conflicts}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* By Collection */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Sync Status by Collection</h2>
            <button
              onClick={refresh}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Collection
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Synced
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Pending
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Failed
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(stats.byCollection).map(([collection, status]) => (
                  <tr key={collection}>
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {collection}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-green-600">
                      {status.synced}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-orange-600">
                      {status.pending}
                    </td>
                    <td className="px-4 py-2 text-sm text-center text-red-600">
                      {status.failed}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Conflicts ({conflicts.length})</h2>
            <button
              onClick={clearConflicts}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-3">
            {conflicts.map((conflict, index) => (
              <div key={index} className="border border-yellow-200 rounded-lg p-3 bg-yellow-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">
                    {conflict.collectionName}/{conflict.itemId}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(conflict.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Resolution: <span className="font-medium">{conflict.resolution || 'Pending'}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="font-medium text-gray-700">Local</div>
                    <div className="text-gray-500">
                      {new Date(conflict.localTimestamp).toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-700">Remote</div>
                    <div className="text-gray-500">
                      {new Date(conflict.remoteTimestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Errors ({errors.length})</h2>
            <button
              onClick={clearErrors}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-3">
            {errors.map((error, index) => (
              <div key={index} className="border border-red-200 rounded-lg p-3 bg-red-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium">
                    {error.collectionName}/{error.itemId}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(error.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Operation: <span className="font-medium">{error.operation}</span>
                </div>
                <div className="mt-1 text-sm text-red-600">
                  {error.error}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: 'green' | 'orange' | 'red' | 'yellow';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  };

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-75">{title}</div>
          <div className="text-3xl font-bold mt-1">{value}</div>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
