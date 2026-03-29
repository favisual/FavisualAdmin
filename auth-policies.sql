drop policy if exists "Public write categories" on public.categories;
drop policy if exists "Authenticated write categories" on public.categories;
create policy "Authenticated write categories"
on public.categories
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public write media_items" on public.media_items;
drop policy if exists "Authenticated write media_items" on public.media_items;
create policy "Authenticated write media_items"
on public.media_items
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public write packages" on public.packages;
drop policy if exists "Authenticated write packages" on public.packages;
create policy "Authenticated write packages"
on public.packages
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public write contact_settings" on public.contact_settings;
drop policy if exists "Authenticated write contact_settings" on public.contact_settings;
create policy "Authenticated write contact_settings"
on public.contact_settings
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Public write storage media" on storage.objects;
drop policy if exists "Authenticated write storage media" on storage.objects;
create policy "Authenticated write storage media"
on storage.objects
for all
to authenticated
using (bucket_id = 'media')
with check (bucket_id = 'media');
