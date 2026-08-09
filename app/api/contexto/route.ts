import { NextRequest, NextResponse } from "next/server";
import { recuperarFragmentos, extraerFuentes } from "@/lib/rag";
import { generarRespuestaRAG } from "@/lib/generacion";
import type { ColeccionAlertas } from "@/lib/tipos";

// Ejecutar en Node.js (el SDK de Anthropic y Supabase requieren APIs de Node).
export const runtime = "nodejs";

/**
 * Ficha de contexto científico para una alerta.
 * Recibe { alertaId }, localiza la alerta en el GeoJSON, recupera los
 * fragmentos más relevantes del corpus y genera la ficha con citas.
 * Devuelve { ficha, fuentes[], ... }.
 */
export async function POST(req: NextRequest) {
  try {
    const { alertaId } = await req.json();

    if (typeof alertaId !== "string" || !alertaId.trim()) {
      return NextResponse.json(
        { error: "El campo 'alertaId' es obligatorio." },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      ficha: respuesta,
      fuentes: extraerFuentes(fragmentos),
      generacion_deshabilitada,
      aviso,
    });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    console.error("[/api/contexto]", mensaje);
    return NextResponse.json(
      { error: `No se pudo generar el contexto: ${mensaje}` },
      { status: 500 }
    );
  }
}
