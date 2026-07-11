import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function RiderDeliveriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, booking_code, recipient_name, dropoff_address, status')
    .eq('assigned_rider_id', user?.id ?? '')
    .in('status', ['assigned', 'in_transit'])
    .order('created_at', { ascending: true });

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold">Your deliveries</h1>
      {(bookings ?? []).map((b) => (
        <Link
          key={b.id}
          href={`/rider/deliveries/${b.id}`}
          className="block rounded border p-4 active:bg-gray-50"
        >
          <p className="font-medium">{b.booking_code}</p>
          <p className="text-sm text-gray-600">To: {b.recipient_name}</p>
          <p className="text-sm text-gray-500">{b.dropoff_address}</p>
          <span className="mt-1 inline-block rounded bg-gray-100 px-2 py-0.5 text-xs">{b.status}</span>
        </Link>
      ))}
      {bookings?.length === 0 && <p className="text-gray-400">No deliveries assigned right now.</p>}
    </div>
  );
}
