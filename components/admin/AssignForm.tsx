'use client';

import { useActionState } from 'react';
import { assignBookingAction, type AssignBookingState } from '@/lib/booking/assign-booking-action';

const initialState: AssignBookingState = {};

export function AssignForm({
  bookingId,
  riders,
  vehicles,
}: {
  bookingId: string;
  riders: { id: string; full_name: string }[];
  vehicles: { id: string; plate_number: string; type: string }[];
}) {
  const boundAction = assignBookingAction.bind(null, bookingId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);

  return (
    <form action={formAction} className="space-y-3 rounded border p-4">
      <h2 className="font-semibold">Assign rider &amp; vehicle</h2>
      <div className="space-y-1">
        <label htmlFor="riderId" className="text-sm font-medium">
          Rider
        </label>
        <select id="riderId" name="riderId" required className="w-full rounded border px-3 py-2 text-sm">
          <option value="">Select a rider…</option>
          {riders.map((r) => (
            <option key={r.id} value={r.id}>
              {r.full_name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label htmlFor="vehicleId" className="text-sm font-medium">
          Vehicle
        </label>
        <select id="vehicleId" name="vehicleId" required className="w-full rounded border px-3 py-2 text-sm">
          <option value="">Select a vehicle…</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.plate_number} ({v.type})
            </option>
          ))}
        </select>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-brand-navy px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? 'Assigning…' : 'Assign'}
      </button>
    </form>
  );
}
