'use client';

import { useActionState } from 'react';
import { createBookingAction, type CreateBookingState } from '@/lib/booking/create-booking-action';
import { PARCEL_SIZES } from '@/lib/constants';
import { PARCEL_SIZE_PRICE } from '@/lib/validation/booking-schema';

const initialState: CreateBookingState = {};

function Field({
  label,
  name,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; error?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <input id={name} name={name} className="w-full rounded border px-3 py-2 text-base" {...props} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function BookingForm({ redirectTo }: { redirectTo?: 'admin' } = {}) {
  const [state, formAction, pending] = useActionState(createBookingAction, initialState);
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="mx-auto max-w-lg space-y-6">
      {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
      <fieldset className="space-y-4">
        <legend className="mb-1 font-semibold">Your details</legend>
        <Field label="Your name" name="senderName" required error={errors.senderName} />
        <Field label="Your phone number" name="senderPhone" type="tel" required error={errors.senderPhone} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 font-semibold">Pickup &amp; drop-off</legend>
        <Field label="Pickup address" name="pickupAddress" required error={errors.pickupAddress} />
        <Field label="Drop-off address" name="dropoffAddress" required error={errors.dropoffAddress} />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 font-semibold">Recipient</legend>
        <Field label="Recipient name" name="recipientName" required error={errors.recipientName} />
        <Field label="Recipient phone" name="recipientPhone" type="tel" required error={errors.recipientPhone} />
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="mb-1 font-semibold">Parcel</legend>
        <div className="space-y-1">
          <label htmlFor="parcelDescription" className="text-sm font-medium">
            Description (optional)
          </label>
          <textarea
            id="parcelDescription"
            name="parcelDescription"
            rows={2}
            className="w-full rounded border px-3 py-2 text-base"
          />
        </div>
        <div className="space-y-1">
          <span className="text-sm font-medium">Size</span>
          <div className="flex gap-3">
            {PARCEL_SIZES.map((size) => (
              <label key={size} className="flex items-center gap-1.5 text-sm">
                <input type="radio" name="parcelSize" value={size} defaultChecked={size === 'small'} required />
                {size} (KES {PARCEL_SIZE_PRICE[size]})
              </label>
            ))}
          </div>
          {errors.parcelSize && <p className="text-xs text-red-600">{errors.parcelSize}</p>}
        </div>
      </fieldset>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-brand-navy py-2.5 text-base font-medium text-white disabled:opacity-50"
      >
        {pending ? 'Booking…' : 'Book pickup'}
      </button>
    </form>
  );
}
