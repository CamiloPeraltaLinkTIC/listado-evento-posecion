-- =============================================================
-- Vincula asistentes YA cargados con su entidad, emparejando el texto
-- de attendees.entidad con entities.nombre.
-- Ejecuta DESPUÉS de haber creado las entidades (con el mismo nombre).
-- Es seguro re-ejecutarlo: solo toca los que aún no tienen entity_id.
-- =============================================================

-- 1) Empareja por nombre (sin distinguir mayúsculas ni espacios sobrantes).
update public.attendees a
set entity_id = e.id
from public.entities e
where a.entity_id is null
  and a.entidad is not null
  and lower(btrim(a.entidad)) = lower(btrim(e.nombre));

-- 2) (Opcional) Normaliza el texto de entidad al nombre oficial de la
--    entidad, para que se vea idéntico en toda la app.
update public.attendees a
set entidad = e.nombre
from public.entities e
where a.entity_id = e.id
  and a.entidad is distinct from e.nombre;

-- 3) Diagnóstico: revisa cuántos quedaron por vincular y con qué texto.
--    (Esto solo muestra resultados; no modifica nada.)
select coalesce(entidad, '(sin entidad)') as entidad_texto,
       count(*) as sin_vincular
from public.attendees
where entity_id is null
group by entidad
order by sin_vincular desc;
