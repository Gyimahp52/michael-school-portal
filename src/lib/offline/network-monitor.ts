/**
 * Network Monitor
 * 
 * Advanced network detection with connection quality monitoring
 * and automatic sync triggering
 */

import { syncManager } from './sync-manager';

// ===== TYPES =====

export type NetworkStatus = 'online' | 'offline' | 'slow' | 'unstable';
export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'unknown';

export interface NetworkInfo {
  status: NetworkStatus;
  isOnline: boolean;
  connectionType: ConnectionType;
  effectiveType?: '4g' | '3g' | '2g' | 'slow-2g';
  downlink?: number; // Mbps
  rtt?: number; // Round-trip time in ms
  saveData?: boolean;
  lastOnlineTime?: number;
  lastOfflineTime?: number;
}

export interface NetworkEvent {
  type: 'online' | 'offline' | 'change';
  timestamp: number;
  info: NetworkInfo;
}

// ===== NETWORK MONITOR CLASS =====

export class NetworkMonitor {
  private info: NetworkInfo;
  private listeners: Set<(event: NetworkEvent) => void> = new Set();
  private checkInterval: number | null = null;
  private wasOffline = false;

  constructor() {
    this.info = this.getCurrentNetworkInfo();
    this.setupListeners();
  }

  // ===== INITIALIZATION =====

  private setupListeners(): void {
    // Online/Offline events
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);

    // Connection change events (if supported)
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.addEventListener('change', this.handleConnectionChange);
    }

    // Periodic check for connection quality
    this.startPeriodicCheck();
  }

  // ===== EVENT HANDLERS =====

  private handleOnline = (): void => {
    console.log('🟢 Network: ONLINE');
    
    const wasOffline = this.wasOffline;
    this.wasOffline = false;
    
    this.info = this.getCurrentNetworkInfo();
    this.info.lastOnlineTime = Date.now();

    this.emit({
      type: 'online',
      timestamp: Date.now(),
      info: this.info,
    });

    // Trigger auto-sync when coming back online
    if (wasOffline) {
      console.log('📡 Connection restored - triggering auto-sync...');
      this.triggerAutoSync();
    }
  };

  private handleOffline = (): void => {
    console.log('🔴 Network: OFFLINE');
    
    this.wasOffline = true;
    this.info = this.getCurrentNetworkInfo();
    this.info.lastOfflineTime = Date.now();

    this.emit({
      type: 'offline',
      timestamp: Date.now(),
      info: this.info,
    });
  };

  private handleConnectionChange = (): void => {
    const newInfo = this.getCurrentNetworkInfo();
    
    // Only emit if status actually changed
    if (newInfo.status !== this.info.status || 
        newInfo.connectionType !== this.info.connectionType) {
      
      console.log('🔄 Network changed:', newInfo);
      
      this.info = newInfo;
      this.emit({
        type: 'change',
        timestamp: Date.now(),
        info: this.info,
      });
    }
  };

  // ===== NETWORK INFO =====

  private getCurrentNetworkInfo(): NetworkInfo {
    const isOnline = navigator.onLine;
    
    const info: NetworkInfo = {
      status: isOnline ? 'online' : 'offline',
      isOnline,
      connectionType: this.detectConnectionType(),
    };

    // Get connection details if available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection) {
        info.effectiveType = connection.effectiveType;
        info.downlink = connection.downlink;
        info.rtt = connection.rtt;
        info.saveData = connection.saveData;

        // Determine network quality
        if (isOnline) {
          if (connection.effectiveType === 'slow-2g' || connection.rtt > 2000) {
            info.status = 'slow';
          } else if (connection.rtt > 1000 || connection.effectiveType === '2g') {
            info.status = 'unstable';
          }
        }
      }
    }

    return info;
  }

  private detectConnectionType(): ConnectionType {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const type = connection?.type;
      
      if (type === 'wifi') return 'wifi';
      if (type === 'cellular') return 'cellular';
      if (type === 'ethernet') return 'ethernet';
    }
    
    return 'unknown';
  }

  // ===== PERIODIC CHECK =====

  private startPeriodicCheck(): void {
    // Check connection quality every 30 seconds
    this.checkInterval = window.setInterval(() => {
      const newInfo = this.getCurrentNetworkInfo();
      
      // Update if status changed
      if (newInfo.status !== this.info.status) {
        this.info = newInfo;
        this.emit({
          type: 'change',
          timestamp: Date.now(),
          info: this.info,
        });
      }
    }, 30000);
  }

  // ===== AUTO-SYNC =====

  private async triggerAutoSync(): Promise<void> {
    try {
      // Wait a bit to ensure connection is stable
      await this.delay(1000);

      // Check if still online
      if (!navigator.onLine) {
        console.log('Connection lost before sync could start');
        return;
      }

      // Trigger sync through sync manager
      await syncManager.syncAll();
      
      console.log('✅ Auto-sync completed successfully');
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== EVENT EMITTER =====

  private emit(event: NetworkEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in network listener:', error);
      }
    });
  }

  // ===== PUBLIC API =====

  /**
   * Get current network information
   */
  getInfo(): NetworkInfo {
    return { ...this.info };
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return this.info.isOnline;
  }

  /**
   * Get network status
   */
  getStatus(): NetworkStatus {
    return this.info.status;
  }

  /**
   * Get connection type
   */
  getConnectionType(): ConnectionType {
    return this.info.connectionType;
  }

  /**
   * Check if connection is good for syncing
   */
  isGoodForSync(): boolean {
    return this.info.isOnline && 
           this.info.status !== 'slow' && 
           this.info.status !== 'unstable';
  }

  /**
   * Add event listener
   */
  on(callback: (event: NetworkEvent) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection?.removeEventListener('change', this.handleConnectionChange);
    }

    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.removeAllListeners();
  }
}

// Export singleton instance
export const networkMonitor = new NetworkMonitor();

// Export class for testing
export { NetworkMonitor as NetworkMonitorClass };
