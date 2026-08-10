/**
 * lib/acceso.ts — utilidades del portal de acceso por PIN.
 *
 * QUÉ HACE: define el nombre de la cookie de sesión y deriva un token a partir
 * del PIN (SHA-256), de modo que la cookie NUNCA contenga el PIN en claro y el
 * middleware pueda verificarla sin base de datos.
 *
 * ROL EN EL SISTEMA: compartido por el middleware (Edge) y la ruta de acceso
 * (Node). Usa solo Web Crypto, disponible en ambos entornos.
 *
 * NOTA: es una protección de nivel académico (control de acceso simple), no un
 * sistema de autenticación robusto.
 */

export const COOKIE_ACCESO = "centinela_acceso";

/** Deriva el token de sesión (hash SHA-256 en hex) a partir del PIN. */
export async function tokenDeAcceso(pin: string): Promise<string> {
  const datos = new TextEncoder().encode(`centinela-orinoco::${pin}`);
  const buffer = await crypto.subtle.digest("SHA-256", datos);
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
