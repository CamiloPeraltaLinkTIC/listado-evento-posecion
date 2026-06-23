-- =============================================================
-- Esquema de la base de datos para el Control de Asistencia
-- Ejecuta este script en Supabase: Dashboard > SQL Editor > New query
-- =============================================================

create extension if not exists "pgcrypto";

create table if not exists public.attendees (
  id            uuid primary key default gen_random_uuid(),
  cedula        text not null unique,
  nombre        text not null,
  has_attended  boolean not null default false,
  arrival_time  timestamptz,
  created_at    timestamptz not null default now()
);

-- Índices para acelerar la búsqueda reactiva por cédula y nombre.
create index if not exists attendees_cedula_idx on public.attendees (cedula);
create index if not exists attendees_nombre_idx on public.attendees (nombre);

-- =============================================================
-- Row Level Security
-- El acceso a la app está protegido por un Token de Seguridad global
-- (middleware de Next.js). Habilitamos políticas para la clave anónima
-- de modo que el cliente del navegador pueda leer y escribir.
-- =============================================================
alter table public.attendees enable row level security;

drop policy if exists "Permitir lectura anon" on public.attendees;
create policy "Permitir lectura anon"
  on public.attendees for select
  to anon
  using (true);

drop policy if exists "Permitir insercion anon" on public.attendees;
create policy "Permitir insercion anon"
  on public.attendees for insert
  to anon
  with check (true);

drop policy if exists "Permitir actualizacion anon" on public.attendees;
create policy "Permitir actualizacion anon"
  on public.attendees for update
  to anon
  using (true)
  with check (true);

drop policy if exists "Permitir borrado anon" on public.attendees;
create policy "Permitir borrado anon"
  on public.attendees for delete
  to anon
  using (true);

-- =============================================================
-- Realtime: sincronización en vivo entre dispositivos.
-- Agrega la tabla a la publicación de Supabase (idempotente).
-- =============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'attendees'
  ) then
    alter publication supabase_realtime add table public.attendees;
  end if;
end $$;
