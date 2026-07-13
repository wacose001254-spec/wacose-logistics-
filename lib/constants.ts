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

export const PERSONAL_ACCOUNT_TYPES = ['bank', 'mobile_money', 'savings', 'sacco'] as const;
export type PersonalAccountType = (typeof PERSONAL_ACCOUNT_TYPES)[number];

export const PERSONAL_TRANSACTION_TYPES = ['income', 'expense', 'transfer_in', 'transfer_out'] as const;
export type PersonalTransactionType = (typeof PERSONAL_TRANSACTION_TYPES)[number];

export const PERSONAL_CATEGORY_KINDS = ['income', 'expense'] as const;
export type PersonalCategoryKind = (typeof PERSONAL_CATEGORY_KINDS)[number];

// Seeded once per owner (lazily, on first budget-page visit) — see
// lib/personal-finance/categories-actions.ts. "Salary" is the income side of
// every salary/owner's-draw transfer; the rest are expense categories a
// courier-business owner in Nairobi is likely to track month to month.
export const DEFAULT_INCOME_CATEGORIES = ['Salary'] as const;

export const DEFAULT_EXPENSE_CATEGORIES = [
  'Housing',
  'Food',
  'Transport',
  'Fuel',
  'Motorcycle',
  'Insurance',
  'Medical',
  'Giving',
  'Church',
  'Family Support',
  'Shopping',
  'Entertainment',
  'Subscriptions',
  'Education',
  'Clothing',
  'Haircuts',
  'Travel',
  'Emergency',
  'Debt Payments',
  'Savings',
  'Investments',
  'Miscellaneous',
] as const;
