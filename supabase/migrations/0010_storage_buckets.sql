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
