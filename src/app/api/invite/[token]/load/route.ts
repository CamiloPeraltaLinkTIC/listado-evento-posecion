import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, hasServiceRole } from "@/lib/supabaseAdmin";
import {
  findEntityByToken,
  countUsed,
  codeMatches,
  readInviteCode,
} from "@/lib/invite";
import { normalizeCedula } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface IncomingRow {
  cedula?: unknown;
  nombre?: unknown;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * POST: carga (o actualiza) asistentes de la entidad dueña del token,
 * SIN sobrepasar su cupo. Si el cupo se excedería, se rechaza la carga.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  if (!hasServiceRole()) {
    return NextResponse.json(
      { error: "El servidor no está configurado correctamente." },
      { status: 500 }
    );
  }

  const { token } = await params;
  const entity = await findEntityByToken(token);
  if (!entity) {
    return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });
  }

  if (!codeMatches(entity, readInviteCode(request))) {
    return NextResponse.json(
      { error: "Código de acceso incorrecto." },
      { status: 401 }
    );
  }

  let incoming: IncomingRow[] = [];
  try {
    const body = await request.json();
    incoming = Array.isArray(body?.rows) ? body.rows : [];
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  // 1) Normaliza, valida y deduplica las filas recibidas.
  const porCedula = new Map<string, string>(); // cedula -> nombre
  let omitidos = 0;
  let duplicados = 0;
  for (const raw of incoming) {
    const cedula = normalizeCedula(String(raw?.cedula ?? ""));
    const nombre = String(raw?.nombre ?? "").trim();
    if (!cedula || !nombre) {
      omitidos++;
      continue;
    }
    if (porCedula.has(cedula)) {
      duplicados++;
      continue;
    }
    porCedula.set(cedula, nombre);
  }

  const cedulas = [...porCedula.keys()];
  if (cedulas.length === 0) {
    return NextResponse.json(
      { error: "No hay filas válidas para cargar (faltan cédula o nombre)." },
      { status: 400 }
    );
  }

  // 2) ¿Cuáles de esas cédulas ya existen y a qué entidad pertenecen?
  const existente = new Map<string, string | null>(); // cedula -> entity_id
  for (const lote of chunk(cedulas, 300)) {
    const { data, error } = await supabaseAdmin
      .from("attendees")
      .select("cedula, entity_id")
      .in("cedula", lote);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    for (const r of data ?? []) {
      const row = r as { cedula: string; entity_id: string | null };
      existente.set(row.cedula, row.entity_id);
    }
  }

  // 3) Clasifica: conflictos (de otra entidad), nuevos (ocupan cupo) y
  //    actualizaciones (ya son de esta entidad).
  const conflictos: string[] = [];
  const aplicables: string[] = [];
  let nuevos = 0;
  for (const cedula of cedulas) {
    const dueño = existente.get(cedula);
    if (dueño && dueño !== entity.id) {
      conflictos.push(cedula); // pertenece a otra entidad: no se toca
      continue;
    }
    aplicables.push(cedula);
    if (dueño !== entity.id) nuevos++; // nuevo o reasignado desde "sin entidad"
  }

  // 4) Bloqueo de cupo: si los nuevos no caben, se rechaza toda la carga.
  const used = await countUsed(entity.id);
  const disponibles = Math.max(0, entity.cupo - used);
  if (nuevos > disponibles) {
    return NextResponse.json(
      {
        error: `Cupo insuficiente. Cupo: ${entity.cupo}, usados: ${used}, disponibles: ${disponibles}. Intentas agregar ${nuevos} nuevos.`,
        cupo: entity.cupo,
        used,
        disponibles,
        intentados: nuevos,
        conflictos: conflictos.length,
      },
      { status: 409 }
    );
  }

  // 5) Upsert por lotes de las filas aplicables.
  const filas = aplicables.map((cedula) => ({
    cedula,
    nombre: porCedula.get(cedula)!,
    entidad: entity.nombre,
    entity_id: entity.id,
  }));

  for (const lote of chunk(filas, 500)) {
    const { error } = await supabaseAdmin
      .from("attendees")
      .upsert(lote, { onConflict: "cedula", ignoreDuplicates: false });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    agregados: nuevos,
    actualizados: aplicables.length - nuevos,
    used: used + nuevos,
    cupo: entity.cupo,
    conflictos: conflictos.length,
    omitidos,
    duplicados,
  });
}
