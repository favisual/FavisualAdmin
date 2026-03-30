create table if not exists public.contact_settings (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Contacto',
  intro text,
  email text,
  phone text,
  whatsapp text,
  instagram text,
  facebook text,
  cta_label text not null default 'Escribenos',
  created_at timestamptz not null default now()
);

alter table public.contact_settings enable row level security;

drop policy if exists "Public read contact_settings" on public.contact_settings;
create policy "Public read contact_settings"
on public.contact_settings
for select
to public
using (true);
