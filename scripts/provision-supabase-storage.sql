-- Run once against the Trainrr Supabase project.
-- Application uploads use the service-role key and are still authorized by API routes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'trainrr-avatars',
    'trainrr-avatars',
    true,
    2097152,
    array['image/jpeg']
  ),
  (
    'trainrr-certifications',
    'trainrr-certifications',
    false,
    2097152,
    array['application/pdf', 'image/png', 'image/jpeg']
  )
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
