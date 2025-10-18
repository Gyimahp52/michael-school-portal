import React, { useState, useEffect } from 'react';
import { SyncService, SyncProgress } from '../../lib/sync-service';
import { OfflineFirstDataService } from '../../lib/offline-first-data-service';
import { Progress } from '../ui/progress';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface SyncProgressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SyncProgressDialog({ open, onOpenChange }: SyncProgressDialogProps) {
  const [syncStatuses, setSyncStatuses] = useState<SyncProgress[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  useEffect(() => {
    if (open) {
      updateSyncStatuses();
    }
  }, [open]);

  const updateSyncStatuses = async () => {
    const statuses = await SyncService.getSyncStatus();
    setSyncStatuses(statuses);
    
    // Check if any sync is in progress
    const hasPendingChanges = statuses.some(status => status.status === 'pending');
    setIsSyncing(hasPendingChanges && OfflineFirstDataService.isOnline());
  };

  const handleManualSync = async () => {
    if (!OfflineFirstDataService.isOnline()) return;
    
    setIsSyncing(true);
    try {
      await OfflineFirstDataService.syncAllData();
      setLastSyncTime(new Date());
      await updateSyncStatuses();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Database className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'pending':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const totalPendingChanges = syncStatuses.reduce((sum, status) => sum + status.progress, 0);
  const totalRecords = syncStatuses.reduce((sum, status) => sum + status.total, 0);
  const syncProgress = totalRecords > 0 ? ((totalRecords - totalPendingChanges) / totalRecords) * 100 : 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Data Synchronization
          </DialogTitle>
          <DialogDescription>
            Monitor and manage data synchronization between local storage and Firebase
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              {OfflineFirstDataService.isOnline() ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className="font-medium">
                {OfflineFirstDataService.isOnline() ? 'Online' : 'Offline'}
              </span>
            </div>
            <Badge variant={OfflineFirstDataService.isOnline() ? 'default' : 'destructive'}>
              {OfflineFirstDataService.isOnline() ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Sync Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(syncProgress)}% complete
              </span>
            </div>
            <Progress value={syncProgress} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{totalRecords - totalPendingChanges} synced</span>
              <span>{totalPendingChanges} pending</span>
            </div>
          </div>

          {/* Table Status */}
          <div className="space-y-3">
            <h4 className="font-medium">Table Status</h4>
            {syncStatuses.map((status) => (
              <div key={status.tableName} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status.status)}
                    <span className="text-sm font-medium capitalize">
                      {status.tableName.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${getStatusColor(status.status)}`}>
                      {status.status}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {status.progress}/{status.total}
                    </span>
                  </div>
                </div>
                
                {status.total > 0 && (
                  <Progress 
                    value={(status.total - status.progress) / status.total * 100} 
                    className="h-1"
                  />
                )}
                
                {status.error && (
                  <p className="text-xs text-red-500 bg-red-50 p-2 rounded">
                    {status.error}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Last Sync Time */}
          {lastSyncTime && (
            <div className="text-xs text-muted-foreground text-center">
              Last manual sync: {lastSyncTime.toLocaleString()}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              onClick={handleManualSync}
              disabled={isSyncing || !OfflineFirstDataService.isOnline() || totalPendingChanges === 0}
              className="flex-1"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={updateSyncStatuses}
              disabled={isSyncing}
            >
              Refresh
            </Button>
          </div>

          {/* Offline Notice */}
          {!OfflineFirstDataService.isOnline() && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">Offline Mode</span>
              </div>
              <p className="text-sm text-yellow-700 mt-1">
                You're currently offline. Changes will sync automatically when connection is restored.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SyncProgressDialog;
