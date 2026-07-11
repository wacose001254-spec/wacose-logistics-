import { notFound, redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { hasTrackAccess } from '@/lib/booking/track-access-action';
import { TrackingView } from '@/components/tracking/TrackingView';

export default async function TrackBookingPage({ params }: { params: Promise<{ bookingCode: string }> }) {
  const { bookingCode } = await params;

  if (!(await hasTrackAccess(bookingCode))) {
    redirect(`/track?code=${encodeURIComponent(bookingCode)}`);
  }

  const admin = createAdminClient();
  const { data: booking } = await admin
    .from('bookings')
    .select('id, status, pickup_lat, pickup_lng, dropoff_lat, dropoff_lng')
    .eq('booking_code', bookingCode)
    .maybeSingle();

  if (!booking) notFound();

  const { data: latestPing } = await admin
    .from('rider_location_pings')
    .select('lat, lng')
    .eq('booking_id', booking.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: events } = await admin
    .from('parcel_events')
    .select('event_type, note, created_at')
    .eq('booking_id', booking.id)
    .order('created_at', { ascending: true });

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <TrackingView
        bookingCode={bookingCode}
        initialData={{
          status: booking.status,
          pickup: booking.pickup_lat && booking.pickup_lng ? { lat: booking.pickup_lat, lng: booking.pickup_lng } : null,
          dropoff:
            booking.dropoff_lat && booking.dropoff_lng ? { lat: booking.dropoff_lat, lng: booking.dropoff_lng } : null,
          riderPosition: latestPing ? { lat: latestPing.lat, lng: latestPing.lng } : null,
          events: events ?? [],
        }}
      />
    </div>
  );
}
