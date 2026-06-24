import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { supabaseAdmin, hasServiceRole } from "@/lib/supabaseAdmin";
import type { Entity, EntityWithUsage } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Token de enlace: aleatorio, corto y seguro para usar en una URL. */
function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

/** Código de acceso: 8 caracteres legibles (sin 0/O/1/I para evitar confusión). */
function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

function guardConfig() {
  if (!hasServiceRole()) {
    return NextResponse.json(
      { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." },
      { status: 500 }
    );
  }
  return null;
}

/** GET: lista las entidades con su cupo y cuántos puestos llevan ocupados. */
export async function GET() {
  const bad = guardConfig();
  if (bad) return bad;

  const { data: entities, error } = await supabaseAdmin
    .from("entities")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Cuenta los asistentes por entidad en una sola consulta.
  const { data: rows, error: countErr } = await supabaseAdmin
    .from("attendees")
    .select("entity_id")
    .not("entity_id", "is", null);

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 });
  }

  const counts = new Map<string, number>();
  for (const r of rows ?? []) {
    const id = (r as { entity_id: string }).entity_id;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const result: EntityWithUsage[] = ((entities as Entity[]) ?? []).map((e) => ({
    ...e,
    used: counts.get(e.id) ?? 0,
  }));

  return NextResponse.json({ entities: result });
}

/** POST: crea una entidad con su cupo y genera su token de enlace. */
export async function POST(request: NextRequest) {
  const bad = guardConfig();
  if (bad) return bad;

  let nombre = "";
  let cupo = 0;
  try {
    const body = await request.json();
    nombre = String(body?.nombre ?? "").trim();
    cupo = Math.trunc(Number(body?.cupo));
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (!nombre) {
    return NextResponse.json(
      { error: "El nombre de la entidad es obligatorio." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(cupo) || cupo < 1) {
    return NextResponse.json(
      { error: "El cupo debe ser un número mayor o igual a 1." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("entities")
    .insert({
      nombre,
      cupo,
      token: generateToken(),
      access_code: generateCode(),
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entity: { ...(data as Entity), used: 0 } });
}
