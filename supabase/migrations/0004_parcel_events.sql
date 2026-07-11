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
