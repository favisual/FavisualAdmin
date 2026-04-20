# Cambios Abril

Documento de trazabilidad para los cambios solicitados sobre paquetes y home.

## Resumen funcional

- Se cambia el texto visible de `Precio final` por `Precio plan mensual`.
- Se elimina la sección visible de `Precio unico` en la vista pública y en el formulario del admin.
- El texto del plan mensual pasa a ser editable por paquete desde el administrador.
- Se agrega una seccion configurable de `Marcas con las que he trabajado` con logos.
- Se agrega una tarjeta final configurable de `Arma tu paquete conmigo`.
- Se agrega una foto circular configurable para la tarjeta de contacto.

## Cambios de base de datos

Estos cambios se aplican sobre `public.packages` y `public.contact_settings`.

### `public.packages`

- `price_plan_label text not null default 'Precio plan mensual'`
- `price_plan_note text not null default 'Ideal para marcas que quieren mantener una imagen constante y profesional.'`

### `public.contact_settings`

- `photo_url text`
- `brand_logos_title text not null default 'Marcas con las que he trabajado'`
- `brand_logos_intro text not null default 'Logos de marcas, clientes o proyectos que puedes destacar como referencia visual.'`
- `brand_logos_urls text[] not null default '{}'`
- `package_cta_title text not null default 'Arma tu paquete conmigo'`
- `package_cta_intro text not null default 'Creamos una propuesta visual a tu medida para que tu marca mantenga una imagen clara, elegante y coherente.'`
- `package_cta_cta_label text not null default 'Quiero mi paquete'`
- `package_cta_cta_href text not null default '/contacto'`

## Archivo de migracion

- Ejecutar [`supabase/migrations/2026-04-cambios-abril.sql`](../supabase/migrations/2026-04-cambios-abril.sql)
- Ejecutar [`supabase/migrations/2026-04-contact-photo.sql`](../supabase/migrations/2026-04-contact-photo.sql)

## Pasos para aplicarlo

1. Abre el SQL editor de Supabase.
2. Ejecuta primero la migracion nueva `2026-04-cambios-abril.sql`.
3. Verifica que las columnas nuevas existan en `public.packages` y `public.contact_settings`.
4. Entra al panel admin y completa:
   - etiqueta y descripcion del plan mensual por paquete
   - logos de marcas trabajadas
   - tarjeta final de paquete personalizado
5. Publica los cambios y valida el home en la web.

## Validacion rapida

- La tarjeta de paquetes ya no debe mostrar `Precio unico`.
- Debe verse el bloque de marcas solo si hay logos cargados.
- La tarjeta final debe renderizarse al final del home con el texto configurable.
