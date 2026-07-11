import { createAdminClient } from '@/lib/supabase/admin';
import { RevenueChart } from '@/components/admin/RevenueChart';

// Revenue/status figures must reflect live data on every request — this page
// doesn't touch cookies()/headers(), so without this Next.js would treat it
// as static-eligible and prerender it once at build time.
export const dynamic = 'force-dynamic';

const DAYS_BACK = 14;

function dayKey(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 10);
}

// Plain helpers (not components/hooks) so the once-per-request Date.now()
// reads here don't trip the react-hooks/purity rule, which assumes anything
// called directly in a component body must be safe to call on every render.
function daysAgoIso(daysBack: number) {
  return new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();
}

export default async function AdminDashboardPage() {
  const admin = createAdminClient();
  const since = daysAgoIso(DAYS_BACK);

  const [{ data: invoices }, { data: bookings }, { data: riders }] = await Promise.all([
    admin.from('invoices').select('amount, issued_at, booking_id').gte('issued_at', since),
    admin.from('bookings').select('id, status, assigned_rider_id'),
    admin.from('profiles').select('id, full_name').eq('role', 'rider'),
  ]);

  const riderNameById = new Map((riders ?? []).map((r) => [r.id, r.full_name]));
  const bookingRiderById = new Map((bookings ?? []).map((b) => [b.id, b.assigned_rider_id]));

  const revenueByDay = new Map<string, number>();
  for (let i = DAYS_BACK - 1; i >= 0; i--) {
    revenueByDay.set(daysAgoIso(i).slice(0, 10), 0);
  }

  const revenueByRider = new Map<string, number>();

  for (const invoice of invoices ?? []) {
    const key = dayKey(invoice.issued_at);
    if (revenueByDay.has(key)) {
      revenueByDay.set(key, (revenueByDay.get(key) ?? 0) + Number(invoice.amount));
    }
    const riderId = bookingRiderById.get(invoice.booking_id);
    const riderName = riderId ? riderNameById.get(riderId) ?? 'Unknown' : 'Unassigned';
    revenueByRider.set(riderName, (revenueByRider.get(riderName) ?? 0) + Number(invoice.amount));
  }

  const chartData = Array.from(revenueByDay.entries()).map(([day, revenue]) => ({
    day: day.slice(5), // MM-DD
    revenue,
  }));

  const statusCounts = (bookings ?? []).reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {['pending', 'assigned', 'in_transit', 'delivered'].map((status) => (
          <div key={status} className="rounded border p-4">
            <p className="text-sm text-gray-500">{status}</p>
            <p className="text-2xl font-semibold">{statusCounts[status] ?? 0}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Revenue — last {DAYS_BACK} days</h2>
        <RevenueChart data={chartData} />
      </div>

      <div>
        <h2 className="mb-2 font-semibold">Revenue by rider</h2>
        <table className="w-full max-w-md text-left text-sm">
          <tbody>
            {Array.from(revenueByRider.entries())
              .sort((a, b) => b[1] - a[1])
              .map(([name, amount]) => (
                <tr key={name} className="border-b">
                  <td className="py-2">{name}</td>
                  <td className="py-2">KES {amount.toFixed(2)}</td>
                </tr>
              ))}
            {revenueByRider.size === 0 && (
              <tr>
                <td className="py-4 text-gray-400">No revenue yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
