-- Seed data for local/dev use.
-- Create your first admin user via the Supabase Auth dashboard (or `supabase auth` CLI) first,
-- then promote it here using the real user id from auth.users:
--
--   update profiles set role = 'admin' where id = '00000000-0000-0000-0000-000000000000';

insert into vehicles (plate_number, type, status) values
  ('KDA 123A', 'motorbike', 'active'),
  ('KDB 456B', 'van', 'active')
on conflict (plate_number) do nothing;
