import 'server-only';
import AfricasTalking from 'africastalking';

let client: ReturnType<typeof AfricasTalking> | null = null;

function getClient() {
  if (!client) {
    client = AfricasTalking({
      apiKey: process.env.AFRICASTALKING_API_KEY!,
      username: process.env.AFRICASTALKING_USERNAME!,
    });
  }
  return client;
}

export interface SendSmsResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export async function sendSms(toPhone: string, message: string): Promise<SendSmsResult> {
  try {
    const response = await getClient().SMS.send({
      to: [toPhone],
      message,
      from: process.env.AFRICASTALKING_SENDER_ID || undefined,
    });

    const recipient = response.SMSMessageData.Recipients[0];
    if (!recipient || !recipient.status.toLowerCase().startsWith('success')) {
      return { ok: false, error: recipient?.status ?? 'Unknown SMS provider error' };
    }

    return { ok: true, providerMessageId: recipient.messageId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'SMS send failed' };
  }
}
