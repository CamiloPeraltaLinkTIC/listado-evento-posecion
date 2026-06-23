# Plan de Implementación: Sistema de Control de Asistencia a Eventos

Este documento describe la arquitectura, diseño y los pasos de desarrollo para crear un sistema de gestión de asistencia a eventos utilizando Next.js, Tailwind CSS y Supabase.

---

## 🏗️ 1. Arquitectura y Stack Tecnológico

- **Frontend:** Next.js (App Router), React, Tailwind CSS (para un diseño premium y responsive), Lucide-React (para íconos).
- **Backend/Base de Datos:** Supabase (Postgres Database). Se implementará un **Token de Seguridad** (contraseña global) para proteger el acceso al sistema.
- **Lectura de Excel:** Biblioteca `xlsx` (SheetJS) para procesar archivos `.xlsx` en el navegador y extraer los campos de "Cédula" y "Nombre".
- **Despliegue:** Vercel

---

## 🗄️ 2. Diseño de la Base de Datos (Supabase)

Crearemos una tabla principal llamada `attendees` (asistentes).

### Estructura de la Tabla `attendees`

| Columna | Tipo de Dato | Propiedades | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key, Gen Random UUID | Identificador único. |
| `cedula` | `text` | Unique, Not Null | Cédula de identidad (clave para evitar duplicados en subidas Excel). |
| `nombre` | `text` | Not Null | Nombre completo del asistente. |
| `has_attended` | `boolean` | Default `false` | Indicador de si la persona asistió o no al evento. |
| `arrival_time` | `timestamptz` | Nullable | Almacena la hora en que se confirmó la asistencia. |
| `created_at` | `timestamptz` | Default `now()` | Fecha de registro en el sistema. |

---

## 🛠️ 3. Fases de Desarrollo

### FASE 1: Configuración Inicial del Proyecto
1. **Inicializar Next.js:** Crear el proyecto con TypeScript y Tailwind CSS.
2. **Configurar Diseño Base:** Modificar globales para establecer colores modernos (Glassmorphism, gradientes suaves).
3. **Instalaciones adicionales:** 
   - `npm install @supabase/supabase-js xlsx date-fns lucide-react clsx tailwind-merge`

### FASE 2: Integración con Supabase y Modelamiento
1. **Proyecto en Supabase:** Creación de base de datos y obtención de variables de entorno.
2. **Setup de Tablas:** Ejecutar comando SQL para poblar esquema `attendees`.

### FASE 3: Desarrollo de Componentes Clave (Frontend)
1. **Protección y Login:** Crear un Middleware de Next.js que valide un "Token de Seguridad" ingresado en una vista de Login sencilla antes de conceder acceso al sistema.
2. **Layout y Dashboard:** View principal.
2. **Componente 'Carga de Excel':** Un Drag&Drop para subir un Excel de cédulas y nombres, parseando con `xlsx` y ejecutando `upsert` múltiple.
3. **Componente 'Listado y Buscador':** Tabla con animaciones, con barra de búsqueda reactiva por cédula o nombre y filtro por estatus.

### FASE 4: Flujos de Acción (Confirmación y Nuevo Registro)
1. **Botón Confirmar Asistencia:** Al presionar, muta el row localmente para que se vea rápido y se actualiza a Supabase (`has_attended = true`, `arrival_time = now()`).
2. **Formulario de Registro Manual:** Un panel para agregar nueva persona si no vino en el excel inicial.

### FASE 5: Pulido y Despliegue en Vercel
1. **Auditoría UI/UX:** Optimización para móviles (indispensable para check-in) y animaciones de confirmación.
2. **Integración en Vercel:** Despliegue automático y configuración de variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y el `SECURITY_TOKEN`).

---

¿Estás de acuerdo con este plan? Si lo confirmas, podemos comenzar de inmediato con la **Fase 1** configurando la aplicación en Next.js.
