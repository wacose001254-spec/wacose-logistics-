'use client';

export function QrLabelPrint({
  qrDataUrl,
  bookingCode,
  pickupAddress,
  dropoffAddress,
  recipientName,
}: {
  qrDataUrl: string;
  bookingCode: string;
  pickupAddress: string;
  dropoffAddress: string;
  recipientName: string;
}) {
  return (
    <div className="rounded border p-4">
      <div id="qr-label" className="mx-auto w-64 space-y-2 border border-dashed p-4 text-center text-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={`QR code for booking ${bookingCode}`} className="mx-auto h-40 w-40" />
        <p className="font-mono font-semibold">{bookingCode}</p>
        <p className="truncate">To: {recipientName}</p>
        <p className="truncate text-xs text-gray-500">{pickupAddress}</p>
        <p className="truncate text-xs text-gray-500">→ {dropoffAddress}</p>
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="mt-3 w-full rounded border py-2 text-sm font-medium print:hidden"
      >
        Print label
      </button>
    </div>
  );
}
