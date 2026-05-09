create extension if not exists pgcrypto;

create table if not exists public.tributes (
  slug text primary key,
  name text not null,
  years text not null,
  tagline text not null,
  organizer text not null,
  theme text not null check (
    theme in (
      'ivory',
      'sage',
      'sky',
      'amethyst',
      'midnight',
      'candlelight',
      'rose-quartz',
      'pearl-coast',
      'evergreen',
      'harvest',
      'charcoal'
    )
  ),
  hero_image_url text,
  background_image_url text,
  gallery_note text not null default '',
  life_story text not null default '',
  support_note text,
  video_urls text,
  video_note text,
  livestream_url text,
  livestream_note text,
  show_gallery_section boolean not null default true,
  show_video_section boolean not null default true,
  show_livestream_section boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tribute_timeline_entries (
  id uuid primary key default gen_random_uuid(),
  tribute_slug text not null references public.tributes(slug) on delete cascade,
  sort_order integer not null default 0,
  year text not null,
  title text not null,
  copy text not null
);

create table if not exists public.tribute_contributors (
  id uuid primary key default gen_random_uuid(),
  tribute_slug text not null references public.tributes(slug) on delete cascade,
  sort_order integer not null default 0,
  label text not null,
  name text not null,
  copy text not null
);

create table if not exists public.tribute_support_amounts (
  id uuid primary key default gen_random_uuid(),
  tribute_slug text not null references public.tributes(slug) on delete cascade,
  sort_order integer not null default 0,
  label text not null,
  featured boolean not null default false
);

create index if not exists tribute_timeline_entries_slug_order_idx
  on public.tribute_timeline_entries (tribute_slug, sort_order);

create index if not exists tribute_contributors_slug_order_idx
  on public.tribute_contributors (tribute_slug, sort_order);

create index if not exists tribute_support_amounts_slug_order_idx
  on public.tribute_support_amounts (tribute_slug, sort_order);
