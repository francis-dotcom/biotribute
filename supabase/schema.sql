create extension if not exists pgcrypto;

create table if not exists public.tribute_messages (
  id uuid primary key default gen_random_uuid(),
  tribute_slug text not null,
  author text not null,
  email text not null,
  placement text not null check (placement in ('feed', 'timeline')),
  message text not null,
  excerpt text not null,
  status text not null default 'pending_unverified' check (status in ('pending_unverified', 'pending_verified', 'approved', 'rejected', 'deleted')),
  email_verified boolean not null default false,
  verification_token text,
  verified_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tribute_messages_slug_status_created_idx
  on public.tribute_messages (tribute_slug, status, created_at desc);

create index if not exists tribute_messages_deleted_idx
  on public.tribute_messages (status, deleted_at);
