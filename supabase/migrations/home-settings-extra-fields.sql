begin;

alter table public.contact_settings
add column if not exists hero_secondary_cta_label text,
add column if not exists hero_secondary_cta_href text,
add column if not exists home_categories_title text;

update public.contact_settings
set
  hero_secondary_cta_label = coalesce(hero_secondary_cta_label, 'Ver categorias'),
  hero_secondary_cta_href = coalesce(hero_secondary_cta_href, '/categories'),
  home_categories_title = coalesce(home_categories_title, 'Explora el trabajo por linea visual');

comment on column public.contact_settings.hero_secondary_cta_label
is 'Texto del segundo boton del hero del home.';

comment on column public.contact_settings.hero_secondary_cta_href
is 'Enlace del segundo boton del hero del home.';

comment on column public.contact_settings.home_categories_title
is 'Titulo principal de la seccion de categorias en el home.';

commit;
