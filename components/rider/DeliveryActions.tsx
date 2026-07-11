'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { QrScanner } from './QrScanner';
import { PodCapture } from './PodCapture';
import { confirmPickupAction } from '@/lib/booking/rider-status-action';
import { useGpsTracking } from '@/lib/rider/use-gps-tracking';
import type { BookingStatus } from '@/lib/constants';

export function DeliveryActions({
  bookingId,
  bookingCode,
  status,
}: {
  bookingId: string;
  bookingCode: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useGpsTracking(bookingId, status === 'in_transit');

  async function handleScan(scannedCode: string) {
    if (busy) return;
    setBusy(true);
    setScanning(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const result = await confirmPickupAction(
          bookingId,
          scannedCode,
          position.coords.latitude,
          position.coords.longitude
        );
        setBusy(false);
        if (result.error) setError(result.error);
        else router.refresh();
      },
      async () => {
        const result = await confirmPickupAction(bookingId, scannedCode, null, null);
        setBusy(false);
        if (result.error) setError(result.error);
        else router.refresh();
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  if (status === 'assigned') {
    return (
      <div className="space-y-3">
        {!scanning && (
          <button
            type="button"
            onClick={() => setScanning(true)}
            disabled={busy}
            className="w-full rounded bg-black py-3 font-medium text-white disabled:opacity-50"
          >
            {busy ? 'Confirming…' : 'Scan QR to confirm pickup'}
          </button>
        )}
        {scanning && <QrScanner onScan={handleScan} onError={setError} />}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (status === 'in_transit') {
    return (
      <div className="space-y-3">
        <p className="rounded bg-green-50 p-3 text-sm text-green-700">
          On the way — location is being shared while this screen is open.
        </p>
        <PodCapture bookingId={bookingId} bookingCode={bookingCode} />
      </div>
    );
  }

  return null;
}
