begin;

alter table public.contact_settings
  add column if not exists photo_url text;

update public.contact_settings
set photo_url = coalesce(photo_url, '');

comment on column public.contact_settings.photo_url
is 'Foto circular de perfil para la tarjeta de contacto del sitio.';

commit;
