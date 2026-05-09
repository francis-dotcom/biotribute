alter table public.tributes
  drop constraint if exists tributes_theme_check;

alter table public.tributes
  add constraint tributes_theme_check
  check (theme in ('ivory', 'sage', 'sky', 'amethyst'));
