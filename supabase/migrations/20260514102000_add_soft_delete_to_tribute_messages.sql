alter table if exists public.tribute_messages
  add column if not exists deleted_at timestamptz;

alter table if exists public.tribute_messages
  drop constraint if exists tribute_messages_status_check;

alter table if exists public.tribute_messages
  add constraint tribute_messages_status_check
  check (status in ('pending_unverified', 'pending_verified', 'approved', 'rejected', 'deleted'));

create index if not exists tribute_messages_deleted_idx
  on public.tribute_messages (status, deleted_at);
