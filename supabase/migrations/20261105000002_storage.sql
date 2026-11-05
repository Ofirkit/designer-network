-- Storage bucket for profile photos and case study images.
-- Path layout: {designer_id}/...   Private bucket; the app serves signed URLs.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'designer-media',
  'designer-media',
  false,
  5242880, -- 5 MB per file
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do nothing;

-- The first folder in the path must be a designers.id the user owns.
-- Non-UUID folder names are rejected instead of raising a cast error.
create or replace function public.owns_media_path(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  folder text := split_part(object_name, '/', 1);
begin
  if folder !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.owns_designer(folder::uuid);
end;
$$;

revoke all on function public.owns_media_path(text) from public;
grant execute on function public.owns_media_path(text) to authenticated;

create policy "designer-media: owner reads"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'designer-media'
    and (select public.owns_media_path(name))
  );

create policy "designer-media: owner uploads"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'designer-media'
    and (select public.owns_media_path(name))
  );

create policy "designer-media: owner updates"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'designer-media'
    and (select public.owns_media_path(name))
  )
  with check (
    bucket_id = 'designer-media'
    and (select public.owns_media_path(name))
  );

create policy "designer-media: owner deletes"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'designer-media'
    and (select public.owns_media_path(name))
  );

create policy "designer-media: admin reads"
  on storage.objects for select to authenticated
  using (bucket_id = 'designer-media' and (select public.is_admin()));

-- Account deletion removes every object under {designer_id}/ from server
-- code (service role) before deleting the designers row.
