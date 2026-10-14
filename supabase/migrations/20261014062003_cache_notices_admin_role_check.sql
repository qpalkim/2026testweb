drop policy "Admins can create notices" on public.notices;
drop policy "Admins can update notices" on public.notices;
drop policy "Admins can delete notices" on public.notices;

create policy "Admins can create notices"
  on public.notices
  for insert
  to authenticated
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can update notices"
  on public.notices
  for update
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin')
  with check (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins can delete notices"
  on public.notices
  for delete
  to authenticated
  using (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin');
