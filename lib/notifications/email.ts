import 'server-only';
import { Resend } from 'resend';

export interface SendEmailResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: { filename: string; content: Buffer }[]
): Promise<SendEmailResult> {
  // Email is an optional Phase 1 channel — skip quietly if not configured
  // rather than failing the whole notification flow.
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, error: 'Email not configured (RESEND_API_KEY missing)' };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'WACOSE <notifications@wacose.example.com>',
      to,
      subject,
      html,
      attachments,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, providerMessageId: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Email send failed' };
  }
}
