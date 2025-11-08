/**
 * Module Sync Status
 * 
 * Shows sync status for specific modules/collections with detailed counts
 */

import React from 'react';
import { useCollectionSyncStatus } from '../lib/offline/sync-hooks';

interface ModuleSyncStatusProps {
  module: string;
  displayName: string;
  icon?: string;
  showDetails?: boolean;
}

export function ModuleSyncStatus({ 
  module, 
  displayName, 
  icon = '📄',
  showDetails = false 
}: ModuleSyncStatusProps) {
  const { status, loading } = useCollectionSyncStatus(module);

  if (loading) {
    return (
      <div className="animate-pulse flex items-center gap-2 p-2">
        <div className="w-4 h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  const getStatusIcon = () => {
    if (status.failed > 0) return '❌';
    if (status.pending > 0) return '⏳';
    if (status.synced > 0) return '✅';
    return '⚪';
  };

  const getStatusColor = () => {
    if (status.failed > 0) return 'text-red-600';
    if (status.pending > 0) return 'text-orange-600';
    if (status.synced > 0) return 'text-green-600';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (status.failed > 0) return `${status.failed} failed`;
    if (status.pending > 0) return `${status.pending} pending`;
    if (status.synced > 0) return 'Synced';
    return 'No data';
  };

  return (
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <div className="font-medium text-gray-900">{displayName}</div>
          {showDetails && (
            <div className="text-xs text-gray-500 mt-0.5">
              {status.synced} synced · {status.pending} pending · {status.failed} failed
            </div>
          )}
        </div>
      </div>
      <div className={`flex items-center gap-2 ${getStatusColor()}`}>
        <span className="text-lg">{getStatusIcon()}</span>
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
    </div>
  );
}

/**
 * Module Sync Status Grid
 * Shows all modules in a grid layout
 */
export function ModuleSyncStatusGrid() {
  const modules = [
    { key: 'attendance', name: 'Attendance', icon: '📝' },
    { key: 'assessments', name: 'Grades', icon: '📊' },
    { key: 'students', name: 'Students', icon: '👨‍🎓' },
    { key: 'teachers', name: 'Teachers', icon: '👨‍🏫' },
    { key: 'classes', name: 'Classes', icon: '🏫' },
    { key: 'studentBalances', name: 'Fee Payments', icon: '💰' },
    { key: 'invoices', name: 'Invoices', icon: '🧾' },
    { key: 'applications', name: 'Applications', icon: '📋' },
    { key: 'schoolFees', name: 'Fee Structure', icon: '💵' },
    { key: 'subjects', name: 'Subjects', icon: '📚' },
    { key: 'canteenCollections', name: 'Canteen', icon: '🍽️' },
    { key: 'promotionRequests', name: 'Promotions', icon: '⬆️' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Module Sync Status</h2>
      <div className="space-y-1">
        {modules.map(module => (
          <ModuleSyncStatus
            key={module.key}
            module={module.key}
            displayName={module.name}
            icon={module.icon}
            showDetails={false}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Critical Modules Status (Compact)
 * Shows only critical modules (attendance, grades, fees)
 */
export function CriticalModulesStatus() {
  const criticalModules = [
    { key: 'attendance', name: 'Attendance', icon: '📝' },
    { key: 'assessments', name: 'Grades', icon: '📊' },
    { key: 'studentBalances', name: 'Fees', icon: '💰' },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="text-sm font-medium text-gray-700 mb-2">Critical Data Status</div>
      <div className="space-y-2">
        {criticalModules.map(module => (
          <ModuleSyncStatus
            key={module.key}
            module={module.key}
            displayName={module.name}
            icon={module.icon}
            showDetails={true}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Module Sync Badge (Minimal)
 * Small badge showing module sync status
 */
interface ModuleSyncBadgeProps {
  module: string;
}

export function ModuleSyncBadge({ module }: ModuleSyncBadgeProps) {
  const { status, loading } = useCollectionSyncStatus(module);

  if (loading) {
    return <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />;
  }

  const getColor = () => {
    if (status.failed > 0) return 'bg-red-500';
    if (status.pending > 0) return 'bg-orange-500';
    if (status.synced > 0) return 'bg-green-500';
    return 'bg-gray-300';
  };

  const getTooltip = () => {
    if (status.failed > 0) return `${status.failed} failed`;
    if (status.pending > 0) return `${status.pending} pending`;
    if (status.synced > 0) return 'All synced';
    return 'No data';
  };

  return (
    <div 
      className={`w-2 h-2 rounded-full ${getColor()}`}
      title={getTooltip()}
    />
  );
}

/**
 * Pending Items by Entity
 * Shows detailed breakdown of pending items
 */
export function PendingItemsByEntity() {
  const entities = [
    { key: 'attendance', name: 'Attendance Records' },
    { key: 'assessments', name: 'Grade Entries' },
    { key: 'students', name: 'Student Updates' },
    { key: 'teachers', name: 'Teacher Updates' },
    { key: 'studentBalances', name: 'Fee Payments' },
    { key: 'invoices', name: 'Invoices' },
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Pending Changes</h3>
      <div className="space-y-2">
        {entities.map(entity => {
          const { status } = useCollectionSyncStatus(entity.key);
          
          if (status.pending === 0) return null;
          
          return (
            <div key={entity.key} className="flex items-center justify-between p-2 bg-orange-50 rounded">
              <span className="text-sm text-gray-700">{entity.name}</span>
              <span className="text-sm font-medium text-orange-600">
                {status.pending} pending
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
