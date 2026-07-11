import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasTrackAccess } from '@/lib/booking/track-access-action';

// Guest bookings have no Supabase Auth session, so RLS-gated Realtime
// subscriptions aren't reachable from the browser for them. Instead this
// route (itself gated by the phone-verified tracking cookie) polls on the
// client's behalf via the admin client — simple, and keeps the privacy check
// server-side where the cookie actually lives.
export async function GET(_request: Request, { params }: { params: Promise<{ bookingCode: string }> }) {
  const { bookingCode } = await params;

  if (!(await hasTrackAccess(bookingCode))) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng')
    .eq('booking_code', bookingCode)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: latestPing } = await admin
    .from('rider_location_pings')
    .select('lat, lng, recorded_at')
    .eq('booking_id', booking.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: events } = await admin
    .from('parcel_events')
    .select('event_type, note, created_at')
    .eq('booking_id', booking.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({
    status: booking.status,
    pickup: booking.pickup_lat && booking.pickup_lng ? { lat: booking.pickup_lat, lng: booking.pickup_lng } : null,
    dropoff: booking.dropoff_lat && booking.dropoff_lng ? { lat: booking.dropoff_lat, lng: booking.dropoff_lng } : null,
    riderPosition: latestPing ? { lat: latestPing.lat, lng: latestPing.lng, recordedAt: latestPing.recorded_at } : null,
    events: events ?? [],
  });
}
