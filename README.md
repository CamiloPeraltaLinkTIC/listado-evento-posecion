# 🎟️ Control de Asistencia a Eventos

Sistema de check-in para eventos construido con **Next.js (App Router)**, **Tailwind CSS v4** y **Supabase**. Permite cargar asistentes desde un Excel, registrar personas manualmente, buscar y confirmar asistencia en tiempo real. Protegido por un **Token de Seguridad** global.

![stack](https://img.shields.io/badge/Next.js-15-black) ![stack](https://img.shields.io/badge/Supabase-Postgres-3ECF8E) ![stack](https://img.shields.io/badge/Tailwind-v4-38BDF8)

---

## ✨ Funcionalidades

- 🔐 **Login por token** — acceso protegido mediante un middleware de Next.js.
- 📤 **Carga de Excel (Drag & Drop)** — parsea `.xlsx`/`.xls` con SheetJS y hace `upsert` por cédula (sin duplicados).
- 🔎 **Buscador reactivo** — filtra por cédula o nombre al instante, con filtro por estado.
- ✅ **Confirmación optimista** — el estado cambia al instante y se sincroniza con Supabase.
- ➕ **Registro manual** — agrega asistentes que no venían en el Excel.
- 📊 **Estadísticas en vivo** — total, asistieron, pendientes y % de progreso.
- 📱 **Responsive / móvil** — diseño premium (glassmorphism) pensado para check-in con el teléfono.

---

## 🚀 Puesta en marcha

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto.
2. Ve a **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](./supabase/schema.sql) y ejecútalo. Esto crea la tabla `attendees` con sus índices y políticas RLS.
3. Ve a **Settings → API** y copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configurar variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SECURITY_TOKEN=elige-un-token-fuerte
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Te pedirá el **Token de Seguridad** (`SECURITY_TOKEN`).

---

## 📄 Formato del Excel

El archivo debe tener una hoja con dos columnas. Los encabezados se detectan de forma flexible (no distingue mayúsculas):

| Cédula | Nombre |
| :--- | :--- |
| 1023456789 | María Gómez |
| 1098765432 | Juan Pérez |

> Se aceptan encabezados como `Cédula`, `Cedula`, `Documento`, `Identificación` para la cédula y `Nombre`, `Name`, `Asistente` para el nombre. Las filas sin ambos campos se ignoran y los duplicados por cédula se descartan.

---

## ☁️ Despliegue en Vercel

1. Sube el proyecto a un repositorio de Git e impórtalo en [Vercel](https://vercel.com).
2. En **Settings → Environment Variables** agrega las tres variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SECURITY_TOKEN`
3. Despliega. Vercel detecta Next.js automáticamente.

---

## 🗂️ Estructura del proyecto

```
src/
├─ app/
│  ├─ api/auth/login/route.ts    # Valida el token y setea la cookie
│  ├─ api/auth/logout/route.ts   # Cierra sesión
│  ├─ login/page.tsx             # Vista de login
│  ├─ page.tsx                   # Dashboard protegido
│  ├─ layout.tsx
│  └─ globals.css                # Tema premium (glassmorphism)
├─ components/
│  ├─ Dashboard.tsx              # Orquestador + lógica de datos
│  ├─ ExcelUpload.tsx            # Drag & drop + parseo xlsx
│  ├─ AttendeeList.tsx           # Tabla, buscador y filtros
│  ├─ ManualRegisterModal.tsx    # Alta manual
│  ├─ StatsBar.tsx               # Métricas
│  └─ Toast.tsx                  # Notificaciones
├─ lib/
│  ├─ supabase.ts                # Cliente Supabase
│  ├─ constants.ts               # Nombre de cookie
│  ├─ types.ts                   # Tipos
│  └─ utils.ts                   # cn() y normalización de cédula
├─ middleware.ts                 # Protección por token
└─ supabase/schema.sql           # Esquema de la BD
```

---

## 🔒 Nota de seguridad

El sistema usa un único token global y la clave **anónima** de Supabase con políticas RLS abiertas para `anon`. Es adecuado para un evento interno operado por personal de confianza. Para entornos más sensibles, considera mover las operaciones de escritura a rutas API del servidor o usar Supabase Auth con roles.
