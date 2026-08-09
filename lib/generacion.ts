/**
 * lib/generacion.ts — GENERACIÓN del pipeline RAG (la "G" de RAG).
 *
 * QUÉ HACE: recibe los fragmentos recuperados (lib/rag.ts) y el historial, arma
 * el contexto y pide a la API de Anthropic una respuesta redactada, sujeta a un
 * system prompt anti-alucinación. Devuelve el texto generado.
 *
 * ROL EN EL SISTEMA: segundo paso de la capa semántica, del lado servidor.
 * Consume lo que produce la recuperación y entrega la respuesta final a las
 * rutas API.
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - Modelo configurable por `ANTHROPIC_MODEL` (por defecto `claude-sonnet-5`),
 *    para poder equilibrar coste/calidad en la defensa sin tocar código.
 *  - DEGRADACIÓN ELEGANTE: si falta `ANTHROPIC_API_KEY`, no se llama al modelo;
 *    las rutas devuelven los fragmentos recuperados + un aviso. El RAG así sigue
 *    siendo útil (recuperación con citas) aun sin créditos de generación.
 *  - El historial se recorta a los últimos turnos para acotar coste y deriva.
 *  - El SYSTEM_PROMPT (abajo) codifica las reglas del dominio: responder solo con
 *    el contexto, no inventar, citar por apellido y año, priorizar la evidencia
 *    arbitrada sobre la prensa, aclarar que las detecciones son pre-calculadas y
 *    la telemetría simulada, y que NO se mide mercurio en tiempo real.
 *
 * PARA EL INFORME: aquí se materializa la mitigación de alucinaciones mediante
 * "grounding" (el modelo solo puede usar el contexto recuperado) y la política
 * de citación. El prompt es el control principal de fiabilidad del sistema.
 */
import Anthropic from "@anthropic-ai/sdk";
import { construirContexto, type FragmentoRecuperado } from "./rag";

/**
 * System prompt del RAG (basado en la especificación §6).
 * El modelo responde EXCLUSIVAMENTE con los fragmentos recuperados, cita por
 * apellido y año, distingue prensa de ciencia arbitrada y declara cuando el
 * corpus no cubre algo. Nunca inventa citas ni datos.
 */
const SYSTEM_PROMPT = `Eres el asistente documental de Centinela Orinoco, un sistema de monitoreo de minería ilegal en el Arco Minero del Orinoco (Venezuela).

Respondes EXCLUSIVAMENTE con base en los fragmentos de contexto que se te proporcionan. Reglas estrictas:

1. Si los fragmentos no contienen información suficiente para responder, dilo explícitamente ("El corpus disponible no cubre este aspecto..."). Nunca completes con conocimiento general.
2. Nunca inventes citas, autores, años, cifras ni DOIs.
3. Cita a los autores por apellido y año cuando afirmes algo que provenga de una fuente, por ejemplo: (García-Sánchez, 2008).
4. Cada fragmento indica si su fuente es "revisada por pares" o "PRENSA — no revisada por pares". Prioriza la evidencia arbitrada. Si citas una fuente de prensa, señálalo explícitamente (p. ej. "según una nota de prensa (no arbitrada)...") y no la presentes con el mismo peso que la ciencia revisada.
5. Distingue lo que las fuentes afirman de lo que son inferencias tuyas.
6. Si el usuario pregunta por datos de campo en tiempo real, aclara que en este prototipo las detecciones de minería son pre-calculadas y la telemetría de sensores es simulada.
7. El sistema NO mide mercurio en campo; los sensores miden proxies (turbidez, pH, conductividad). No afirmes que hay mediciones de mercurio en tiempo real.
8. Responde en español, con precisión técnica y sin adornos. Sé conciso.`;

export interface ResultadoGeneracion {
  respuesta: string;
  generacion_deshabilitada: boolean;
  aviso?: string;
}

/** Turno del historial de conversación (chat). */
export interface TurnoHistorial {
  rol: "usuario" | "asistente";
  texto: string;
}

/**
 * Genera una respuesta anclada en los fragmentos recuperados.
 * Si falta ANTHROPIC_API_KEY, degrada con elegancia: devuelve los fragmentos
 * recuperados (sin redacción del LLM) y marca la generación como deshabilitada.
 */
export async function generarRespuestaRAG(
  pregunta: string,
  fragmentos: FragmentoRecuperado[],
  historial: TurnoHistorial[] = []
): Promise<ResultadoGeneracion> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  // Fallback sin LLM: mostrar los fragmentos recuperados con transparencia.
  if (!apiKey) {
    const resumen =
      fragmentos.length > 0
        ? fragmentos
            .map((f, i) => {
              const marca = f.tipo === "prensa" ? " (PRENSA, no arbitrada)" : "";
              return `[Fuente ${i + 1}] ${f.autores} (${f.anio})${marca}:\n${f.fragmento}`;
            })
            .join("\n\n")
        : "No se recuperaron fragmentos del corpus.";
    return {
      respuesta: resumen,
      generacion_deshabilitada: true,
      aviso:
        "Generación con LLM deshabilitada (falta ANTHROPIC_API_KEY). Se muestran los fragmentos recuperados por similitud vectorial, sin redacción del modelo.",
    };
  }

  const modelo = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
  const anthropic = new Anthropic({ apiKey });

  const contexto = construirContexto(fragmentos);
  const mensajeUsuario = `Contexto recuperado del corpus:\n\n${contexto}\n\n---\n\nPregunta: ${pregunta}\n\nResponde siguiendo estrictamente las reglas del sistema.`;

  // Historial previo (solo texto) + turno actual con su contexto recuperado.
  const mensajes: Anthropic.MessageParam[] = [
    ...historial.slice(-6).map((t) => ({
      role: (t.rol === "usuario" ? "user" : "assistant") as "user" | "assistant",
      content: t.texto,
    })),
    { role: "user" as const, content: mensajeUsuario },
  ];

  const respuesta = await anthropic.messages.create({
    model: modelo,
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: mensajes,
  });

  const texto = respuesta.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();

  return {
    respuesta: texto || "No se obtuvo respuesta del modelo.",
    generacion_deshabilitada: false,
  };
}
