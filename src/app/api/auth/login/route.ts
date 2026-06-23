import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE } from "@/lib/constants";

export async function POST(request: NextRequest) {
  const expected = process.env.SECURITY_TOKEN;

  if (!expected) {
    return NextResponse.json(
      { error: "El servidor no tiene configurado SECURITY_TOKEN." },
      { status: 500 }
    );
  }

  let token = "";
  try {
    const body = await request.json();
    token = String(body?.token ?? "");
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  if (token !== expected) {
    return NextResponse.json(
      { error: "Token incorrecto. Inténtalo de nuevo." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  return response;
}
