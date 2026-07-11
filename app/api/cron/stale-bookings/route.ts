import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendSms } from '@/lib/notifications/sms';

const STALE_ASSIGNED_HOURS = 2;

// Vercel Cron target — configure in vercel.json with a schedule, e.g. every
// 30 minutes. Protected by CRON_SECRET so it can't be triggered by anyone
// who finds the URL (Vercel Cron sends this header automatically once the
// env var is set).
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const staleSince = new Date(Date.now() - STALE_ASSIGNED_HOURS * 60 * 60 * 1000).toISOString();

  const { data: staleBookings } = await admin
    .from('bookings')
    .select('id, booking_code, updated_at')
    .eq('status', 'assigned')
    .lt('updated_at', staleSince);

  if (staleBookings?.length && process.env.ADMIN_ALERT_PHONE) {
    await sendSms(
      process.env.ADMIN_ALERT_PHONE,
      `WACOSE: ${staleBookings.length} booking(s) assigned but not picked up in ${STALE_ASSIGNED_HOURS}h+: ${staleBookings
        .map((b) => b.booking_code)
        .join(', ')}`
    );
  }

  // Retry SMS sends that failed in the last 24h — a rider/customer's phone
  // being briefly unreachable shouldn't be a permanent silent failure.
  const retrySince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: failedNotifications } = await admin
    .from('notification_log')
    .select('id, recipient_phone, template, booking_id')
    .eq('status', 'failed')
    .eq('channel', 'sms')
    .gte('created_at', retrySince)
    .limit(50);

  // Only templates whose body needs nothing but the booking code are safe to
  // reconstruct here — 'delivered' (needs recipient name) and 'invoice'
  // (needs a fresh signed URL) are left for the next real event to resend,
  // rather than risk resending a message with a literal "undefined" in it.
  const RETRYABLE_TEMPLATES = new Set(['booking_confirmed', 'rider_assigned', 'picked_up']);

  let retried = 0;
  for (const n of failedNotifications ?? []) {
    if (!n.recipient_phone || !n.booking_id || !RETRYABLE_TEMPLATES.has(n.template)) continue;
    const { data: booking } = await admin.from('bookings').select('booking_code').eq('id', n.booking_id).maybeSingle();
    if (!booking) continue;

    const { renderSmsBody } = await import('@/lib/notifications/templates');
    const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL}/track/${booking.booking_code}`;
    const message = renderSmsBody(n.template as Parameters<typeof renderSmsBody>[0], {
      bookingCode: booking.booking_code,
      trackingUrl,
    });
    const result = await sendSms(n.recipient_phone, message);

    await admin
      .from('notification_log')
      .update({
        status: result.ok ? 'sent' : 'failed',
        provider_message_id: result.providerMessageId ?? null,
        error: result.error ?? null,
        sent_at: result.ok ? new Date().toISOString() : null,
      })
      .eq('id', n.id);

    if (result.ok) retried++;
  }

  return NextResponse.json({
    staleBookings: staleBookings?.length ?? 0,
    notificationsRetried: retried,
  });
}
