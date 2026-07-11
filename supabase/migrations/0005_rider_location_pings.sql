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
