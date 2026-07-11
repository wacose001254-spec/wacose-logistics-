import { createClient } from '@/lib/supabase/server';
import { AssignVehicleSelect } from '@/components/admin/AssignVehicleSelect';

export default async function RidersPage() {
  const supabase = await createClient();

  const [{ data: riders }, { data: assignments }, { data: vehicles }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, phone, active').eq('role', 'rider').order('full_name'),
    supabase.from('rider_vehicle_assignments').select('rider_id, vehicle_id').is('unassigned_at', null),
    supabase.from('vehicles').select('id, plate_number').eq('status', 'active'),
  ]);

  const vehicleIdByRiderId = new Map((assignments ?? []).map((a) => [a.rider_id, a.vehicle_id]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Riders</h1>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="py-2">Name</th>
            <th className="py-2">Phone</th>
            <th className="py-2">Active</th>
            <th className="py-2">Vehicle</th>
          </tr>
        </thead>
        <tbody>
          {(riders ?? []).map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-2 font-medium">{r.full_name}</td>
              <td className="py-2">{r.phone ?? '—'}</td>
              <td className="py-2">{r.active ? 'Yes' : 'No'}</td>
              <td className="py-2">
                <AssignVehicleSelect
                  riderId={r.id}
                  currentVehicleId={vehicleIdByRiderId.get(r.id) ?? null}
                  vehicles={vehicles ?? []}
                />
              </td>
            </tr>
          ))}
          {riders?.length === 0 && (
            <tr>
              <td colSpan={4} className="py-6 text-center text-gray-400">
                No riders yet. Create a rider account via Supabase Auth, then it will appear here.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
