export const ROLES = ['admin', 'dispatcher', 'rider', 'customer'] as const;
export type Role = (typeof ROLES)[number];

export const BOOKING_STATUSES = [
  'pending',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PARCEL_SIZES = ['small', 'medium', 'large'] as const;
export type ParcelSize = (typeof PARCEL_SIZES)[number];

export const PARCEL_EVENT_TYPES = [
  'created',
  'assigned',
  'picked_up',
  'in_transit',
  'delivered',
  'cancelled',
  'note',
] as const;
export type ParcelEventType = (typeof PARCEL_EVENT_TYPES)[number];

export const NOTIFICATION_TEMPLATES = [
  'booking_confirmed',
  'rider_assigned',
  'picked_up',
  'delivered',
  'invoice',
] as const;
export type NotificationTemplate = (typeof NOTIFICATION_TEMPLATES)[number];

export const VEHICLE_TYPES = ['motorbike', 'car', 'van', 'truck'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_STATUSES = ['active', 'maintenance', 'retired'] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const RIDER_PING_INTERVAL_MS = 20_000;
