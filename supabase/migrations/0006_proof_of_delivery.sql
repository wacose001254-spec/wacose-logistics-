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
