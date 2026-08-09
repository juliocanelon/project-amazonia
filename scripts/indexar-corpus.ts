/**
 * Indexador del corpus en Supabase/pgvector.
 *
 * Lee cada archivo .md de /corpus, extrae los metadatos bibliográficos del
 * front-matter, divide el cuerpo en fragmentos (~500 tokens con solapamiento
 * de ~50), genera sus embeddings con Voyage AI y los inserta en la tabla
 * `fragmentos_corpus`.
 *
 * El corpus es MIXTO: fuentes revisadas por pares (tipo "resumen_elaborado") y
 * fuentes de prensa no arbitradas (tipo "prensa"). El campo `tipo` se preserva
 * para poder distinguirlas al citar.
 *
 * Es RE-EJECUTABLE (idempotente): por cada `fuente_id` borra las filas previas
 * antes de insertar. Para reemplazar un resumen: edita/añade archivos en
 * /corpus y ejecuta de nuevo `npm run indexar-corpus`.
 *
 * Requisitos previos:
 *   1. Haber ejecutado supabase/schema.sql en el proyecto de Supabase.
 *   2. Tener configuradas VOYAGE_API_KEY y las claves de Supabase en .env.local.
 *
 * Ejecutar:  npm run indexar-corpus
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { config as cargarEnv } from "dotenv";
import { generarEmbeddings } from "../lib/embeddings";
import { obtenerSupabaseServidor } from "../lib/supabaseServidor";

// Cargar variables de entorno desde .env.local (y .env como respaldo).
cargarEnv({ path: ".env.local" });
cargarEnv();

const DIR_CORPUS = join(process.cwd(), "corpus");

// Chunking: ~500 tokens por fragmento con ~50 de solapamiento.
// Aproximación tokens→caracteres (~4 chars/token) para no depender de un tokenizador.
const CHARS_POR_TOKEN = 4;
const MAX_CHARS_CHUNK = 500 * CHARS_POR_TOKEN; // ~2000 chars
const SOLAPAMIENTO_CHARS = 50 * CHARS_POR_TOKEN; // ~200 chars

interface Metadatos {
  fuente_id: string;
  autores: string;
  anio: number;
  titulo: string;
  revista: string;
  doi: string | null;
  indexacion: string | null;
  tipo: string;
  fecha: string | null;
  url: string | null;
}

/** Parser mínimo de front-matter YAML para nuestro formato controlado. */
function parsearFrontMatter(texto: string): { meta: Record<string, string>; cuerpo: string } {
  const match = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, cuerpo: texto };

  const [, bloque, cuerpo] = match;
  const meta: Record<string, string> = {};
  for (const linea of bloque.split(/\r?\n/)) {
    const m = linea.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    let valor = m[2].trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    meta[m[1]] = valor;
  }
  return { meta, cuerpo };
}

