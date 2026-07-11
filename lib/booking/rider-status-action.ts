'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { notifyBookingSms } from '@/lib/notifications/notify';

export interface RiderActionState {
  error?: string;
  ok?: boolean;
}

export async function confirmPickupAction(
  bookingId: string,
  scannedCode: string,
  lat: number | null,
  lng: number | null
): Promise<RiderActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('booking_code, sender_phone, status, assigned_rider_id')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) return { error: 'Booking not found.' };
  if (booking.assigned_rider_id !== user.id) return { error: 'This delivery is not assigned to you.' };
  if (booking.status !== 'assigned') return { error: `Booking is already ${booking.status}.` };
  if (scannedCode.trim() !== booking.booking_code) {
    return { error: 'Scanned code does not match this delivery.' };
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'in_transit' })
    .eq('id', bookingId);
  if (updateError) return { error: 'Could not update status. Please try again.' };

  await supabase.from('parcel_events').insert([
    { booking_id: bookingId, event_type: 'picked_up', actor_id: user.id, lat, lng },
    { booking_id: bookingId, event_type: 'in_transit', actor_id: user.id, lat, lng },
  ]);

  await notifyBookingSms({
    bookingId,
    recipientPhone: booking.sender_phone,
    template: 'picked_up',
    context: { bookingCode: booking.booking_code },
  });

  revalidatePath(`/rider/deliveries/${bookingId}`);
  return { ok: true };
}
