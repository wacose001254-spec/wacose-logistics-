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
