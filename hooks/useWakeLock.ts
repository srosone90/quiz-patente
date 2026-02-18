// Hook per mantenere lo schermo sempre acceso durante il quiz
// Utilizza Screen Wake Lock API (supportato da Chrome/Edge mobile, Safari iOS 16.4+)

import { useEffect, useRef, useState } from 'react';

export function useWakeLock() {
  const [isSupported, setIsSupported] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    // Check se Wake Lock è supportato
    if ('wakeLock' in navigator) {
      setIsSupported(true);
    }

    // Cleanup on unmount
    return () => {
      release();
    };
  }, []);

  const request = async () => {
    if (!('wakeLock' in navigator)) {
      console.warn('Wake Lock API not supported');
      return false;
    }

    try {
      // Request wake lock
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      setIsLocked(true);

      console.log('✅ Screen Wake Lock attivo');

      // Handle release event (es. tab va in background)
      wakeLockRef.current.addEventListener('release', () => {
        console.log('🔓 Screen Wake Lock rilasciato');
        setIsLocked(false);
      });

      return true;
    } catch (error: any) {
      console.error('Errore Wake Lock:', error);
      setIsLocked(false);
      return false;
    }
  };

  const release = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsLocked(false);
        console.log('🔓 Screen Wake Lock rilasciato manualmente');
      } catch (error) {
        console.error('Errore rilascio Wake Lock:', error);
      }
    }
  };

  // Richiedi nuovamente se la pagina torna visibile
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && wakeLockRef.current !== null) {
        console.log('📱 Tab visibile, richiedo Wake Lock...');
        await request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return {
    isSupported,
    isLocked,
    request,
    release
  };
}
