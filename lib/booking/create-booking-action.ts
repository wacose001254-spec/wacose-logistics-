'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { bookingSchema, PARCEL_SIZE_PRICE } from '@/lib/validation/booking-schema';
import { notifyBookingSms } from '@/lib/notifications/notify';

export interface CreateBookingState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

export async function createBookingAction(
  _prevState: CreateBookingState,
  formData: FormData
): Promise<CreateBookingState> {
  const parsed = bookingSchema.safeParse({
    senderName: formData.get('senderName'),
    senderPhone: formData.get('senderPhone'),
    pickupAddress: formData.get('pickupAddress'),
    dropoffAddress: formData.get('dropoffAddress'),
    recipientName: formData.get('recipientName'),
    recipientPhone: formData.get('recipientPhone'),
    parcelDescription: formData.get('parcelDescription') || undefined,
    parcelSize: formData.get('parcelSize'),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { error: 'Please fix the highlighted fields.', fieldErrors };
  }

  const input = parsed.data;

  // A logged-in customer books against their own profile; anyone else books
  // as a guest (name + phone only), mirroring the current WhatsApp workflow.
  const sessionClient = await createClient();
  const {
    data: { user },
  } = await sessionClient.auth.getUser();

  const admin = createAdminClient();
  let guestContactId: string | null = null;

  if (!user) {
    const { data: guest, error: guestError } = await admin
      .from('guest_contacts')
      .insert({ full_name: input.senderName, phone: input.senderPhone })
      .select('id')
      .single();

    if (guestError || !guest) {
      return { error: 'Could not save your contact details. Please try again.' };
    }
    guestContactId = guest.id;
  }

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .insert({
      customer_id: user?.id ?? null,
      guest_contact_id: guestContactId,
      sender_name: input.senderName,
      sender_phone: input.senderPhone,
      pickup_address: input.pickupAddress,
      dropoff_address: input.dropoffAddress,
      recipient_name: input.recipientName,
      recipient_phone: input.recipientPhone,
      parcel_description: input.parcelDescription ?? null,
      parcel_size: input.parcelSize,
      price: PARCEL_SIZE_PRICE[input.parcelSize],
      status: 'pending',
    })
    .select('id, booking_code')
    .single();

  if (bookingError || !booking) {
    return { error: 'Could not create your booking. Please try again.' };
  }

  await admin.from('parcel_events').insert({
    booking_id: booking.id,
    event_type: 'created',
  });

  const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${booking.booking_code}`;
  await notifyBookingSms({
    bookingId: booking.id,
    recipientPhone: input.senderPhone,
    template: 'booking_confirmed',
    context: { bookingCode: booking.booking_code, trackingUrl },
  });

  const redirectBase = formData.get('redirectTo');
  if (redirectBase === 'admin') {
    redirect(`/admin/bookings/${booking.id}`);
  }

  // The person submitting this form just proved phone ownership by typing it
  // in, so grant tracking/invoice access immediately without a second
  // verification step.
  const cookieStore = await cookies();
  const cookieOpts = { httpOnly: true, maxAge: 60 * 60 * 4, sameSite: 'lax' as const };
  cookieStore.set(`wacose_track_${booking.booking_code}`, '1', { ...cookieOpts, path: `/track/${booking.booking_code}` });
  cookieStore.set(`wacose_track_${booking.booking_code}`, '1', { ...cookieOpts, path: `/invoice/${booking.booking_code}` });

  redirect(`/track/${booking.booking_code}?confirmed=1`);
}
