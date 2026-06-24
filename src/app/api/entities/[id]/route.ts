import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, hasServiceRole } from "@/lib/supabaseAdmin";
import type { Entity } from "@/lib/types";

export const dynamic = "force-dynamic";

function guardConfig() {
  if (!hasServiceRole()) {
    return NextResponse.json(
      { error: "Falta SUPABASE_SERVICE_ROLE_KEY en el servidor." },
      { status: 500 }
    );
  }
  return null;
}

/** PATCH: actualiza el nombre y/o el cupo de una entidad. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const bad = guardConfig();
  if (bad) return bad;
  const { id } = await params;

  let patch: Record<string, unknown> = {};
  try {
    const body = await request.json();
    if (body?.nombre !== undefined) {
      const nombre = String(body.nombre).trim();
      if (!nombre)
        return NextResponse.json(
          { error: "El nombre no puede quedar vacío." },
          { status: 400 }
        );
      patch.nombre = nombre;
    }
    if (body?.cupo !== undefined) {
      const cupo = Math.trunc(Number(body.cupo));
      if (!Number.isFinite(cupo) || cupo < 1)
        return NextResponse.json(
          { error: "El cupo debe ser un número mayor o igual a 1." },
          { status: 400 }
        );
      patch.cupo = cupo;
    }
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("entities")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entity: data as Entity });
}

/**
 * DELETE: elimina la entidad. Los asistentes vinculados NO se borran;
 * quedan con entity_id en null (gracias a ON DELETE SET NULL).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const bad = guardConfig();
  if (bad) return bad;
  const { id } = await params;

  const { error } = await supabaseAdmin.from("entities").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
