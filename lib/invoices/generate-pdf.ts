import 'server-only';
import { renderToBuffer } from '@react-pdf/renderer';
import { createAdminClient } from '@/lib/supabase/admin';
import { InvoiceDocument, type InvoiceData } from './InvoiceDocument';

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export interface GenerateInvoiceResult {
  ok: boolean;
  invoiceUrl?: string;
  error?: string;
}

// Idempotent: safe to call again for the same booking (e.g. a retried
// delivery-completion request) — returns the existing invoice's link
// instead of creating a duplicate.
export async function generateInvoiceForBooking(bookingId: string): Promise<GenerateInvoiceResult> {
  const admin = createAdminClient();

  const { data: existing } = await admin.from('invoices').select('id').eq('booking_id', bookingId).maybeSingle();
  if (existing) {
    return buildAppInvoiceUrl(bookingId, admin);
  }

  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .select('booking_code, sender_name, recipient_name, pickup_address, dropoff_address, parcel_description, price')
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    return { ok: false, error: 'Booking not found' };
  }

  const { data: invoice, error: invoiceError } = await admin
    .from('invoices')
    .insert({ booking_id: bookingId, amount: booking.price, status: 'issued' })
    .select('id, invoice_number, issued_at')
    .single();

  if (invoiceError || !invoice) {
    return { ok: false, error: 'Could not create invoice record' };
  }

  const invoiceData: InvoiceData = {
    invoiceNumber: invoice.invoice_number,
    issuedAt: invoice.issued_at,
    bookingCode: booking.booking_code,
    senderName: booking.sender_name,
    recipientName: booking.recipient_name,
    pickupAddress: booking.pickup_address,
    dropoffAddress: booking.dropoff_address,
    parcelDescription: booking.parcel_description,
    amount: booking.price,
  };

  const pdfBuffer = await renderToBuffer(InvoiceDocument({ data: invoiceData }));
  const pdfPath = `${bookingId}/invoice.pdf`;

  const { error: uploadError } = await admin.storage
    .from('invoices')
    .upload(pdfPath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

  if (uploadError) {
    return { ok: false, error: 'Could not upload invoice PDF' };
  }

  await admin.from('invoices').update({ pdf_storage_path: pdfPath }).eq('id', invoice.id);

  return buildAppInvoiceUrl(bookingId, admin);
}

async function buildAppInvoiceUrl(bookingId: string, admin: ReturnType<typeof createAdminClient>): Promise<GenerateInvoiceResult> {
  const { data: booking } = await admin.from('bookings').select('booking_code').eq('id', bookingId).single();
  if (!booking) return { ok: false, error: 'Booking not found' };
  return { ok: true, invoiceUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${booking.booking_code}` };
}

// Returns a fresh short-lived signed URL for the actual PDF file — called
// from the invoice view page at request time rather than baked into an SMS,
// so the link never goes stale before the customer clicks the app link.
export async function getInvoiceSignedUrl(bookingId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: invoice } = await admin
    .from('invoices')
    .select('pdf_storage_path')
    .eq('booking_id', bookingId)
    .maybeSingle();

  if (!invoice?.pdf_storage_path) return null;

  const { data, error } = await admin.storage
    .from('invoices')
    .createSignedUrl(invoice.pdf_storage_path, SIGNED_URL_TTL_SECONDS);

  return error ? null : data.signedUrl;
}
