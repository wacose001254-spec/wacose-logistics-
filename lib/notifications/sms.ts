import 'server-only';

const TERMII_API_URL = 'https://api.ng.termii.com/api/sms/send';

export interface SendSmsResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

interface TermiiSuccessResponse {
  message_id: string;
  message: string;
  balance: number;
  user: string;
}

interface TermiiErrorResponse {
  code?: string;
  message?: string;
}

// Termii was chosen over Africa's Talking because it also offers WhatsApp
// Business messaging under the same account/API — once Meta Business
// verification is complete (a multi-day process independent of this code),
// a sendWhatsApp() function can be added alongside this one following the
// same shape, reusing TERMII_API_KEY.
export async function sendSms(toPhone: string, message: string): Promise<SendSmsResult> {
  if (!process.env.TERMII_API_KEY) {
    return { ok: false, error: 'SMS not configured (TERMII_API_KEY missing)' };
  }

  try {
    const response = await fetch(TERMII_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: toPhone,
        from: process.env.TERMII_SENDER_ID || 'N-Alert',
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: process.env.TERMII_API_KEY,
      }),
    });

    const body: TermiiSuccessResponse | TermiiErrorResponse = await response.json();

    if (!response.ok || !('message_id' in body)) {
      const errorBody = body as TermiiErrorResponse;
      return { ok: false, error: errorBody.message || `Termii request failed (${response.status})` };
    }

    return { ok: true, providerMessageId: body.message_id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SMS send failed' };
  }
}
