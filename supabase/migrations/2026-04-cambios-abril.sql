begin;

alter table public.packages
  add column if not exists price_plan_label text not null default 'Precio plan mensual',
  add column if not exists price_plan_note text not null default 'Ideal para marcas que quieren mantener una imagen constante y profesional.';

update public.packages
set
  price_plan_label = coalesce(price_plan_label, 'Precio plan mensual'),
  price_plan_note = coalesce(
    price_plan_note,
    'Ideal para marcas que quieren mantener una imagen constante y profesional.'
  );

alter table public.contact_settings
  add column if not exists brand_logos_title text not null default 'Marcas con las que he trabajado',
  add column if not exists brand_logos_intro text not null default 'Logos de marcas, clientes o proyectos que puedes destacar como referencia visual.',
  add column if not exists brand_logos_urls text[] not null default '{}',
  add column if not exists package_cta_title text not null default 'Arma tu paquete conmigo',
  add column if not exists package_cta_intro text not null default 'Creamos una propuesta visual a tu medida para que tu marca mantenga una imagen clara, elegante y coherente.',
  add column if not exists package_cta_cta_label text not null default 'Quiero mi paquete',
  add column if not exists package_cta_cta_href text not null default '/contacto';

update public.contact_settings
set
  brand_logos_title = coalesce(brand_logos_title, 'Marcas con las que he trabajado'),
  brand_logos_intro = coalesce(
    brand_logos_intro,
    'Logos de marcas, clientes o proyectos que puedes destacar como referencia visual.'
  ),
  brand_logos_urls = coalesce(brand_logos_urls, '{}'::text[]),
  package_cta_title = coalesce(package_cta_title, 'Arma tu paquete conmigo'),
  package_cta_intro = coalesce(
    package_cta_intro,
    'Creamos una propuesta visual a tu medida para que tu marca mantenga una imagen clara, elegante y coherente.'
  ),
  package_cta_cta_label = coalesce(package_cta_cta_label, 'Quiero mi paquete'),
  package_cta_cta_href = coalesce(package_cta_cta_href, '/contacto');

comment on column public.packages.price_plan_label
is 'Etiqueta visible del precio de plan mensual por paquete.';

comment on column public.packages.price_plan_note
is 'Descripcion editable que acompana el precio del plan mensual por paquete.';

comment on column public.contact_settings.brand_logos_title
is 'Titulo editable de la seccion de marcas con las que he trabajado.';

comment on column public.contact_settings.brand_logos_intro
is 'Descripcion editable de la seccion de marcas con las que he trabajado.';

comment on column public.contact_settings.brand_logos_urls
is 'Lista de URLs de logos para mostrar en la seccion de marcas.';

comment on column public.contact_settings.package_cta_title
is 'Titulo editable de la tarjeta final de armado de paquete.';

comment on column public.contact_settings.package_cta_intro
is 'Descripcion editable de la tarjeta final de armado de paquete.';

comment on column public.contact_settings.package_cta_cta_label
is 'Texto del boton de la tarjeta final de armado de paquete.';

comment on column public.contact_settings.package_cta_cta_href
is 'Enlace del boton de la tarjeta final de armado de paquete.';

commit;
