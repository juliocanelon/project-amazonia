/**
 * middleware.ts — control de acceso por PIN para TODA la aplicación.
 *
 * QUÉ HACE: en cada petición comprueba si existe una cookie de acceso válida
 * (token derivado del PIN_ENTRADA). Si no, redirige a la página de acceso. Solo
 * se permiten sin sesión la propia página `/acceso` y su API `/api/acceso`.
 *
 * ROL EN EL SISTEMA: puerta de entrada del prototipo. Impide llegar a cualquier
 * página o API (incluidas las del RAG, que consumen créditos) sin el PIN.
 *
 * DECISIÓN DE ARQUITECTURA: el PIN vive solo en la variable de entorno
 * PIN_ENTRADA (servidor); la cookie guarda únicamente su hash. El `matcher`
 * excluye los recursos estáticos para no bloquear el propio portal.
 */
import { NextRequest, NextResponse } from "next/server";
import { COOKIE_ACCESO, tokenDeAcceso } from "@/lib/acceso";

const RUTA_ACCESO = "/acceso";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Rutas siempre accesibles sin sesión.
  if (pathname === RUTA_ACCESO || pathname === "/api/acceso") {
    return NextResponse.next();
  }

  const pin = process.env.PIN_ENTRADA;
  const cookie = req.cookies.get(COOKIE_ACCESO)?.value;

  if (pin && cookie && cookie === (await tokenDeAcceso(pin))) {
    return NextResponse.next();
  }

  // Sin sesión válida → de vuelta al portal de acceso.
  const url = req.nextUrl.clone();
  url.pathname = RUTA_ACCESO;
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // Protege todo excepto recursos internos de Next y archivos estáticos.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|geojson|json|txt|xml|woff|woff2)$).*)",
  ],
};
