-- =============================================================
-- Entidades con enlace de invitación y cupo de puestos.
-- Ejecuta este script en Supabase: Dashboard > SQL Editor > New query.
-- Es idempotente (se puede re-ejecutar sin riesgo).
-- =============================================================

create extension if not exists "pgcrypto";

create table if not exists public.entities (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  token       text not null unique,
  access_code text not null,
  cupo        integer not null default 0 check (cupo >= 0),
  created_at  timestamptz not null default now()
);

create index if not exists entities_token_idx on public.entities (token);

-- Para bases existentes: agrega el código de acceso y rellena los faltantes.
alter table public.entities add column if not exists access_code text;
update public.entities
  set access_code = upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))
  where access_code is null or access_code = '';
alter table public.entities alter column access_code set not null;

-- Vínculo de cada asistente con su entidad. Si se borra la entidad, los
-- asistentes quedan sin entidad (no se eliminan).
alter table public.attendees
  add column if not exists entity_id uuid references public.entities(id) on delete set null;

create index if not exists attendees_entity_idx on public.attendees (entity_id);

-- =============================================================
-- Seguridad: la tabla 'entities' contiene los TOKENS de los enlaces,
-- por lo que NO debe ser accesible con la clave anónima (es pública).
-- Habilitamos RLS y NO creamos políticas para 'anon': así el cliente del
-- navegador no puede leer ni escribir tokens. Todo el acceso ocurre desde
-- el servidor con la clave service_role (que omite RLS).
-- =============================================================
alter table public.entities enable row level security;

-- Por si quedaron políticas de una ejecución previa, las quitamos.
drop policy if exists "entities_anon_select" on public.entities;
drop policy if exists "entities_anon_insert" on public.entities;
drop policy if exists "entities_anon_update" on public.entities;
drop policy if exists "entities_anon_delete" on public.entities;
