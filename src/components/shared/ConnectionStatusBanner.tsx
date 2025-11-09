import { useAuth } from '@/contexts/HybridAuthContext';
import { Wifi, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ConnectionStatusBanner() {
  const { isOnline, isOfflineMode } = useAuth();

  if (isOnline && !isOfflineMode) {
    return null;
  }

  return (
    <Alert className="border-warning bg-warning/10 mb-4">
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        <AlertDescription>
          {isOfflineMode ? (
            <span>
              <strong>Offline Mode:</strong> You're using cached credentials. Your changes will sync when connection is restored.
            </span>
          ) : (
            <span>
              <strong>Working Offline:</strong> All features available. Changes will sync automatically when connection is restored.
            </span>
          )}
        </AlertDescription>
      </div>
    </Alert>
  );
}
