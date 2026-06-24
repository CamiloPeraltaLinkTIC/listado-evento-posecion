import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { INVITE_CODE_HEADER } from "@/lib/constants";
import type { Entity } from "@/lib/types";

/** Normaliza un código para comparar (sin espacios, en mayúsculas). */
export function normalizeCode(value: string): string {
  return String(value ?? "").trim().toUpperCase();
}

/** ¿El código entregado coincide con el de la entidad? */
export function codeMatches(entity: Entity, provided: string): boolean {
  const a = normalizeCode(entity.access_code);
  const b = normalizeCode(provided);
  return a.length > 0 && a === b;
}

/** Lee el código de acceso enviado por el cliente en el header. */
export function readInviteCode(request: NextRequest): string {
  return request.headers.get(INVITE_CODE_HEADER) ?? "";
}

/** Busca una entidad por su token de enlace. Devuelve null si no existe. */
export async function findEntityByToken(token: string): Promise<Entity | null> {
  const clean = String(token ?? "").trim();
  if (!clean) return null;

  const { data, error } = await supabaseAdmin
    .from("entities")
    .select("*")
    .eq("token", clean)
    .maybeSingle();

  if (error || !data) return null;
  return data as Entity;
}

/** Cuántos puestos lleva ocupados una entidad (asistentes vinculados). */
export async function countUsed(entityId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("attendees")
    .select("id", { count: "exact", head: true })
    .eq("entity_id", entityId);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
