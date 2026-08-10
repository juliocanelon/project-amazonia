/**
 * app/api/acceso/route.ts — valida el PIN de entrada y abre la sesión.
 *
 * QUÉ HACE: recibe { pin }, lo compara con PIN_ENTRADA (solo servidor) y, si es
 * correcto, setea una cookie httpOnly con el token de sesión (hash del PIN).
 *
 * ROL EN EL SISTEMA: único punto que valida el PIN. El middleware confía en la
 * cookie que aquí se emite. El PIN nunca viaja al cliente ni se guarda en claro.
 */
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_ACCESO, tokenDeAcceso } from "@/lib/acceso";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const pinConfig = process.env.PIN_ENTRADA;
  if (!pinConfig) {
    return NextResponse.json(
      { ok: false, error: "El acceso no está configurado en el servidor (falta PIN_ENTRADA)." },
      { status: 503 }
    );
  }

  let pin = "";
  try {
    const cuerpo = (await req.json()) as { pin?: string };
    pin = typeof cuerpo?.pin === "string" ? cuerpo.pin : "";
  } catch {
    // cuerpo inválido → se trata como PIN vacío
  }

  if (typeof pin !== "string" || pin.trim().length === 0) {
    return NextResponse.json({ ok: false, error: "Introduce el PIN de acceso." }, { status: 400 });
  }

  if (pin !== pinConfig) {
    return NextResponse.json({ ok: false, error: "PIN incorrecto." }, { status: 401 });
  }

  const token = await tokenDeAcceso(pinConfig);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_ACCESO, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 horas
  });
  return res;
}
