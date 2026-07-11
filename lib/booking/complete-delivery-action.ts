'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyBookingSms } from '@/lib/notifications/notify';
import { generateInvoiceForBooking } from '@/lib/invoices/generate-pdf';

export interface CompleteDeliveryState {
  error?: string;
  ok?: boolean;
}

function dataUrlToBuffer(dataUrl: string) {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Buffer.from(base64, 'base64');
}

export async function completeDeliveryAction(
  bookingId: string,
  input: { recipientName: string; signatureDataUrl: string; photoDataUrl?: string; lat: number | null; lng: number | null }
): Promise<CompleteDeliveryState> {
  if (!input.recipientName.trim()) return { error: 'Enter the recipient name.' };
  if (!input.signatureDataUrl) return { error: 'A signature is required.' };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'Not signed in.' };

  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('booking_code, sender_phone, price, status, assigned_rider_id')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) return { error: 'Booking not found.' };
  if (booking.assigned_rider_id !== user.id) return { error: 'This delivery is not assigned to you.' };
  if (booking.status !== 'in_transit') return { error: `Booking is already ${booking.status}.` };

  const admin = createAdminClient();
  const signaturePath = `${bookingId}/signature.png`;
  const { error: sigUploadError } = await admin.storage
    .from('proof-of-delivery')
    .upload(signaturePath, dataUrlToBuffer(input.signatureDataUrl), { contentType: 'image/png', upsert: true });
  if (sigUploadError) return { error: 'Could not upload signature. Please try again.' };

  let photoPath: string | null = null;
  if (input.photoDataUrl) {
    photoPath = `${bookingId}/photo.jpg`;
    const { error: photoUploadError } = await admin.storage
      .from('proof-of-delivery')
      .upload(photoPath, dataUrlToBuffer(input.photoDataUrl), { contentType: 'image/jpeg', upsert: true });
    if (photoUploadError) photoPath = null; // photo is optional — don't fail delivery over it
  }

  const { error: podError } = await supabase.from('proof_of_delivery').insert({
    booking_id: bookingId,
    signature_image_path: signaturePath,
    photo_image_path: photoPath,
    recipient_name: input.recipientName,
    lat: input.lat,
    lng: input.lng,
    recorded_by: user.id,
  });
  if (podError) return { error: 'Could not save proof of delivery. Please try again.' };

  const { error: updateError } = await supabase.from('bookings').update({ status: 'delivered' }).eq('id', bookingId);
  if (updateError) return { error: 'Could not update booking status.' };

  await supabase.from('parcel_events').insert({
    booking_id: bookingId,
    event_type: 'delivered',
    actor_id: user.id,
    lat: input.lat,
    lng: input.lng,
    note: `Received by ${input.recipientName}`,
  });

  await notifyBookingSms({
    bookingId,
    recipientPhone: booking.sender_phone,
    template: 'delivered',
    context: { bookingCode: booking.booking_code, recipientName: input.recipientName },
  });

  const invoiceResult = await generateInvoiceForBooking(bookingId);
  if (invoiceResult.ok && invoiceResult.invoiceUrl) {
    await notifyBookingSms({
      bookingId,
      recipientPhone: booking.sender_phone,
      template: 'invoice',
      context: { bookingCode: booking.booking_code, invoiceUrl: invoiceResult.invoiceUrl },
    });
  }

  revalidatePath(`/rider/deliveries/${bookingId}`);
  revalidatePath(`/track/${booking.booking_code}`);
  return { ok: true };
}
