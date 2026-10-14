alter table public.notices
  add column image_paths text[] not null default '{}'::text[]
  check (cardinality(image_paths) <= 3);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'notice-images',
  'notice-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can upload notice images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'notice-images'
  and (storage.foldername(name))[1] = 'notices'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Admins can delete notice images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'notice-images'
  and (storage.foldername(name))[1] = 'notices'
  and ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'admin'
);
