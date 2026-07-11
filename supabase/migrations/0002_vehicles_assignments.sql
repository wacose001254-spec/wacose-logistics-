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
