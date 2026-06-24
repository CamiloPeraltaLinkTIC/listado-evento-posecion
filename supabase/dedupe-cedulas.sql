-- =============================================================
-- Limpieza de cédulas duplicadas + garantía de unicidad
-- Ejecuta este script UNA vez en Supabase: Dashboard > SQL Editor.
-- Es seguro re-ejecutarlo (idempotente).
--
-- Qué hace:
--   1. Elimina filas duplicadas comparando la cédula NORMALIZADA
--      (sin espacios, puntos ni guiones). Conserva una sola por persona:
--      preferentemente la que YA asistió; si empatan, la más antigua.
--   2. Normaliza las cédulas restantes al mismo formato que usa la app.
--   3. Asegura la restricción UNIQUE para que no vuelvan a duplicarse.
-- =============================================================

-- 1) Elimina duplicados por cédula normalizada, conservando la mejor fila.
delete from public.attendees a
using public.attendees b
where a.id <> b.id
  and regexp_replace(a.cedula, '[\s.\-]', '', 'g')
      = regexp_replace(b.cedula, '[\s.\-]', '', 'g')
  and (
    -- b "gana" (y por tanto a se borra) si b asistió y a no...
    (b.has_attended and not a.has_attended)
    -- ...o, con igual estado de asistencia, si b es más antigua...
    or (b.has_attended = a.has_attended and b.created_at < a.created_at)
    -- ...o, como desempate final, si el id de b es menor.
    or (b.has_attended = a.has_attended
        and b.created_at = a.created_at
        and b.id < a.id)
  );

-- 2) Normaliza las cédulas restantes (quita espacios, puntos y guiones).
update public.attendees
set cedula = regexp_replace(cedula, '[\s.\-]', '', 'g')
where cedula <> regexp_replace(cedula, '[\s.\-]', '', 'g');

-- 3) Garantiza la restricción UNIQUE sobre cédula (si aún no existe).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'attendees_cedula_key'
  ) then
    alter table public.attendees
      add constraint attendees_cedula_key unique (cedula);
  end if;
end $$;
