'use client';

import { useActionState } from 'react';
import { addVehicleAction, type VehicleActionState } from '@/lib/fleet/vehicle-actions';
import { VEHICLE_TYPES } from '@/lib/constants';

const initialState: VehicleActionState = {};

export function AddVehicleForm() {
  const [state, formAction, pending] = useActionState(addVehicleAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3 rounded border p-4">
      <div className="space-y-1">
        <label htmlFor="plateNumber" className="text-sm font-medium">
          Plate number
        </label>
        <input id="plateNumber" name="plateNumber" required className="rounded border px-3 py-2 text-sm" />
      </div>
      <div className="space-y-1">
        <label htmlFor="type" className="text-sm font-medium">
          Type
        </label>
        <select id="type" name="type" required className="rounded border px-3 py-2 text-sm">
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="rounded bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
        {pending ? 'Adding…' : 'Add vehicle'}
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
