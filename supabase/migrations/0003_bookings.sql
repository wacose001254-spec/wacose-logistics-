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
