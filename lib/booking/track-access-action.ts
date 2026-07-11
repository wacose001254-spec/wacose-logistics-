'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

export interface TrackAccessState {
  error?: string;
}

// booking_code is sequential (WAC-2026-000123) and therefore guessable, so a
// bare link isn't enough privacy protection — the sender/recipient phone
// acts as a light access gate before tracking details or an invoice are shown.
function trackCookieName(bookingCode: string) {
  return `wacose_track_${bookingCode}`;
}

export async function verifyTrackingAccessAction(
  _prevState: TrackAccessState,
  formData: FormData
): Promise<TrackAccessState> {
  const bookingCode = String(formData.get('bookingCode') ?? '').trim().toUpperCase();
  const phone = String(formData.get('phone') ?? '').trim();

  if (!bookingCode || !phone) {
    return { error: 'Enter your booking code and phone number.' };
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, sender_phone, recipient_phone')
    .eq('booking_code', bookingCode)
    .maybeSingle();

  if (!booking || (booking.sender_phone !== phone && booking.recipient_phone !== phone)) {
    return { error: 'No booking found matching that code and phone number.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(trackCookieName(bookingCode), '1', {
    httpOnly: true,
    maxAge: 60 * 60 * 4,
    path: `/track/${bookingCode}`,
    sameSite: 'lax',
  });
  cookieStore.set(trackCookieName(bookingCode), '1', {
    httpOnly: true,
    maxAge: 60 * 60 * 4,
    path: `/invoice/${bookingCode}`,
    sameSite: 'lax',
  });

  redirect(`/track/${bookingCode}`);
}

export async function hasTrackAccess(bookingCode: string): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(trackCookieName(bookingCode))?.value === '1';
}
