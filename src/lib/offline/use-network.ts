/**
 * Network Hooks
 * 
 * React hooks for monitoring network status
 */

import { useState, useEffect } from 'react';
import { networkMonitor, type NetworkInfo, type NetworkStatus } from './network-monitor';

/**
 * Hook for network information
 */
export function useNetwork() {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(networkMonitor.getInfo());

  useEffect(() => {
    const unsubscribe = networkMonitor.on((event) => {
      setNetworkInfo(event.info);
    });

    return unsubscribe;
  }, []);

  return networkInfo;
}

/**
 * Hook for online/offline status
 */
export function useNetworkStatus(): NetworkStatus {
  const networkInfo = useNetwork();
  return networkInfo.status;
}

/**
 * Hook for checking if network is good for syncing
 */
export function useIsGoodForSync(): boolean {
  const networkInfo = useNetwork();
  return networkMonitor.isGoodForSync();
}

/**
 * Hook for connection type
 */
export function useConnectionType() {
  const networkInfo = useNetwork();
  return networkInfo.connectionType;
}

/**
 * Hook for network quality metrics
 */
export function useNetworkQuality() {
  const networkInfo = useNetwork();
  
  return {
    effectiveType: networkInfo.effectiveType,
    downlink: networkInfo.downlink,
    rtt: networkInfo.rtt,
    saveData: networkInfo.saveData,
  };
}
