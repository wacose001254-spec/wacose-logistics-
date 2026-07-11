create sequence invoice_number_seq;

create table invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings (id) on delete cascade,
  invoice_number text not null unique
    default ('INV-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('invoice_number_seq')::text, 6, '0')),
  amount numeric not null,
  status text not null default 'issued' check (status in ('issued', 'paid', 'void')),
  pdf_storage_path text,
  issued_at timestamptz not null default now(),
  paid_at timestamptz
);

create index invoices_status_idx on invoices (status);
