create table notification_log (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings (id) on delete cascade,
  recipient_phone text,
  recipient_email text,
  channel text not null check (channel in ('sms', 'email')),
  template text not null check (
    template in ('booking_confirmed', 'rider_assigned', 'picked_up', 'delivered', 'invoice')
  ),
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  provider_message_id text,
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index notification_log_booking_idx on notification_log (booking_id);
create index notification_log_status_idx on notification_log (status);
