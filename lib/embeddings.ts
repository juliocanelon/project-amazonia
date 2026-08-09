/**
 * lib/embeddings.ts — cliente de embeddings de Voyage AI.
 *
 * QUÉ HACE: convierte texto (fragmentos del corpus o consultas del usuario) en
 * vectores de 1024 dimensiones. Distingue `input_type` "document" (al indexar) y
 * "query" (al consultar), que Voyage optimiza por separado.
 *
 * ROL EN EL SISTEMA: capa de acceso al proveedor de embeddings. Es la frontera
 * entre el texto y el espacio vectorial; la usan tanto el indexador
 * (`scripts/indexar-corpus.ts`) como la recuperación (`lib/rag.ts`).
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - Voyage `voyage-3.5-lite`: modelo MULTILINGÜE (el corpus está en español),
 *    con capa gratuita sin tarjeta y 200M tokens gratuitos.
 *  - Dimensión 1024 acoplada al esquema `vector(1024)` de Supabase: cambiar de
 *    modelo obliga a ajustar el esquema y re-indexar (documentado en el README).
 *  - Aislar el proveedor en un único módulo permite sustituirlo (p. ej. por una
 *    alternativa local con Transformers.js) tocando solo este archivo.
 *
 * PARA EL INFORME: la elección de un modelo multilingüe es deliberada por el
 * idioma del corpus. Todas las llamadas ocurren en el servidor (nunca en el
 * cliente), preservando la confidencialidad de la clave.
 */

const VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";

export const DIMENSION_EMBEDDING = 1024;

export type TipoEntrada = "query" | "document";

/**
 * Genera embeddings para uno o varios textos.
 * @param textos  lista de textos a vectorizar
 * @param tipo    "document" al indexar el corpus, "query" al consultar
 */
export async function generarEmbeddings(
  textos: string[],
  tipo: TipoEntrada
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Falta VOYAGE_API_KEY. Configúrala en .env.local (ver .env.example)."
    );
  }
  const modelo = process.env.VOYAGE_MODEL || "voyage-3.5-lite";

  const res = await fetch(VOYAGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      input: textos,
      model: modelo,
      input_type: tipo,
      output_dimension: DIMENSION_EMBEDDING,
    }),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`Error de Voyage AI (${res.status}): ${detalle}`);
  }

  const json = (await res.json()) as {
    data: { embedding: number[]; index: number }[];
  };
  // Ordenar por índice para garantizar la correspondencia con la entrada.
  return json.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}

/** Conveniencia: embedding de una sola consulta. */
export async function embeddingConsulta(texto: string): Promise<number[]> {
  const [emb] = await generarEmbeddings([texto], "query");
  return emb;
}
