import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DeliveryActions } from '@/components/rider/DeliveryActions';

export default async function RiderDeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, booking_code, recipient_name, recipient_phone, dropoff_address, parcel_description, parcel_size, status')
    .eq('id', id)
    .single();

  if (!booking) notFound();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{booking.booking_code}</h1>
        <p className="text-sm text-gray-500">Status: {booking.status}</p>
      </div>

      <div className="rounded border p-4 text-sm">
        <p>
          <span className="font-medium">Deliver to:</span> {booking.recipient_name} · {booking.recipient_phone}
        </p>
        <p>
          <span className="font-medium">Address:</span> {booking.dropoff_address}
        </p>
        {booking.parcel_description && (
          <p>
            <span className="font-medium">Parcel:</span> {booking.parcel_size} — {booking.parcel_description}
          </p>
        )}
      </div>

      <DeliveryActions bookingId={booking.id} bookingCode={booking.booking_code} status={booking.status} />

      {booking.status === 'delivered' && (
        <p className="rounded bg-green-50 p-3 text-sm text-green-700">Delivered. Invoice sent to the sender.</p>
      )}
    </div>
  );
}
