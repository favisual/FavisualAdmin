alter table public.contact_settings
  add column if not exists hero_title text not null default 'Agenda tu sesion de contenido',
  add column if not exists hero_cta_label text not null default 'Ahora',
  add column if not exists hero_cta_href text not null default '/contacto',
  add column if not exists hero_media_type text not null default 'sequence',
  add column if not exists hero_image_url text,
  add column if not exists hero_image_urls text[] not null default '{}',
  add column if not exists hero_video_url text,
  add column if not exists home_parallax_title text not null default 'Captura momentos inolvidables',
  add column if not exists home_parallax_intro text,
  add column if not exists home_parallax_cta_label text not null default 'Reserva tu sesion',
  add column if not exists home_parallax_cta_href text not null default '/contacto',
  add column if not exists home_parallax_image_url text;

alter table public.contact_settings
  drop constraint if exists contact_settings_hero_media_type_check;

alter table public.contact_settings
  add constraint contact_settings_hero_media_type_check
  check (hero_media_type in ('image', 'sequence', 'video'));
