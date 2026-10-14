alter table public.profiles
  add column avatar_variant smallint not null default 0
  check (avatar_variant between 0 and 5);
