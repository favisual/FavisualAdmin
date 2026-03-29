create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  cover_url text,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  src text not null,
  thumbnail text,
  title text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists media_items_category_id_idx
  on public.media_items(category_id);

alter table public.categories enable row level security;
alter table public.media_items enable row level security;

drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories"
on public.categories
for select
to public
using (true);

drop policy if exists "Public write categories" on public.categories;
create policy "Public write categories"
on public.categories
for all
to public
using (true)
with check (true);

drop policy if exists "Public read media_items" on public.media_items;
create policy "Public read media_items"
on public.media_items
for select
to public
using (true);

drop policy if exists "Public write media_items" on public.media_items;
create policy "Public write media_items"
on public.media_items
for all
to public
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "Public read storage media" on storage.objects;
create policy "Public read storage media"
on storage.objects
for select
to public
using (bucket_id = 'media');

drop policy if exists "Public write storage media" on storage.objects;
create policy "Public write storage media"
on storage.objects
for all
to public
using (bucket_id = 'media')
with check (bucket_id = 'media');
