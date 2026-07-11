'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SignaturePad, type SignaturePadHandle } from './SignaturePad';
import { completeDeliveryAction } from '@/lib/booking/complete-delivery-action';

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PodCapture({ bookingId, bookingCode }: { bookingId: string; bookingCode: string }) {
  const router = useRouter();
  const signatureRef = useRef<SignaturePadHandle>(null);
  const [recipientName, setRecipientName] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit() {
    setError(null);
    const signatureDataUrl = signatureRef.current?.getDataUrl();
    if (!signatureDataUrl) {
      setError('Please collect a signature before submitting.');
      return;
    }
    if (!recipientName.trim()) {
      setError("Enter the recipient's name.");
      return;
    }

    setSubmitting(true);
    const photoDataUrl = photoFile ? await fileToDataUrl(photoFile) : undefined;

    const finish = (lat: number | null, lng: number | null) =>
      completeDeliveryAction(bookingId, { recipientName, signatureDataUrl, photoDataUrl, lat, lng }).then((result) => {
        setSubmitting(false);
        if (result.error) setError(result.error);
        else router.refresh();
      });

    navigator.geolocation.getCurrentPosition(
      (position) => finish(position.coords.latitude, position.coords.longitude),
      () => finish(null, null),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded bg-black py-3 font-medium text-white"
      >
        Mark delivered
      </button>
    );
  }

  return (
    <div className="space-y-3 rounded border p-4">
      <h2 className="font-semibold">Proof of delivery — {bookingCode}</h2>
      <div className="space-y-1">
        <label htmlFor="recipientName" className="text-sm font-medium">
          Received by
        </label>
        <input
          id="recipientName"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
          className="w-full rounded border px-3 py-2 text-base"
        />
      </div>

      <div className="space-y-1">
        <span className="text-sm font-medium">Signature</span>
        <SignaturePad ref={signatureRef} />
      </div>

      <div className="space-y-1">
        <label htmlFor="photo" className="text-sm font-medium">
          Photo (optional)
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded bg-black py-2.5 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Submitting…' : 'Confirm delivery'}
      </button>
    </div>
  );
}
