'use client';

import { useTransition } from 'react';
import { assignRiderToVehicleAction } from '@/lib/fleet/vehicle-actions';

export function AssignVehicleSelect({
  riderId,
  currentVehicleId,
  vehicles,
}: {
  riderId: string;
  currentVehicleId: string | null;
  vehicles: { id: string; plate_number: string }[];
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentVehicleId ?? ''}
      disabled={pending}
      onChange={(e) => {
        if (e.target.value) startTransition(() => assignRiderToVehicleAction(riderId, e.target.value));
      }}
      className="rounded border px-2 py-1 text-sm"
    >
      <option value="">Unassigned</option>
      {vehicles.map((v) => (
        <option key={v.id} value={v.id}>
          {v.plate_number}
        </option>
      ))}
    </select>
  );
}
