/**
 * app/api/chat/route.ts — endpoint RAG "asistente conversacional".
 *
 * QUÉ HACE: recibe { mensaje, historial? }, recupera fragmentos por similitud
 * vectorial y genera una respuesta anclada EXCLUSIVAMENTE en esos fragmentos,
 * con sus citas. Devuelve { respuesta, fuentes[] }.
 *
 * ROL EN EL SISTEMA: frontera servidor de la capa RAG para la ruta `/asistente`.
 * Es la variante de consulta libre (a diferencia de `/api/contexto`, anclado a
 * una alerta). Comparte el mismo núcleo (lib/rag + lib/generacion).
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - Acepta y valida un `historial` (turnos previos) para dar continuidad
 *    conversacional; la generación lo recorta a los últimos turnos.
 *  - `runtime = "nodejs"` por los SDK de Anthropic y Supabase.
 *  - Misma degradación elegante: sin clave de Anthropic, responde con los
 *    fragmentos recuperados + aviso.
 *
 * PARA EL INFORME: demuestra el uso interactivo de la memoria semántica; junto a
 * `/api/contexto` conforma la superficie de consumo del RAG del sistema.
 */
import { NextRequest, NextResponse } from "next/server";
import { recuperarFragmentos, extraerFuentes } from "@/lib/rag";
import { generarRespuestaRAG, type TurnoHistorial } from "@/lib/generacion";
import type { RespuestaRAG } from "@/lib/tipos";

export const runtime = "nodejs";
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
