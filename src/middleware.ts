import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

/**
 * Protege todo el sistema con un Token de Seguridad global.
 * Si la cookie no coincide con SECURITY_TOKEN, redirige al login.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const expected = process.env.SECURITY_TOKEN;

  const isAuthed = Boolean(expected) && token === expected;

  if (!isAuthed) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  /**
   * Protege todas las rutas excepto: login, las rutas de API de auth,
   * los enlaces de invitación por token (/i/... y /api/invite/...), los
   * assets de Next.js, el favicon y cualquier archivo estático (rutas con
   * extensión, p. ej. /cne-logo.png, /icon.png).
   *
   * Los enlaces de invitación se autorizan por su propio token, no con la
   * cookie de admin, por eso quedan fuera de este middleware.
   */
  matcher: [
    "/((?!login|api/auth|api/invite|i/|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
