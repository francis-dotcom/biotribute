alter table if exists public.tributes
  add column if not exists video_urls text,
  add column if not exists video_note text,
  add column if not exists livestream_url text,
  add column if not exists livestream_note text;
