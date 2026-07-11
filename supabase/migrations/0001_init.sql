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
