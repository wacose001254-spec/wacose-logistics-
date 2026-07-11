'use client';

import { useTransition } from 'react';
import { updateVehicleStatusAction } from '@/lib/fleet/vehicle-actions';
import { VEHICLE_STATUSES } from '@/lib/constants';

export interface VehicleRow {
  id: string;
  plate_number: string;
  type: string;
  status: string;
  currentRider: string | null;
}

export function FleetTable({ vehicles }: { vehicles: VehicleRow[] }) {
  const [pending, startTransition] = useTransition();

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b text-gray-500">
          <th className="py-2">Plate</th>
          <th className="py-2">Type</th>
          <th className="py-2">Current rider</th>
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((v) => (
          <tr key={v.id} className="border-b">
            <td className="py-2 font-medium">{v.plate_number}</td>
            <td className="py-2">{v.type}</td>
            <td className="py-2">{v.currentRider ?? '—'}</td>
            <td className="py-2">
              <select
                defaultValue={v.status}
                disabled={pending}
                onChange={(e) => startTransition(() => updateVehicleStatusAction(v.id, e.target.value))}
                className="rounded border px-2 py-1 text-sm"
              >
                {VEHICLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
        {vehicles.length === 0 && (
          <tr>
            <td colSpan={4} className="py-6 text-center text-gray-400">
              No vehicles yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
