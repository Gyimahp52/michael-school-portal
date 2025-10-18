import React, { useState, useEffect } from 'react';
import { DatabaseSetupService } from '../../lib/database-setup';
import { OfflineFirstDataService } from '../../lib/offline-first-data-service';
import { OfflineAuthService } from '../../lib/offline-auth';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Database, Users, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export function OfflineTestComponent() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    updateStats();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateStats = async () => {
    try {
      const databaseStats = await DatabaseSetupService.getDatabaseStats();
      setStats(databaseStats);
    } catch (error) {
      console.error('Failed to get stats:', error);
    }
  };

  const handleInitializeDatabase = async () => {
    setIsLoading(true);
    try {
      await DatabaseSetupService.initializeDatabase();
      await updateStats();
    } catch (error) {
      console.error('Database initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = async () => {
    setIsLoading(true);
    try {
      await DatabaseSetupService.clearAllData();
      await updateStats();
    } catch (error) {
      console.error('Failed to clear data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    setIsLoading(true);
    try {
      await OfflineFirstDataService.syncAllData();
      await updateStats();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestOfflineLogin = async () => {
    try {
      const result = await OfflineAuthService.loginOffline({
        username: 'admin',
        password: 'admin123'
      });
      
      if (result.success) {
        alert('Offline login successful!');
      } else {
        alert('Offline login failed: ' + result.error);
      }
    } catch (error) {
      alert('Offline login error: ' + error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Offline Database Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          {/* Database Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Users className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <div className="text-2xl font-bold">{stats.users}</div>
                <div className="text-sm text-muted-foreground">Users</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <Database className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <div className="text-2xl font-bold">{stats.students}</div>
                <div className="text-sm text-muted-foreground">Students</div>
              </div>
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <div className="text-2xl font-bold">{stats.attendance}</div>
                <div className="text-sm text-muted-foreground">Attendance</div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleInitializeDatabase}
              disabled={isLoading}
              className="gap-2"
            >
              <Database className="h-4 w-4" />
              Initialize Database
            </Button>
            
            <Button 
              onClick={handleSyncData}
              disabled={isLoading || !isOnline}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Sync Data
            </Button>
            
            <Button 
              onClick={handleTestOfflineLogin}
              disabled={isLoading}
              variant="secondary"
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Test Offline Login
            </Button>
            
            <Button 
              onClick={handleClearData}
              disabled={isLoading}
              variant="destructive"
              className="gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Clear All Data
            </Button>
          </div>

          {/* Instructions */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Test Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Click "Initialize Database" to create sample data</li>
              <li>Test offline login with username: admin, password: admin123</li>
              <li>Go offline in browser DevTools and test functionality</li>
              <li>Go back online and click "Sync Data" to synchronize</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OfflineTestComponent;
