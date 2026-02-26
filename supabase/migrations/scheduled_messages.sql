-- Scheduled Messages table: tracks Twilio SendAt messages for cancellation/rescheduling
create table if not exists scheduled_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  hunt_id uuid not null,
  notification_type text not null, -- 'hunt_reminder_60m', 'hunt_starting'
  twilio_message_sid text not null,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled', -- 'scheduled', 'cancelled'
  created_at timestamptz default now(),
  unique(user_id, hunt_id, notification_type)
);

-- RLS: only service role can access (no client access needed)
alter table scheduled_messages enable row level security;

-- Index for fast lookups by hunt
create index if not exists idx_scheduled_messages_hunt_id on scheduled_messages(hunt_id);
create index if not exists idx_scheduled_messages_user_hunt on scheduled_messages(user_id, hunt_id);
