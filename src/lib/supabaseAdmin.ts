import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la clave service_role. OMITE las políticas RLS,
 * por lo que SOLO debe usarse en el servidor (route handlers / acciones).
 * Nunca lo importes en componentes de cliente.
 *
 * Requiere las variables de entorno:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY  (Settings > API > service_role, secreta)
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export function hasServiceRole(): boolean {
  return Boolean(url) && Boolean(serviceKey);
}

export const supabaseAdmin = createClient(
  url || "https://placeholder.supabase.co",
  serviceKey || "placeholder-service-role-key",
  { auth: { persistSession: false, autoRefreshToken: false } }
);
