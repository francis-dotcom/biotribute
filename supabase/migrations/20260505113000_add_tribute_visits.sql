create table if not exists public.tribute_visits (
  id bigint generated always as identity primary key,
  tribute_slug text not null,
  path text not null,
  visitor_hash text not null,
  ip_hash text not null,
  referer text,
  created_at timestamptz not null default now()
);

create index if not exists tribute_visits_slug_created_idx
  on public.tribute_visits (tribute_slug, created_at desc);

create index if not exists tribute_visits_slug_visitor_idx
  on public.tribute_visits (tribute_slug, visitor_hash);

revoke all on public.tribute_visits from anon, authenticated;
grant select, insert on public.tribute_visits to service_role;
grant usage, select on sequence public.tribute_visits_id_seq to service_role;
