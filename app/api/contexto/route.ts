/**
 * app/api/contexto/route.ts — endpoint RAG "ficha de una alerta".
 *
 * QUÉ HACE: recibe { alertaId }, localiza la alerta en el GeoJSON, construye una
 * consulta a partir de sus atributos, recupera los fragmentos más relevantes del
 * corpus y genera una ficha de contexto con citas. Devuelve { ficha, fuentes[] }.
 *
 * ROL EN EL SISTEMA: es la frontera servidor de la capa RAG para el tablero.
 * Orquesta recuperación (lib/rag) + generación (lib/generacion) y es el único
 * lugar donde se tocan las claves de API.
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - `runtime = "nodejs"` (no Edge): los SDK de Anthropic y Supabase requieren
 *    APIs de Node.
 *  - El GeoJSON se lee por HTTP desde el `origin` de la petición, no del sistema
 *    de archivos, para funcionar de forma robusta en el entorno serverless de
 *    Vercel.
 *  - Toda la lógica sensible vive aquí (servidor); el cliente solo consume JSON.
 *  - CACHÉ POR ALERTA (H2·A): las alertas son estáticas y deterministas, así que
 *    la ficha de cada `alertaId` se calcula una sola vez y se reutiliza. Esto
 *    evita repetir llamadas a Voyage/Anthropic al reabrir la misma alerta (el
 *    patrón típico de la demo) y elimina el fallo intermitente por límite de
 *    tasa. La caché es en memoria del proceso; en serverless se rehace tras un
 *    arranque en frío, lo cual es aceptable para un prototipo.
 *
 * PARA EL INFORME: es el punto de integración entre el evento geoespacial
 * (pre-calculado) y la capa semántica (real). Ejemplifica cómo se "aterriza" el
 * RAG a un caso de uso operativo concreto.
 */
import { NextRequest, NextResponse } from "next/server";
import { recuperarFragmentos, extraerFuentes } from "@/lib/rag";
import { generarRespuestaRAG } from "@/lib/generacion";
import type { ColeccionAlertas } from "@/lib/tipos";

// Ejecutar en Node.js (el SDK de Anthropic y Supabase requieren APIs de Node).
export const runtime = "nodejs";

// Caché en memoria de fichas ya generadas, indexada por alertaId (H2·A).
// Solo se guardan respuestas exitosas: si hubo un error (p. ej. 429), no se
// cachea y el siguiente clic vuelve a intentarlo.
const cacheFichas = new Map<string, unknown>();

export async function POST(req: NextRequest) {
  try {
    const { alertaId } = await req.json();

    if (typeof alertaId !== "string" || !alertaId.trim()) {
      return NextResponse.json(
        { error: "El campo 'alertaId' es obligatorio." },
        { status: 400 }
      );
    }

    // Si ya se generó la ficha de esta alerta, devolverla sin recomputar.
    const cacheada = cacheFichas.get(alertaId);
    if (cacheada) return NextResponse.json(cacheada);

    // Cargar el GeoJSON estático desde el propio despliegue y localizar la alerta.
    const resGeo = await fetch(`${req.nextUrl.origin}/data/alertas.geojson`, {
      cache: "no-store",
    });
    if (!resGeo.ok) throw new Error("No se pudo cargar alertas.geojson");
    const coleccion = (await resGeo.json()) as ColeccionAlertas;
    const feature = coleccion.features.find((f) => f.properties.id === alertaId);

    if (!feature) {
      return NextResponse.json(
        { error: `No se encontró la alerta '${alertaId}'.` },
        { status: 404 }
      );
    }
    const alerta = feature.properties;

    // Consulta para la recuperación vectorial (orientada a la cuenca e impactos/técnicas).
    const consulta =
      `Minería ilegal de oro en la cuenca del ${alerta.cuenca}, en el Arco Minero del Orinoco (Venezuela). ` +
      `Contaminación por mercurio en agua y suelos, sedimentos y turbidez, y técnicas de detección satelital ` +
      `(radar SAR, imágenes ópticas) de minería aluvial.`;

    const fragmentos = await recuperarFragmentos(consulta, 6);

    // Pregunta específica para generar la ficha.
    const pregunta =
      `Se ha detectado una posible actividad de minería en la cuenca del ${alerta.cuenca} ` +
      `(superficie estimada ${alerta.superficie_ha} ha, severidad ${alerta.severidad}, ` +
      `persistencia ${alerta.persistencia_dias} días, a ${alerta.distancia_area_protegida_km} km de un área protegida, ` +
      `detectada por ${alerta.sensor_origen}). ` +
      `A partir del corpus, explica brevemente (1) qué se sabe científicamente sobre los impactos ambientales de la minería en esta cuenca o en cuencas comparables y (2) por qué es plausible o relevante esta detección según las técnicas de teledetección documentadas. Sé transparente si el corpus no cubre bien algún aspecto.`;

    const { respuesta, generacion_deshabilitada, aviso } =
      await generarRespuestaRAG(pregunta, fragmentos);

    const payload = {
      ficha: respuesta,
      fuentes: extraerFuentes(fragmentos),
      generacion_deshabilitada,
      aviso,
    };

    // Cachear solo respuestas exitosas para futuros clics en la misma alerta.
    cacheFichas.set(alertaId, payload);

    return NextResponse.json(payload);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    console.error("[/api/contexto]", mensaje);
    return NextResponse.json(
      { error: `No se pudo generar el contexto: ${mensaje}` },
      { status: 500 }
    );
  }
}
