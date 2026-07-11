import { notFound, redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { getInvoiceSignedUrl } from '@/lib/invoices/generate-pdf';
import { hasTrackAccess } from '@/lib/booking/track-access-action';

export default async function InvoicePage({ params }: { params: Promise<{ bookingCode: string }> }) {
  const { bookingCode } = await params;

  if (!(await hasTrackAccess(bookingCode))) {
    redirect(`/track?code=${encodeURIComponent(bookingCode)}`);
  }

  const admin = createAdminClient();

  const { data: booking } = await admin.from('bookings').select('id, booking_code, price').eq('booking_code', bookingCode).single();
  if (!booking) notFound();

  const signedUrl = await getInvoiceSignedUrl(booking.id);

  return (
    <div className="mx-auto max-w-md px-4 py-12 text-center">
      <h1 className="mb-2 text-xl font-semibold">Invoice — {booking.booking_code}</h1>
      <p className="mb-6 text-gray-600">Total: KES {booking.price}</p>
      {signedUrl ? (
        <a href={signedUrl} className="rounded bg-brand-navy px-5 py-2.5 font-medium text-white" target="_blank" rel="noreferrer">
          Download invoice PDF
        </a>
      ) : (
        <p className="text-gray-400">Invoice is being generated — check back shortly.</p>
      )}
    </div>
  );
}
