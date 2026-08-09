/**
 * Cliente de embeddings de Voyage AI.
 *
 * Voyage se eligió por su capa gratuita amplia y por ofrecer modelos
 * multilingües (el corpus está en español). Se usa voyage-3.5-lite por
 * defecto (1024 dimensiones). Todas las llamadas ocurren en el servidor.
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
