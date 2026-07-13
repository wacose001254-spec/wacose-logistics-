// Hand-written types matching supabase/migrations/*.sql.
// Once the project is linked to a real Supabase instance, regenerate with:
//   npx supabase gen types typescript --project-id <ref> > lib/supabase/types.ts
// and fold any custom helpers below back in.

import type {
  BookingStatus,
  NotificationTemplate,
  ParcelEventType,
  ParcelSize,
  PersonalAccountType,
  PersonalCategoryKind,
  PersonalTransactionType,
  Role,
  VehicleStatus,
  VehicleType,
} from '@/lib/constants';

// The Supabase client's generics require every table to carry a
// `Relationships` array and the schema to carry `Views`/`Functions` (see
// @supabase/postgrest-js's GenericTable/GenericSchema) — omitting them makes
// every query resolve to `never` instead of a real row type.
type NoRelationships = [];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          full_name: string;
          phone: string | null;
          email: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; role: Role; full_name: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: NoRelationships;
      };
      guest_contacts: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          email: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['guest_contacts']['Row']> & { full_name: string; phone: string };
        Update: Partial<Database['public']['Tables']['guest_contacts']['Row']>;
        Relationships: NoRelationships;
      };
      vehicles: {
        Row: {
          id: string;
          plate_number: string;
          type: VehicleType;
          status: VehicleStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['vehicles']['Row']> & { plate_number: string; type: VehicleType };
        Update: Partial<Database['public']['Tables']['vehicles']['Row']>;
        Relationships: NoRelationships;
      };
      rider_vehicle_assignments: {
        Row: {
          id: string;
          rider_id: string;
          vehicle_id: string;
          assigned_at: string;
          unassigned_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['rider_vehicle_assignments']['Row']> & {
          rider_id: string;
          vehicle_id: string;
        };
        Update: Partial<Database['public']['Tables']['rider_vehicle_assignments']['Row']>;
        Relationships: NoRelationships;
      };
      bookings: {
        Row: {
          id: string;
          booking_code: string;
          customer_id: string | null;
          guest_contact_id: string | null;
          sender_name: string;
          sender_phone: string;
          pickup_address: string;
          pickup_lat: number | null;
          pickup_lng: number | null;
          dropoff_address: string;
          dropoff_lat: number | null;
          dropoff_lng: number | null;
          recipient_name: string;
          recipient_phone: string;
          parcel_description: string | null;
          parcel_size: ParcelSize | null;
          price: number;
          status: BookingStatus;
          assigned_rider_id: string | null;
          assigned_vehicle_id: string | null;
          qr_code_value: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['bookings']['Row']> & {
          sender_name: string;
          sender_phone: string;
          pickup_address: string;
          dropoff_address: string;
          recipient_name: string;
          recipient_phone: string;
        };
        Update: Partial<Database['public']['Tables']['bookings']['Row']>;
        Relationships: NoRelationships;
      };
      parcel_events: {
        Row: {
          id: string;
          booking_id: string;
          event_type: ParcelEventType;
          actor_id: string | null;
          note: string | null;
          lat: number | null;
          lng: number | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['parcel_events']['Row']> & {
          booking_id: string;
          event_type: ParcelEventType;
        };
        Update: Partial<Database['public']['Tables']['parcel_events']['Row']>;
        Relationships: NoRelationships;
      };
      rider_location_pings: {
        Row: {
          id: string;
          rider_id: string;
          booking_id: string | null;
          lat: number;
          lng: number;
          accuracy_m: number | null;
          recorded_at: string;
        };
        Insert: Partial<Database['public']['Tables']['rider_location_pings']['Row']> & {
          rider_id: string;
          lat: number;
          lng: number;
        };
        Update: Partial<Database['public']['Tables']['rider_location_pings']['Row']>;
        Relationships: NoRelationships;
      };
      proof_of_delivery: {
        Row: {
          id: string;
          booking_id: string;
          signature_image_path: string;
          photo_image_path: string | null;
          recipient_name: string;
          lat: number | null;
          lng: number | null;
          delivered_at: string;
          recorded_by: string;
        };
        Insert: Partial<Database['public']['Tables']['proof_of_delivery']['Row']> & {
          booking_id: string;
          signature_image_path: string;
          recipient_name: string;
          recorded_by: string;
        };
        Update: Partial<Database['public']['Tables']['proof_of_delivery']['Row']>;
        Relationships: NoRelationships;
      };
      invoices: {
        Row: {
          id: string;
          booking_id: string;
          invoice_number: string;
          amount: number;
          status: 'issued' | 'paid' | 'void';
          pdf_storage_path: string | null;
          issued_at: string;
          paid_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['invoices']['Row']> & { booking_id: string; amount: number };
        Update: Partial<Database['public']['Tables']['invoices']['Row']>;
        Relationships: NoRelationships;
      };
      notification_log: {
        Row: {
          id: string;
          booking_id: string | null;
          recipient_phone: string | null;
          recipient_email: string | null;
          channel: 'sms' | 'email';
          template: NotificationTemplate;
          status: 'queued' | 'sent' | 'failed';
          provider_message_id: string | null;
          error: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['notification_log']['Row']> & {
          channel: 'sms' | 'email';
          template: NotificationTemplate;
        };
        Update: Partial<Database['public']['Tables']['notification_log']['Row']>;
        Relationships: NoRelationships;
      };
      personal_accounts: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          account_type: PersonalAccountType;
          institution: string | null;
          opening_balance: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['personal_accounts']['Row']> & {
          owner_id: string;
          name: string;
          account_type: PersonalAccountType;
        };
        Update: Partial<Database['public']['Tables']['personal_accounts']['Row']>;
        Relationships: NoRelationships;
      };
      personal_categories: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          kind: PersonalCategoryKind;
          monthly_budget: number;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['personal_categories']['Row']> & {
          owner_id: string;
          name: string;
          kind: PersonalCategoryKind;
        };
        Update: Partial<Database['public']['Tables']['personal_categories']['Row']>;
        Relationships: NoRelationships;
      };
      personal_transactions: {
        Row: {
          id: string;
          owner_id: string;
          account_id: string;
          category_id: string | null;
          type: PersonalTransactionType;
          amount: number;
          description: string | null;
          occurred_at: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['personal_transactions']['Row']> & {
          owner_id: string;
          account_id: string;
          type: PersonalTransactionType;
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['personal_transactions']['Row']>;
        Relationships: NoRelationships;
      };
      personal_salary_transfers: {
        Row: {
          id: string;
          owner_id: string;
          account_id: string;
          transaction_id: string;
          amount: number;
          note: string | null;
          transferred_at: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['personal_salary_transfers']['Row']> & {
          owner_id: string;
          account_id: string;
          transaction_id: string;
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['personal_salary_transfers']['Row']>;
        Relationships: NoRelationships;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
