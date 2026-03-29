create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  theme text not null default 'cyan',
  is_featured boolean not null default false,
  features text[] not null default '{}',
  price_individual text,
  price_plan text,
  price_unico text,
  button_text text not null default 'Comencemos',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.packages enable row level security;

drop policy if exists "Public read packages" on public.packages;
create policy "Public read packages"
on public.packages
for select
to public
using (true);
