create table if not exists public.family_private_messages (
  id uuid primary key default gen_random_uuid(),
  tribute_slug text not null,
  recipient_email text not null,
  sender_name text not null,
  sender_email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists family_private_messages_slug_created_idx
  on public.family_private_messages (tribute_slug, created_at desc);
