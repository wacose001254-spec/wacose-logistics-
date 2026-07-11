import type { NotificationTemplate } from '@/lib/constants';

interface TemplateContext {
  bookingCode: string;
  recipientName?: string;
  riderName?: string;
  invoiceUrl?: string;
  trackingUrl?: string;
}

export function renderSmsBody(template: NotificationTemplate, ctx: TemplateContext): string {
  switch (template) {
    case 'booking_confirmed':
      return `WACOSE: Booking ${ctx.bookingCode} confirmed. Track it: ${ctx.trackingUrl}`;
    case 'rider_assigned':
      return `WACOSE: A rider${ctx.riderName ? ` (${ctx.riderName})` : ''} has been assigned to booking ${ctx.bookingCode}.`;
    case 'picked_up':
      return `WACOSE: Your parcel for booking ${ctx.bookingCode} has been picked up and is on its way.`;
    case 'delivered':
      return `WACOSE: Booking ${ctx.bookingCode} was delivered${ctx.recipientName ? ` to ${ctx.recipientName}` : ''}. Thank you!`;
    case 'invoice':
      return `WACOSE: Invoice for booking ${ctx.bookingCode} is ready: ${ctx.invoiceUrl}`;
  }
}
