create table if not exists public.tribute_video_opens (
  id bigint generated always as identity primary key,
  tribute_slug text not null,
  video_index integer not null,
  session_id text not null,
  visitor_hash text not null,
  path text not null,
  referer text,
  created_at timestamptz not null default now()
);

create index if not exists tribute_video_opens_slug_created_idx
  on public.tribute_video_opens (tribute_slug, created_at desc);

create index if not exists tribute_video_opens_slug_video_idx
  on public.tribute_video_opens (tribute_slug, video_index, created_at desc);

create index if not exists tribute_video_opens_slug_visitor_idx
  on public.tribute_video_opens (tribute_slug, video_index, visitor_hash);

revoke all on public.tribute_video_opens from anon, authenticated;
grant select, insert on public.tribute_video_opens to service_role;
grant usage, select on sequence public.tribute_video_opens_id_seq to service_role;
