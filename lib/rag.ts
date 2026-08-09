import { embeddingConsulta } from "./embeddings";
import { obtenerSupabaseServidor } from "./supabaseServidor";
import type { FuenteCitada, TipoFuente } from "./tipos";

/** Fila devuelta por la función match_fragmentos de Supabase. */
export interface FragmentoRecuperado {
  id: number;
  fuente_id: string;
  autores: string;
  anio: number;
  titulo: string;
  revista: string;
  doi: string | null;
  indexacion: string | null;
  tipo: TipoFuente;
  fecha: string | null;
  url: string | null;
  fragmento: string;
  posicion: number;
  similitud: number;
}

/**
 * Recupera los fragmentos del corpus más similares a la consulta mediante
 * búsqueda vectorial (similitud coseno) en Supabase/pgvector.
 */
export async function recuperarFragmentos(
  consulta: string,
  k = 6
): Promise<FragmentoRecuperado[]> {
  const embedding = await embeddingConsulta(consulta);
  const supabase = obtenerSupabaseServidor();

  const { data, error } = await supabase.rpc("match_fragmentos", {
    query_embedding: embedding,
    match_count: k,
    umbral_similitud: 0.0,
  });

  if (error) {
    throw new Error(`Error de recuperación vectorial: ${error.message}`);
  }
  return (data ?? []) as FragmentoRecuperado[];
}

/** Etiqueta legible del tipo de fuente. */
function etiquetaTipo(tipo: TipoFuente): string {
  return tipo === "prensa" ? "PRENSA — no revisada por pares" : "revisada por pares";
}

/**
 * Construye el bloque de contexto que se pasa al LLM. Cada fragmento se
 * numera y se marca su tipo (científico vs. prensa) para que el modelo pueda
 * citarlo y distinguir su valor probatorio.
 */
export function construirContexto(fragmentos: FragmentoRecuperado[]): string {
  if (fragmentos.length === 0) return "(No se recuperaron fragmentos del corpus.)";
  return fragmentos
    .map(
      (f, i) =>
        `[Fuente ${i + 1} · ${etiquetaTipo(f.tipo)}] ${f.autores} (${f.anio}). ${f.titulo}. ${f.revista}.\n${f.fragmento}`
    )
    .join("\n\n---\n\n");
}

/**
 * Deduplica los fragmentos por fuente y devuelve la lista de fuentes citadas
 * (una por documento, con su mejor similitud).
 */
export function extraerFuentes(fragmentos: FragmentoRecuperado[]): FuenteCitada[] {
  const porFuente = new Map<string, FuenteCitada>();
  for (const f of fragmentos) {
    const existente = porFuente.get(f.fuente_id);
    if (!existente || f.similitud > existente.similitud) {
      porFuente.set(f.fuente_id, {
        fuente_id: f.fuente_id,
        autores: f.autores,
        anio: f.anio,
        titulo: f.titulo,
        revista: f.revista,
        doi: f.doi,
        indexacion: f.indexacion,
        tipo: f.tipo,
        url: f.url,
        similitud: f.similitud,
      });
    }
  }
  return Array.from(porFuente.values()).sort((a, b) => b.similitud - a.similitud);
}
