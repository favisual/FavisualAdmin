# FaVisual

Portafolio en React + Vite con panel administrativo para categorias, fotos y videos.

## Panel admin

- Ruta: `/admin`
- Crea y elimina categorias
- Agrega fotos y videos por URL o subiendo archivos
- Guarda el orden de los elementos
- Usa Supabase para base de datos y Storage
- Protege `/admin` con Supabase Auth
- Si no hay variables de entorno, entra en modo local de respaldo

## Configurar Supabase

1. Crea un proyecto en Supabase.
2. En el SQL editor ejecuta [`supabase/schema.sql`](./supabase/schema.sql).
3. Ejecuta [`packages-schema.sql`](./packages-schema.sql) para habilitar la administracion de paquetes.
4. Ejecuta [`contact-schema.sql`](./contact-schema.sql) para administrar contacto desde el panel.
5. Ejecuta [`home-settings-schema.sql`](./home-settings-schema.sql) para administrar las imagenes y video del home desde el panel.
6. Luego ejecuta [`auth-policies.sql`](./auth-policies.sql) para que solo usuarios autenticados puedan escribir desde el admin.
6. Copia [`.env.example`](./.env.example) como `.env` y completa:

```bash
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_SUPABASE_BUCKET=media
```

7. En Supabase Auth crea el usuario administrador con correo y contrasena.
8. Instala dependencias e inicia:

```bash
npm install
npm run dev
```

9. Entra a `/login` para acceder al panel.

## Notas

- La web publica puede leer categorias y media, pero las escrituras del admin deben quedar protegidas con [`auth-policies.sql`](./auth-policies.sql).
- Si ya ejecutaste una version anterior del SQL, corre tambien ese archivo para actualizar la seguridad.

