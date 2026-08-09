/**
 * lib/supabaseServidor.ts — cliente de Supabase para el SERVIDOR.
 *
 * QUÉ HACE: crea (y cachea como singleton) un cliente de Supabase con la
 * `service_role` key, usado para leer/escribir en la base vectorial.
 *
 * ROL EN EL SISTEMA: capa de acceso a datos, exclusiva del servidor. La usan el
 * indexador y la recuperación (lib/rag.ts) para hablar con pgvector.
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - Se usa la `service_role` key (no la anon), que IGNORA la Row Level Security.
 *    Por eso este cliente NUNCA debe importarse desde código de cliente: se
 *    restringe a API routes y scripts.
 *  - Con RLS activado en las tablas, este es el único camino de acceso: el
 *    navegador no puede leer el corpus directamente.
 *  - Patrón singleton para reutilizar la conexión entre invocaciones.
 *
 * PARA EL INFORME: la combinación "RLS activado + acceso solo por service_role
 * en el servidor" es la decisión de seguridad que protege la base vectorial sin
 * añadir un backend adicional.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
let cliente: SupabaseClient | null = null;

export function obtenerSupabaseServidor(): SupabaseClient {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY. " +
        "Configúralas en .env.local (ver .env.example)."
    );
  }

  cliente = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
  return cliente;
}
