import React, { useState, useEffect } from 'react';
import { SyncService, SyncProgress } from '../../lib/sync-service';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(SyncService.getOnlineStatus());
  const [syncStatuses, setSyncStatuses] = useState<SyncProgress[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = SyncService.addSyncListener(() => {
      setIsOnline(SyncService.getOnlineStatus());
      updateSyncStatuses();
    });

    updateSyncStatuses();

    return unsubscribe;
  }, []);

  const updateSyncStatuses = async () => {
    const statuses = await SyncService.getSyncStatus();
    setSyncStatuses(statuses);
    
    const hasPendingChanges = statuses.some(status => status.status === 'pending');
    setIsSyncing(hasPendingChanges && isOnline);
  };

  const handleManualSync = async () => {
    if (!isOnline) return;
    
    setIsSyncing(true);
    try {
      await SyncService.syncAllTables();
      await updateSyncStatuses();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    if (isSyncing) return <RefreshCw className="h-4 w-4 animate-spin" />;
    if (isOnline) return <Wifi className="h-4 w-4" />;
    return <WifiOff className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isSyncing) return 'Syncing...';
    if (isOnline) return 'Online';
    return 'Offline';
  };

  const getStatusColor = () => {
    if (isSyncing) return 'bg-yellow-500';
    if (isOnline) return 'bg-green-500';
    return 'bg-red-500';
  };

  const getStatusBadgeVariant = () => {
    if (isSyncing) return 'secondary';
    if (isOnline) return 'default';
    return 'destructive';
  };

  const totalPendingChanges = syncStatuses.reduce((sum, status) => sum + status.progress, 0);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge 
        variant={getStatusBadgeVariant()}
        className="flex items-center gap-1"
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Badge>

      {isOnline && totalPendingChanges > 0 && (
        <Badge variant="outline" className="text-xs">
          {totalPendingChanges} pending
        </Badge>
      )}

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <Clock className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sync Status</DialogTitle>
            <DialogDescription>
              Current synchronization status for all data tables
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Connection Status</span>
              <Badge variant={getStatusBadgeVariant()}>
                {getStatusText()}
              </Badge>
            </div>

            {isOnline && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Pending Changes</span>
                  <span className="text-sm text-muted-foreground">
                    {totalPendingChanges} items
                  </span>
                </div>

                {syncStatuses.map((status) => (
                  <div key={status.tableName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize">
                        {status.tableName.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <div className="flex items-center gap-1">
                        {status.status === 'completed' && (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        )}
                        {status.status === 'pending' && (
                          <Clock className="h-3 w-3 text-yellow-500" />
                        )}
                        {status.status === 'error' && (
                          <AlertCircle className="h-3 w-3 text-red-500" />
                        )}
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
                      <p className="text-xs text-red-500">{status.error}</p>
                    )}
                  </div>
                ))}

                <Button 
                  onClick={handleManualSync}
                  disabled={isSyncing || totalPendingChanges === 0}
                  className="w-full"
                  size="sm"
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
              </div>
            )}

            {!isOnline && (
              <div className="text-center py-4">
                <WifiOff className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  You're currently offline. Changes will sync automatically when connection is restored.
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ConnectionStatus;
