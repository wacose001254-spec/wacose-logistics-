import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { generateQrDataUrl } from '@/lib/qr/generate';
import { AssignForm } from '@/components/admin/AssignForm';
import { QrLabelPrint } from '@/components/labels/QrLabelPrint';

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', id).single();
  if (!booking) notFound();

  const { data: events } = await supabase
    .from('parcel_events')
    .select('event_type, note, created_at')
    .eq('booking_id', id)
    .order('created_at', { ascending: true });

  const { data: riders } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'rider')
    .eq('active', true);

  const { data: vehicles } = await supabase.from('vehicles').select('id, plate_number, type').eq('status', 'active');

  const qrDataUrl = await generateQrDataUrl(booking.booking_code);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-semibold">{booking.booking_code}</h1>
          <p className="text-sm text-gray-500">Status: {booking.status}</p>
        </div>

        <div className="rounded border p-4 text-sm">
          <p>
            <span className="font-medium">Sender:</span> {booking.sender_name} · {booking.sender_phone}
          </p>
          <p>
            <span className="font-medium">Pickup:</span> {booking.pickup_address}
          </p>
          <p className="mt-2">
            <span className="font-medium">Recipient:</span> {booking.recipient_name} · {booking.recipient_phone}
          </p>
          <p>
            <span className="font-medium">Drop-off:</span> {booking.dropoff_address}
          </p>
          <p className="mt-2">
            <span className="font-medium">Parcel:</span> {booking.parcel_size}
            {booking.parcel_description ? ` — ${booking.parcel_description}` : ''}
          </p>
          <p>
            <span className="font-medium">Price:</span> KES {booking.price}
          </p>
        </div>

        {booking.status === 'pending' && (
          <AssignForm bookingId={booking.id} riders={riders ?? []} vehicles={vehicles ?? []} />
        )}

        <div className="rounded border p-4">
          <h2 className="mb-2 font-semibold">Timeline</h2>
          <ul className="space-y-1 text-sm">
            {(events ?? []).map((e, i) => (
              <li key={i} className="text-gray-600">
                <span className="font-medium text-black">{e.event_type}</span>{' '}
                {new Date(e.created_at).toLocaleString()}
                {e.note ? ` — ${e.note}` : ''}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <QrLabelPrint
        qrDataUrl={qrDataUrl}
        bookingCode={booking.booking_code}
        pickupAddress={booking.pickup_address}
        dropoffAddress={booking.dropoff_address}
        recipientName={booking.recipient_name}
      />
    </div>
  );
}
