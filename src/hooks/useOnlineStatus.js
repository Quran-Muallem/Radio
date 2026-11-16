import { useEffect, useState } from 'react';
import { Network } from '@capacitor/network';
import { isNative } from '../lib/platform.js';

/**
 * Liefert true/false für die Internetverbindung.
 * In der Android-App über das Network-Plugin (zuverlässiger als navigator.onLine in der WebView),
 * im Browser über die online/offline-Ereignisse.
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine !== false));

  useEffect(() => {
    if (isNative) {
      let handle = null;
      let disposed = false;
      Network.getStatus().then((s) => !disposed && setOnline(s.connected)).catch(() => {});
      Network.addListener('networkStatusChange', (s) => setOnline(s.connected)).then((h) => {
        if (disposed) h.remove();
        else handle = h;
      });
      return () => {
        disposed = true;
        if (handle) handle.remove();
      };
    }
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return online;
}
