create table if not exists public.tribute_visit_page_sessions (
  id bigint generated always as identity primary key,
  tribute_slug text not null,
  session_id text not null,
  path text not null,
  visitor_hash text not null,
  referer text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  estimated_duration_seconds integer not null default 0,
  heartbeat_count integer not null default 0,
  updated_at timestamptz not null default now()
);

create unique index if not exists tribute_visit_page_sessions_unique_idx
  on public.tribute_visit_page_sessions (tribute_slug, session_id, path);

create index if not exists tribute_visit_page_sessions_slug_updated_idx
  on public.tribute_visit_page_sessions (tribute_slug, updated_at desc);

create index if not exists tribute_visit_page_sessions_slug_visitor_idx
  on public.tribute_visit_page_sessions (tribute_slug, visitor_hash);

revoke all on public.tribute_visit_page_sessions from anon, authenticated;
grant select, insert, update on public.tribute_visit_page_sessions to service_role;
grant usage, select on sequence public.tribute_visit_page_sessions_id_seq to service_role;
