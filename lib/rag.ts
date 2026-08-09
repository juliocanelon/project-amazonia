/**
 * lib/rag.ts — RECUPERACIÓN del pipeline RAG (la "R" de RAG).
 *
 * QUÉ HACE: dada una consulta, genera su embedding, llama a la función
 * `match_fragmentos` de Supabase/pgvector (similitud coseno) y devuelve los
 * fragmentos más relevantes. Además arma el contexto que se le pasa al LLM y
 * extrae la lista de fuentes citadas (deduplicadas por fuente).
 *
 * ROL EN EL SISTEMA: núcleo de la capa semántica, del lado servidor. Es el
 * puente entre la base vectorial y la generación (lib/generacion.ts). Lo usan
 * las dos rutas API (`/api/contexto` y `/api/chat`).
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - La similitud se calcula en la base de datos (pgvector + índice HNSW), no en
 *    la app: escala mejor y mantiene los datos en un único lugar.
 *  - `construirContexto` marca cada fragmento como "revisada por pares" o
 *    "PRENSA — no revisada por pares", de modo que la distinción de fiabilidad
 *    viaja hasta el prompt del modelo.
 *  - `extraerFuentes` deduplica por `fuente_id`: un documento citado en varios
 *    fragmentos aparece una sola vez en la lista de fuentes.
 *
 * PARA EL INFORME: implementa la recuperación densa multilingüe. Solo se usa en
 * el servidor, por lo que las claves nunca se exponen. La calidad de las
 * respuestas depende directamente de este paso (qué fragmentos se recuperan).
 */
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
