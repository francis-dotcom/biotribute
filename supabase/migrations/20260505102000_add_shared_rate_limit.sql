create table if not exists public.rate_limit_events (
  id bigint generated always as identity primary key,
  scope text not null,
  key_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_events_scope_key_created_idx
  on public.rate_limit_events (scope, key_hash, created_at desc);

revoke all on public.rate_limit_events from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_scope text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns table (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  recent_count integer;
  oldest_recent timestamptz;
  retry_seconds integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration.';
  end if;

  delete from public.rate_limit_events
  where created_at < now() - interval '1 day';

  select count(*), min(created_at)
  into recent_count, oldest_recent
  from public.rate_limit_events
  where scope = p_scope
    and key_hash = p_key_hash
    and created_at >= now() - make_interval(secs => p_window_seconds);

  if recent_count >= p_limit then
    retry_seconds := greatest(
      1,
      ceil(
        extract(
          epoch from ((oldest_recent + make_interval(secs => p_window_seconds)) - now())
        )
      )::integer
    );

    return query
    select false, 0, retry_seconds;
    return;
  end if;

  insert into public.rate_limit_events (scope, key_hash)
  values (p_scope, p_key_hash);

  return query
  select true, greatest(0, p_limit - recent_count - 1), p_window_seconds;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
