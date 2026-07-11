'use client';

import { useActionState } from 'react';
import { verifyTrackingAccessAction, type TrackAccessState } from '@/lib/booking/track-access-action';

const initialState: TrackAccessState = {};

export function TrackLookupForm({ defaultCode }: { defaultCode?: string }) {
  const [state, formAction, pending] = useActionState(verifyTrackingAccessAction, initialState);

  return (
    <form action={formAction} className="mx-auto max-w-sm space-y-4">
      <div className="space-y-1">
        <label htmlFor="bookingCode" className="text-sm font-medium">
          Booking code
        </label>
        <input
          id="bookingCode"
          name="bookingCode"
          defaultValue={defaultCode}
          placeholder="WAC-2026-000123"
          required
          className="w-full rounded border px-3 py-2 text-base uppercase"
        />
      </div>
      <div className="space-y-1">
        <label htmlFor="phone" className="text-sm font-medium">
          Phone number used for the booking
        </label>
        <input id="phone" name="phone" type="tel" required className="w-full rounded border px-3 py-2 text-base" />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-black py-2.5 font-medium text-white disabled:opacity-50"
      >
        {pending ? 'Looking up…' : 'Track parcel'}
      </button>
    </form>
  );
}
