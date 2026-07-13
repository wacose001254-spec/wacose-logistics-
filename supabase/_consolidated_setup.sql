-- WACOSE Logistics: consolidated schema setup
-- Generated from supabase/migrations/*.sql — paste this whole file into the Supabase SQL Editor and run once.

-- ============================================================
-- 0001_init.sql
-- ============================================================
-- Extensions
create extension if not exists "pgcrypto";

-- Roles enum-ish check is enforced via a text + check constraint so it stays
-- editable without an ALTER TYPE migration if a role is added later.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'dispatcher', 'rider', 'customer')),
  full_name text not null,
  phone text,
  email text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth.users row is created.
-- Role defaults to 'customer'; admins upgrade rider/staff roles manually.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'role', 'customer'),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 0002_vehicles_assignments.sql
-- ============================================================
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null unique,
  type text not null check (type in ('motorbike', 'car', 'van', 'truck')),
  status text not null default 'active' check (status in ('active', 'maintenance', 'retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger vehicles_set_updated_at
  before update on vehicles
  for each row execute procedure public.set_updated_at();

create table rider_vehicle_assignments (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references profiles (id),
  vehicle_id uuid not null references vehicles (id),
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz
);

-- Only one active (unassigned_at is null) assignment per rider or vehicle at a time.
create unique index rider_vehicle_assignments_active_rider
  on rider_vehicle_assignments (rider_id) where unassigned_at is null;
create unique index rider_vehicle_assignments_active_vehicle
  on rider_vehicle_assignments (vehicle_id) where unassigned_at is null;

-- ============================================================
-- 0003_bookings.sql
-- ============================================================
create table guest_contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  created_at timestamptz not null default now()
);

create sequence booking_code_seq;

create table bookings (
  id uuid primary key default gen_random_uuid(),
  booking_code text not null unique
    default ('WAC-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('booking_code_seq')::text, 6, '0')),
  customer_id uuid references profiles (id),
  guest_contact_id uuid references guest_contacts (id),
  -- Denormalized sender contact so every notification/dashboard query avoids
  -- joining out to guest_contacts vs profiles depending on booking type.
  sender_name text not null,
  sender_phone text not null,
  pickup_address text not null,
  pickup_lat numeric,
  pickup_lng numeric,
  dropoff_address text not null,
  dropoff_lat numeric,
  dropoff_lng numeric,
  recipient_name text not null,
  recipient_phone text not null,
  parcel_description text,
  parcel_size text check (parcel_size in ('small', 'medium', 'large')),
  price numeric not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  assigned_rider_id uuid references profiles (id),
  assigned_vehicle_id uuid references vehicles (id),
  qr_code_value text unique,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_customer_or_guest check (
    (customer_id is not null and guest_contact_id is null) or
    (customer_id is null and guest_contact_id is not null)
  )
);

create index bookings_status_idx on bookings (status);
create index bookings_assigned_rider_idx on bookings (assigned_rider_id);
create index bookings_customer_idx on bookings (customer_id);
create index bookings_guest_contact_idx on bookings (guest_contact_id);

create trigger bookings_set_updated_at
  before update on bookings
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- 0004_parcel_events.sql
-- ============================================================
create table parcel_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings (id) on delete cascade,
  event_type text not null check (
    event_type in ('created', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'note')
  ),
  actor_id uuid references profiles (id),
  note text,
  lat numeric,
  lng numeric,
  created_at timestamptz not null default now()
);

create index parcel_events_booking_idx on parcel_events (booking_id, created_at);

-- ============================================================
-- 0005_rider_location_pings.sql
-- ============================================================
create table rider_location_pings (
  id uuid primary key default gen_random_uuid(),
  rider_id uuid not null references profiles (id),
  booking_id uuid references bookings (id),
  lat numeric not null,
  lng numeric not null,
  accuracy_m numeric,
  recorded_at timestamptz not null default now()
);

create index rider_location_pings_booking_idx on rider_location_pings (booking_id, recorded_at);
create index rider_location_pings_rider_idx on rider_location_pings (rider_id, recorded_at);

-- ============================================================
-- 0006_proof_of_delivery.sql
-- ============================================================
create table proof_of_delivery (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  signature_image_path text not null,
  photo_image_path text,
  recipient_name text not null,
  lat numeric,
  lng numeric,
  delivered_at timestamptz not null default now(),
  recorded_by uuid not null references profiles (id)
);

-- ============================================================
-- 0007_invoices.sql
-- ============================================================
create sequence invoice_number_seq;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  invoice_number text not null unique
    default ('INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 6, '0')),
  amount numeric not null,
  status text not null default 'issued' check (status in ('issued', 'paid', 'void')),
  pdf_storage_path text,
  issued_at timestamptz not null default now(),
  paid_at timestamptz
);

create index invoices_status_idx on invoices (status);

-- ============================================================
-- 0008_notification_log.sql
-- ============================================================
create table notification_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete cascade,
  recipient_phone text,
  recipient_email text,
  channel text not null check (channel in ('sms', 'email')),
  template text not null check (
    template in ('booking_confirmed', 'rider_assigned', 'picked_up', 'delivered', 'invoice')
  ),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index notification_log_booking_idx on notification_log (booking_id);
create index notification_log_status_idx on notification_log (status);

-- ============================================================
-- 0009_rls_policies.sql
-- ============================================================
-- Helper: read the caller's role without recursing into profiles' own RLS
-- (security definer functions run with the privileges of their owner, bypassing RLS).
create function public.current_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

create function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce((select role in ('admin', 'dispatcher') from profiles where id = auth.uid()), false);
$$;

alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table rider_vehicle_assignments enable row level security;
alter table guest_contacts enable row level security;
alter table bookings enable row level security;
alter table parcel_events enable row level security;
alter table rider_location_pings enable row level security;
alter table proof_of_delivery enable row level security;
alter table invoices enable row level security;
alter table notification_log enable row level security;

-- profiles: everyone can read their own row; staff can read/update all.
create policy profiles_select_own on profiles for select using (id = auth.uid());
create policy profiles_select_staff on profiles for select using (public.is_staff());
create policy profiles_update_own on profiles for update using (id = auth.uid());
create policy profiles_staff_manage on profiles for all using (public.is_staff());

-- vehicles, rider_vehicle_assignments: staff-only. No client-side guest/customer access needed.
create policy vehicles_staff_all on vehicles for all using (public.is_staff());
create policy rider_vehicle_assignments_staff_all on rider_vehicle_assignments for all using (public.is_staff());
-- riders can see their own current/past assignments.
create policy rider_vehicle_assignments_self_select on rider_vehicle_assignments
  for select using (rider_id = auth.uid());

-- guest_contacts: no direct client access; created/read only via the server-side
-- service-role client (guest bookings and guest tracking lookups are unauthenticated).
create policy guest_contacts_staff_all on guest_contacts for all using (public.is_staff());

-- bookings
create policy bookings_customer_select on bookings for select using (customer_id = auth.uid());
create policy bookings_rider_select on bookings for select using (assigned_rider_id = auth.uid());
create policy bookings_rider_update on bookings for update using (assigned_rider_id = auth.uid());
create policy bookings_staff_all on bookings for all using (public.is_staff());

-- parcel_events
create policy parcel_events_customer_select on parcel_events for select using (
  exists (select 1 from bookings b where b.id = booking_id and b.customer_id = auth.uid())
);
create policy parcel_events_rider_select on parcel_events for select using (
  exists (select 1 from bookings b where b.id = booking_id and b.assigned_rider_id = auth.uid())
);
create policy parcel_events_rider_insert on parcel_events for insert with check (
  exists (select 1 from bookings b where b.id = booking_id and b.assigned_rider_id = auth.uid())
);
create policy parcel_events_staff_all on parcel_events for all using (public.is_staff());

-- rider_location_pings: a rider can insert/select their own pings; staff can read all.
create policy rider_location_pings_self_insert on rider_location_pings
  for insert with check (rider_id = auth.uid());
create policy rider_location_pings_self_select on rider_location_pings
  for select using (rider_id = auth.uid());
create policy rider_location_pings_customer_select on rider_location_pings for select using (
  exists (select 1 from bookings b where b.id = booking_id and b.customer_id = auth.uid())
);
create policy rider_location_pings_staff_all on rider_location_pings for all using (public.is_staff());

-- proof_of_delivery: the assigned rider can insert theirs; customer/staff can read.
create policy pod_rider_insert on proof_of_delivery for insert with check (
  exists (select 1 from bookings b where b.id = booking_id and b.assigned_rider_id = auth.uid())
);
create policy pod_customer_select on proof_of_delivery for select using (
  exists (select 1 from bookings b where b.id = booking_id and b.customer_id = auth.uid())
);
create policy pod_rider_select on proof_of_delivery for select using (recorded_by = auth.uid());
create policy pod_staff_all on proof_of_delivery for all using (public.is_staff());

-- invoices: customer can read their own; staff manage all. Generation happens server-side.
create policy invoices_customer_select on invoices for select using (
  exists (select 1 from bookings b where b.id = booking_id and b.customer_id = auth.uid())
);
create policy invoices_staff_all on invoices for all using (public.is_staff());

-- notification_log: staff-only; sends happen server-side via service role.
create policy notification_log_staff_all on notification_log for all using (public.is_staff());

-- ============================================================
-- 0010_storage_buckets.sql
-- ============================================================
-- Private buckets only. All reads/writes go through the server-side
-- service-role client (see lib/supabase/admin.ts) rather than direct
-- browser access, so no storage.objects RLS policies are needed here —
-- the buckets being non-public already blocks anon/authenticated direct access.
insert into storage.buckets (id, name, public)
values ('proof-of-delivery', 'proof-of-delivery', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- ============================================================
-- 0011_personal_finance.sql
-- ============================================================
-- Personal finance module (Phase 1: core essentials). Strictly owner-scoped —
-- deliberately gated tighter than public.is_staff() (which includes
-- dispatcher) since this is the owner's personal money, not a business
-- operations surface. Balances/spend are computed on read from
-- personal_transactions rather than stored, so there's nothing to drift.

create table personal_accounts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('bank', 'mobile_money', 'savings', 'sacco')),
  institution text,
  opening_balance numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table personal_categories (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('income', 'expense')),
  monthly_budget numeric not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name)
);

create table personal_transactions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  account_id uuid not null references personal_accounts (id) on delete cascade,
  category_id uuid references personal_categories (id) on delete set null,
  type text not null check (type in ('income', 'expense', 'transfer_in', 'transfer_out')),
  amount numeric not null check (amount > 0),
  description text,
  occurred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index personal_transactions_owner_occurred_idx on personal_transactions (owner_id, occurred_at desc);
create index personal_transactions_account_idx on personal_transactions (account_id);

create table personal_salary_transfers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles (id) on delete cascade,
  account_id uuid not null references personal_accounts (id) on delete cascade,
  transaction_id uuid not null references personal_transactions (id) on delete cascade,
  amount numeric not null check (amount > 0),
  note text,
  transferred_at date not null default current_date,
  created_at timestamptz not null default now()
);

create trigger personal_accounts_set_updated_at
  before update on personal_accounts
  for each row execute procedure public.set_updated_at();

create trigger personal_categories_set_updated_at
  before update on personal_categories
  for each row execute procedure public.set_updated_at();

alter table personal_accounts enable row level security;
alter table personal_categories enable row level security;
alter table personal_transactions enable row level security;
alter table personal_salary_transfers enable row level security;

create policy personal_accounts_owner_all on personal_accounts
  for all using (owner_id = auth.uid() and public.current_role() = 'admin');
create policy personal_categories_owner_all on personal_categories
  for all using (owner_id = auth.uid() and public.current_role() = 'admin');
create policy personal_transactions_owner_all on personal_transactions
  for all using (owner_id = auth.uid() and public.current_role() = 'admin');
create policy personal_salary_transfers_owner_all on personal_salary_transfers
  for all using (owner_id = auth.uid() and public.current_role() = 'admin');

