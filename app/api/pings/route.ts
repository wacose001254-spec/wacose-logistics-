import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.lat !== 'number' || typeof body.lng !== 'number') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { error } = await supabase.from('rider_location_pings').insert({
    rider_id: user.id,
    booking_id: body.bookingId ?? null,
    lat: body.lat,
    lng: body.lng,
    accuracy_m: typeof body.accuracy === 'number' ? body.accuracy : null,
    recorded_at: body.recordedAt ?? new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
