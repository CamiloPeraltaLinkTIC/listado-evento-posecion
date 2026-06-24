import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, hasServiceRole } from "@/lib/supabaseAdmin";
import {
  findEntityByToken,
  codeMatches,
  readInviteCode,
} from "@/lib/invite";
import type { InviteInfo } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * GET: información del enlace (nombre de la entidad, cupo, puestos usados y
 * la lista cargada). Requiere el código de acceso correcto en el header,
 * de modo que tener solo la URL no sea suficiente.
 */
export async function GET(
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

  const { data: rows, error } = await supabaseAdmin
    .from("attendees")
    .select("cedula, nombre")
    .eq("entity_id", entity.id)
    .order("nombre", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const info: InviteInfo = {
    nombre: entity.nombre,
    cupo: entity.cupo,
    used: rows?.length ?? 0,
    attendees: (rows as { cedula: string; nombre: string }[]) ?? [],
  };

  return NextResponse.json(info);
}
