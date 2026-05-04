create table if not exists public.tribute_gallery_items (
  id uuid primary key default gen_random_uuid(),
  tribute_slug text not null references public.tributes(slug) on delete cascade,
  sort_order integer not null default 0,
  image_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists tribute_gallery_items_slug_order_idx
  on public.tribute_gallery_items (tribute_slug, sort_order);
