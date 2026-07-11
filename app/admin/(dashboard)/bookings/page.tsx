import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { BookingStatus } from '@/lib/constants';

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('bookings')
    .select('id, booking_code, sender_name, recipient_name, status, price, created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq('status', status as BookingStatus);
  }

  const { data: bookings } = await query;

  const statuses = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bookings</h1>
        <Link href="/admin/bookings/new" className="rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white">
          New booking
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <Link href="/admin/bookings" className={`rounded px-3 py-1 ${!status ? 'bg-brand-navy text-white' : 'border'}`}>
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/bookings?status=${s}`}
            className={`rounded px-3 py-1 ${status === s ? 'bg-brand-navy text-white' : 'border'}`}
          >
            {s}
          </Link>
        ))}
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2">Code</th>
            <th className="py-2">Sender</th>
            <th className="py-2">Recipient</th>
            <th className="py-2">Status</th>
            <th className="py-2">Price</th>
          </tr>
        </thead>
        <tbody>
          {(bookings ?? []).map((b) => (
            <tr key={b.id} className="border-b hover:bg-gray-50">
              <td className="py-2">
                <Link href={`/admin/bookings/${b.id}`} className="font-medium underline">
                  {b.booking_code}
                </Link>
              </td>
              <td className="py-2">{b.sender_name}</td>
              <td className="py-2">{b.recipient_name}</td>
              <td className="py-2">{b.status}</td>
              <td className="py-2">KES {b.price}</td>
            </tr>
          ))}
          {bookings?.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-400">
                No bookings yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
