import { NextRequest, NextResponse } from "next/server";
import { recuperarFragmentos, extraerFuentes } from "@/lib/rag";
import { generarRespuestaRAG, type TurnoHistorial } from "@/lib/generacion";
import type { RespuestaRAG } from "@/lib/tipos";

export const runtime = "nodejs";

/**
 * Asistente conversacional RAG.
 * Recibe { mensaje, historial? }, recupera fragmentos por similitud vectorial
 * y genera una respuesta anclada exclusivamente en esos fragmentos, con citas.
 */
export async function POST(req: NextRequest) {
  try {
    const { mensaje, historial } = await req.json();

    if (typeof mensaje !== "string" || !mensaje.trim()) {
      return NextResponse.json(
        { error: "El campo 'mensaje' es obligatorio." },
        { status: 400 }
      );
    }

    const historialValido: TurnoHistorial[] = Array.isArray(historial)
      ? historial.filter(
          (t): t is TurnoHistorial =>
            t &&
            (t.rol === "usuario" || t.rol === "asistente") &&
            typeof t.texto === "string"
        )
      : [];

    const fragmentos = await recuperarFragmentos(mensaje, 6);
    const { respuesta, generacion_deshabilitada, aviso } =
      await generarRespuestaRAG(mensaje, fragmentos, historialValido);

    const payload: RespuestaRAG = {
      respuesta,
      fuentes: extraerFuentes(fragmentos),
      generacion_deshabilitada,
      aviso,
    };
    return NextResponse.json(payload);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    console.error("[/api/chat]", mensaje);
    return NextResponse.json(
      { error: `No se pudo procesar la consulta: ${mensaje}` },
      { status: 500 }
    );
  }
}
