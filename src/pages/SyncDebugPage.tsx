import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, RefreshCw, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import { DatabaseService } from "@/lib/database";
import { SyncService } from "@/lib/sync-service";
import { useToast } from "@/hooks/use-toast";
import type { SyncQueueItem } from "@/lib/database";

export function SyncDebugPage() {
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [syncStatus, setSyncStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  const loadSyncData = async () => {
    try {
      setLoading(true);
      const [queueItems, statusItems] = await Promise.all([
        DatabaseService.getPendingSyncItems(),
        SyncService.getSyncStatus()
      ]);
      setSyncQueue(queueItems);
      setSyncStatus(statusItems);
    } catch (error) {
      console.error('Error loading sync data:', error);
      toast({
        title: "Error",
        description: "Failed to load sync data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForcSync = async () => {
    try {
      setSyncing(true);
      const result = await SyncService.syncAllTables();
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${result.totalSynced} tables`,
        });
      } else {
        toast({
          title: "Sync Issues",
          description: `${result.errors.length} tables had errors`,
          variant: "destructive",
        });
      }
      
      await loadSyncData();
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync data",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    try {
      await DatabaseService.clearSyncQueue();
      toast({
        title: "Queue Cleared",
        description: "All pending sync items have been removed",
      });
      await loadSyncData();
    } catch (error) {
      console.error('Error clearing queue:', error);
      toast({
        title: "Error",
        description: "Failed to clear sync queue",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadSyncData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sync Debug</h1>
          <p className="text-muted-foreground">
            Monitor and debug data synchronization between local and remote storage
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadSyncData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleForcSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Force Sync
          </Button>
        </div>
      </div>

      {/* Sync Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {syncStatus.map((status) => (
          <Card key={status.tableName}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {status.tableName}
                {status.status === 'completed' ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : status.status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{status.progress}</div>
              <p className="text-xs text-muted-foreground">
                pending out of {status.total} total
              </p>
              <Badge
                variant={
                  status.status === 'completed' ? 'default' :
                  status.status === 'error' ? 'destructive' : 'secondary'
                }
                className="mt-2"
              >
                {status.status}
              </Badge>
              {status.error && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {status.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sync Queue Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending Sync Queue</CardTitle>
              <CardDescription>
                Items waiting to be synchronized with the remote database
              </CardDescription>
            </div>
            {syncQueue.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleClearQueue}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear Queue
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {syncQueue.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>No pending sync items</p>
              <p className="text-sm">All data is synchronized</p>
            </div>
          ) : (
            <div className="space-y-4">
              {syncQueue.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{item.tableName}</Badge>
                      <Badge
                        variant={
                          item.operation === 'create' ? 'default' :
                          item.operation === 'update' ? 'secondary' : 'destructive'
                        }
                      >
                        {item.operation}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Record ID: {item.recordId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(item.timestamp).toLocaleString()}
                    </p>
                    {item.attempts > 0 && (
                      <p className="text-xs text-red-600">
                        Attempts: {item.attempts}
                      </p>
                    )}
                    {item.lastError && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {item.lastError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  <div className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => DatabaseService.removeSyncQueueItem(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}