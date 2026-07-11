import { createClient } from '@/lib/supabase/server';
import { FleetTable, type VehicleRow } from '@/components/admin/FleetTable';
import { AddVehicleForm } from '@/components/admin/AddVehicleForm';

export default async function FleetPage() {
  const supabase = await createClient();

  const [{ data: vehicles }, { data: assignments }, { data: riders }] = await Promise.all([
    supabase.from('vehicles').select('id, plate_number, type, status').order('plate_number'),
    supabase.from('rider_vehicle_assignments').select('rider_id, vehicle_id').is('unassigned_at', null),
    supabase.from('profiles').select('id, full_name').eq('role', 'rider'),
  ]);

  const riderNameById = new Map((riders ?? []).map((r) => [r.id, r.full_name]));
  const riderNameByVehicleId = new Map(
    (assignments ?? []).map((a) => [a.vehicle_id, riderNameById.get(a.rider_id) ?? 'Unknown'])
  );

  const rows: VehicleRow[] = (vehicles ?? []).map((v) => ({
    ...v,
    currentRider: riderNameByVehicleId.get(v.id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Fleet</h1>
      <AddVehicleForm />
      <FleetTable vehicles={rows} />
    </div>
  );
}
