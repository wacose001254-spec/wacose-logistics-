'use client';

import { useEffect, useRef } from 'react';
import { enqueuePing, startOutboxFlusher } from './ping-outbox';
import { RIDER_PING_INTERVAL_MS } from '@/lib/constants';

// Foreground-only tracking: pings while this component is mounted (the
// rider's active-delivery screen is open). No background tracking — see the
// PWA GPS risk note in the project plan. Throttled to one ping per interval
// even though watchPosition can fire much more often.
export function useGpsTracking(bookingId: string, active: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    const stopFlusher = startOutboxFlusher();

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (now - lastSentRef.current < RIDER_PING_INTERVAL_MS) return;
        lastSentRef.current = now;

        enqueuePing({
          bookingId,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          recordedAt: new Date().toISOString(),
        });
      },
      (err) => console.error('GPS error', err),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 }
    );

    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen').then((lock) => {
        wakeLockRef.current = lock;
      }).catch(() => {
        // Wake lock is best-effort — rider's screen may still sleep, that's fine.
      });
    }

    return () => {
      navigator.geolocation.clearWatch(watchId);
      stopFlusher();
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, [active, bookingId]);
}
