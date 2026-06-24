alter table public.tributes
  add column if not exists owner_user_id uuid references auth.users(id);

create index if not exists tributes_owner_user_id_idx
  on public.tributes (owner_user_id);