/** Limpia el cuerpo: quita la nota (blockquote) y los encabezados markdown. */
function limpiarCuerpo(cuerpo: string): string {
  return cuerpo
    .split(/\r?\n/)
    .filter((l) => !l.trim().startsWith(">"))
    .join("\n")
    .replace(/^#+\s.*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Divide el texto en fragmentos de hasta ~MAX_CHARS_CHUNK respetando párrafos,
 * con un solapamiento de ~SOLAPAMIENTO_CHARS entre fragmentos consecutivos para
 * no perder contexto en los cortes.
 */
function fragmentar(texto: string): string[] {
  const parrafos = texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let actual = "";

  for (const p of parrafos) {
    const candidato = actual ? actual + "\n\n" + p : p;
    if (candidato.length > MAX_CHARS_CHUNK && actual) {
      chunks.push(actual);
      // Iniciar el siguiente con la cola del anterior (solapamiento) + el párrafo.
      const cola = actual.slice(-SOLAPAMIENTO_CHARS);
      actual = cola + "\n\n" + p;
    } else {
      actual = candidato;
    }
  }
  if (actual.trim()) chunks.push(actual);
  return chunks;
}

async function main() {
  const supabase = obtenerSupabaseServidor();
  const archivos = readdirSync(DIR_CORPUS).filter((f) => f.endsWith(".md"));

  if (archivos.length === 0) {
    console.error("No se encontraron archivos .md en /corpus");
    process.exit(1);
  }

  console.log(`Indexando ${archivos.length} archivos del corpus…\n`);
  let totalChunks = 0;
  let cientificas = 0;
  let prensa = 0;

  for (const archivo of archivos.sort()) {
    const ruta = join(DIR_CORPUS, archivo);
    const { meta, cuerpo } = parsearFrontMatter(readFileSync(ruta, "utf-8"));

    // `id` es la clave; se acepta `ref` por compatibilidad con versiones previas.
    const fuente_id = meta.id || meta.ref;
    const faltantes = ["autores", "anio", "titulo"].filter((k) => !meta[k]);
    if (!fuente_id || faltantes.length) {
      console.warn(
        `  ⚠ ${archivo}: faltan metadatos (${[!fuente_id ? "id" : "", ...faltantes]
          .filter(Boolean)
          .join(", ")}). Se omite.`
      );
      continue;
    }

    const metadatos: Metadatos = {
      fuente_id,
      autores: meta.autores,
      anio: parseInt(meta.anio, 10),
      titulo: meta.titulo,
      revista: meta.revista || "",
      doi: meta.doi && meta.doi !== "null" ? meta.doi : null,
      indexacion: meta.indexacion && meta.indexacion !== "null" ? meta.indexacion : null,
      tipo: meta.tipo === "prensa" ? "prensa" : "resumen_elaborado",
      fecha: meta.fecha && meta.fecha !== "null" ? meta.fecha : null,
      url: meta.url && meta.url !== "null" ? meta.url : null,
    };

    const chunks = fragmentar(limpiarCuerpo(cuerpo));
    if (chunks.length === 0) {
      console.warn(`  ⚠ ${archivo}: cuerpo vacío. Se omite.`);
      continue;
    }

    const embeddings = await generarEmbeddings(chunks, "document");

    // Borrar filas previas de esta fuente (idempotente).
    const { error: errorBorrado } = await supabase
      .from("fragmentos_corpus")
      .delete()
      .eq("fuente_id", metadatos.fuente_id);
    if (errorBorrado) {
      throw new Error(`Error borrando '${metadatos.fuente_id}': ${errorBorrado.message}`);
    }

    const filas = chunks.map((fragmento, i) => ({
      fuente_id: metadatos.fuente_id,
      autores: metadatos.autores,
      anio: metadatos.anio,
      titulo: metadatos.titulo,
      revista: metadatos.revista,
      doi: metadatos.doi,
      indexacion: metadatos.indexacion,
      tipo: metadatos.tipo,
      fecha: metadatos.fecha,
      url: metadatos.url,
      fragmento,
      posicion: i,
      embedding: embeddings[i],
    }));

    const { error: errorInsercion } = await supabase.from("fragmentos_corpus").insert(filas);
    if (errorInsercion) {
      throw new Error(`Error insertando '${metadatos.fuente_id}': ${errorInsercion.message}`);
    }

    totalChunks += chunks.length;
    if (metadatos.tipo === "prensa") prensa++;
    else cientificas++;
    const marca = metadatos.tipo === "prensa" ? "[prensa]" : "[ciencia]";
    console.log(`  ✓ ${metadatos.fuente_id.padEnd(24)} ${String(chunks.length).padStart(2)} frag. ${marca}`);
  }

  console.log(
    `\n✓ Indexación completa: ${totalChunks} fragmentos de ${cientificas} fuentes científicas y ${prensa} de prensa.`
  );
}

main().catch((e) => {
  console.error("\n✗ Error en la indexación:", e.message);
  process.exit(1);
});
