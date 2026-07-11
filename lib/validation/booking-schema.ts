import { z } from 'zod';
import { PARCEL_SIZES } from '@/lib/constants';

export const bookingSchema = z.object({
  senderName: z.string().min(2, 'Enter your name'),
  senderPhone: z.string().min(9, 'Enter a valid phone number'),
  pickupAddress: z.string().min(5, 'Enter a pickup address'),
  dropoffAddress: z.string().min(5, 'Enter a drop-off address'),
  recipientName: z.string().min(2, "Enter the recipient's name"),
  recipientPhone: z.string().min(9, 'Enter a valid phone number'),
  parcelDescription: z.string().max(500).optional(),
  parcelSize: z.enum(PARCEL_SIZES),
});

export type BookingInput = z.infer<typeof bookingSchema>;

// Flat-tier pricing for Phase 1 — no distance-based calculation yet.
// Amounts are in KES (Kenyan Shilling), sized for intra-Nairobi courier trips.
export const PARCEL_SIZE_PRICE: Record<(typeof PARCEL_SIZES)[number], number> = {
  small: 300,
  medium: 600,
  large: 1200,
};
