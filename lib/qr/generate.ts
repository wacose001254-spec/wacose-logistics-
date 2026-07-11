import QRCode from 'qrcode';

// The QR encodes the booking_code directly (not a URL) so the rider's
// scanner can match it against the expected delivery without a network
// round-trip, and so labels remain meaningful even scanned by a generic QR
// app.
export async function generateQrDataUrl(bookingCode: string): Promise<string> {
  return QRCode.toDataURL(bookingCode, { margin: 1, width: 300 });
}
