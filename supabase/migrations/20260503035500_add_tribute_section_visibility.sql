alter table if exists public.tributes
  add column if not exists show_gallery_section boolean not null default true,
  add column if not exists show_video_section boolean not null default true,
  add column if not exists show_livestream_section boolean not null default true;
