/**
 * app/api/interpretacion/route.ts — interpretación con IA de una serie de
 * telemetría (turbidez o conductividad).
 *
 * QUÉ HACE: recibe el resumen numérico de una variable del sensor y devuelve una
 * explicación breve, generada por el LLM, de QUÉ MIDE esa variable, por qué es un
 * PROXY de minería aluvial y qué muestra la serie (cualitativamente).
 *
 * ROL EN EL SISTEMA: apoya a la capa SIMULADA (gráficas de telemetría) con una
 * lectura interpretativa. No es RAG sobre el corpus: es una explicación acotada
 * al dominio y al resumen de datos que se le entrega.
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - CACHÉ por (sensor, variable): la telemetría es determinista, así que la
 *    interpretación se calcula una vez y se reutiliza (ahorra llamadas al LLM).
 *  - DEGRADACIÓN ELEGANTE: sin ANTHROPIC_API_KEY, devuelve una explicación
 *    estática por variable, marcada como no generada por IA.
 *  - HONESTIDAD DE DOMINIO: el prompt obliga a declarar que los datos son
 *    simulados, que NO se mide mercurio (son proxies) y a no inventar cifras.
 *
 * PARA EL INFORME: muestra un uso "de apoyo" del LLM (explicación de variables
 * ambientales) distinto del RAG documental, con las mismas salvaguardas de
 * transparencia.
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

// Caché en memoria: clave `${sensorId}:${variable}` → interpretación.
const cacheInterpretacion = new Map<string, string>();

interface ResumenSerie {
  min: number;
  max: number;
  prom: number;
  pico: number;
  fechaPico: string;
  baseline: number;
}

const SYSTEM_PROMPT = `Eres un analista ambiental. Explicas de forma breve y clara qué significa una variable de calidad del agua usada como PROXY de minería aurífera aluvial (ASGM) en el Arco Minero del Orinoco (Venezuela), y describes cualitativamente una serie temporal.

Reglas estrictas:
1. La telemetría es SIMULADA y demostrativa; no son mediciones reales de campo. Decláralo.
2. El sistema NO mide mercurio. Estas variables (turbidez, pH, conductividad) son PROXIES que orientan dónde priorizar el muestreo de laboratorio; no afirmes que miden mercurio.
3. No inventes cifras: usa únicamente los valores del resumen que se te entrega.
4. Relaciona el pico con el periodo del disturbio detectado si procede.
5. Responde en español, en 2 o 3 frases, con tono técnico y directo. Sin encabezados ni listas.`;

/** Explicación de reserva cuando no hay clave de Anthropic. */
function interpretacionEstatica(variable: string): string {
  if (variable === "turbidez") {
    return "La turbidez (NTU) mide las partículas en suspensión en el agua. La minería aluvial remueve sedimentos hacia los ríos, por lo que un aumento sostenido de turbidez funciona como proxy de actividad minera. En esta serie simulada el pico coincide con el periodo del disturbio; no representa una medición de mercurio.";
  }
  return "La conductividad (µS/cm) refleja la concentración de iones disueltos en el agua. La remoción de sedimentos y los aportes asociados a la minería tienden a elevarla, por lo que sirve como proxy de perturbación. En esta serie simulada aumenta durante el disturbio; es un indicador indirecto, no una medición de mercurio.";
}

export async function POST(req: NextRequest) {
  try {
    const { sensorId, variable, etiqueta, unidad, cuenca, resumen, fechaDeteccion } =
      (await req.json()) as {
        sensorId?: string;
        variable?: string;
        etiqueta?: string;
        unidad?: string;
        cuenca?: string;
        resumen?: ResumenSerie;
        fechaDeteccion?: string;
      };

    if (
      typeof sensorId !== "string" ||
      (variable !== "turbidez" && variable !== "conductividad") ||
      !resumen
    ) {
      return NextResponse.json(
        { error: "Se requieren 'sensorId', 'variable' (turbidez|conductividad) y 'resumen'." },
        { status: 400 }
      );
    }

    const clave = `${sensorId}:${variable}`;
    const cacheada = cacheInterpretacion.get(clave);
    if (cacheada) {
      return NextResponse.json({ interpretacion: cacheada, cacheado: true });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      const texto = interpretacionEstatica(variable);
      cacheInterpretacion.set(clave, texto);
      return NextResponse.json({
        interpretacion: texto,
        cacheado: false,
        generacion_deshabilitada: true,
      });
    }

    const modelo = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
    const anthropic = new Anthropic({ apiKey });

    const mensajeUsuario =
      `Variable: ${etiqueta ?? variable} (${unidad ?? ""}). Cuenca: ${cuenca ?? "—"}. ` +
      `Fecha de detección del disturbio: ${fechaDeteccion ?? "—"}. ` +
      `Resumen de la serie SIMULADA: mínimo ${resumen.min}, máximo ${resumen.max}, ` +
      `promedio ${resumen.prom}, valor pico ${resumen.pico} el ${resumen.fechaPico}, ` +
      `línea base aproximada ${resumen.baseline}. ` +
      `Explica qué mide esta variable y por qué es un proxy de minería, y describe brevemente qué muestra esta serie.`;

    const resp = await anthropic.messages.create({
      model: modelo,
      max_tokens: 320,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: mensajeUsuario }],
    });

    const texto = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    if (texto) cacheInterpretacion.set(clave, texto);

    return NextResponse.json({ interpretacion: texto, cacheado: false });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    console.error("[/api/interpretacion]", mensaje);
    return NextResponse.json(
      { error: `No se pudo interpretar la serie: ${mensaje}` },
      { status: 500 }
    );
  }
}
