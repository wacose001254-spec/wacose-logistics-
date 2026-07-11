'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateQrDataUrl } from '@/lib/qr/generate';
import { notifyBookingSms } from '@/lib/notifications/notify';

export interface AssignBookingState {
  error?: string;
}

export async function assignBookingAction(
  bookingId: string,
  _prevState: AssignBookingState,
  formData: FormData
): Promise<AssignBookingState> {
  const riderId = String(formData.get('riderId') ?? '');
  const vehicleId = String(formData.get('vehicleId') ?? '');

  if (!riderId || !vehicleId) {
    return { error: 'Select both a rider and a vehicle.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('booking_code, sender_phone, qr_code_value')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    return { error: 'Booking not found.' };
  }

  const qrCodeValue = booking.qr_code_value ?? booking.booking_code;

  const { error: updateError } = await supabase
    .from('bookings')
    .update({
      assigned_rider_id: riderId,
      assigned_vehicle_id: vehicleId,
      status: 'assigned',
      qr_code_value: qrCodeValue,
    })
    .eq('id', bookingId);

  if (updateError) {
    return { error: 'Could not assign this booking. Please try again.' };
  }

  await supabase.from('parcel_events').insert({
    booking_id: bookingId,
    event_type: 'assigned',
    actor_id: user?.id ?? null,
  });

  await notifyBookingSms({
    bookingId,
    recipientPhone: booking.sender_phone,
    template: 'rider_assigned',
    context: { bookingCode: booking.booking_code },
  });

  revalidatePath(`/admin/bookings/${bookingId}`);
  return {};
}

export async function getQrLabel(bookingCode: string) {
  return generateQrDataUrl(bookingCode);
}
