# FaVisual

Portafolio en React + Vite con panel administrativo para categorias, fotos y videos.

## Panel admin

- Ruta: `/admin`
- Crea y elimina categorias
- Agrega fotos y videos por URL o subiendo archivos
- Guarda el orden de los elementos
- Configura paquetes con precio de plan mensual, nota editable y CTA
- Configura el home con logos de marcas trabajadas y la tarjeta final de paquete
- Configura la foto circular de la tarjeta de contacto
- Usa Supabase para base de datos y Storage
- Protege `/admin` con Supabase Auth
- Si no hay variables de entorno, entra en modo local de respaldo

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. En el SQL editor ejecuta [`supabase/schema.sql`](./supabase/schema.sql).
3. Ejecuta [`supabase/migrations/packages-schema.sql`](./supabase/migrations/packages-schema.sql) para habilitar la administracion de paquetes.
4. Ejecuta [`supabase/migrations/contact-schema.sql`](./supabase/migrations/contact-schema.sql) para administrar contacto desde el panel.
5. Ejecuta [`supabase/migrations/home-settings-schema.sql`](./supabase/migrations/home-settings-schema.sql) para administrar las imagenes y video del home desde el panel.
6. Si ya tienes el home configurado y solo necesitas agregar el segundo CTA del hero y el titulo editable de categorias, ejecuta [`supabase/migrations/home-settings-extra-fields.sql`](./supabase/migrations/home-settings-extra-fields.sql).
7. Ejecuta [`supabase/migrations/2026-04-cambios-abril.sql`](./supabase/migrations/2026-04-cambios-abril.sql) para agregar los campos de paquetes, logos de marcas y CTA final del home.
8. Ejecuta [`supabase/migrations/2026-04-contact-photo.sql`](./supabase/migrations/2026-04-contact-photo.sql) para agregar la foto circular de contacto.
9. Luego ejecuta [`supabase/migrations/auth-policies.sql`](./supabase/migrations/auth-policies.sql) para que solo usuarios autenticados puedan escribir desde el admin.
10. Copia [`.env.example`](./.env.example) como `.env` y completa:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SUPABASE_BUCKET=media
```

11. En Supabase Auth crea el usuario administrador con correo y contrasena.
12. Instala dependencias e inicia:

```bash
npm install
npm run dev
```

13. Entra a `/login` para acceder al panel.

## Notas

- La web publica puede leer categorias y media, pero las escrituras del admin deben quedar protegidas con [`supabase/migrations/auth-policies.sql`](./supabase/migrations/auth-policies.sql).
- Si ya ejecutaste una version anterior del SQL, corre tambien ese archivo para actualizar la seguridad.
- Los campos nuevos del home para el segundo boton del hero y el titulo de la seccion de categorias quedan documentados en [`supabase/migrations/home-settings-extra-fields.sql`](./supabase/migrations/home-settings-extra-fields.sql).
- La trazabilidad de este ajuste vive en [`Cambios Abril/README.md`](./Cambios%20Abril/README.md).

