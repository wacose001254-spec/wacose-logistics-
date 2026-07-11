import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendSms } from './sms';
import { renderSmsBody } from './templates';
import type { NotificationTemplate } from '@/lib/constants';

interface NotifyParams {
  bookingId: string;
  recipientPhone: string;
  template: NotificationTemplate;
  context: {
    bookingCode: string;
    recipientName?: string;
    riderName?: string;
    invoiceUrl?: string;
    trackingUrl?: string;
  };
}

// Fire-and-log: every send attempt (success or failure) is recorded in
// notification_log so a stale/failed send is visible to admins and retryable
// by the cron job, rather than silently disappearing.
export async function notifyBookingSms({ bookingId, recipientPhone, template, context }: NotifyParams) {
  const admin = createAdminClient();
  const message = renderSmsBody(template, context);

  const { data: logRow } = await admin
    .from('notification_log')
    .insert({
      booking_id: bookingId,
      recipient_phone: recipientPhone,
      channel: 'sms',
      template,
      status: 'queued',
    })
    .select('id')
    .single();

  const result = await sendSms(recipientPhone, message);

  if (logRow) {
    await admin
      .from('notification_log')
      .update({
        status: result.ok ? 'sent' : 'failed',
        provider_message_id: result.providerMessageId ?? null,
        error: result.error ?? null,
        sent_at: result.ok ? new Date().toISOString() : null,
      })
      .eq('id', logRow.id);
  }

  return result;
}
