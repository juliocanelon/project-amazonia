import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase para uso EXCLUSIVO en el servidor (API routes y scripts).
 * Usa la service_role key, que nunca debe exponerse al cliente.
 */
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
