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
