/**
 * ChatRAG — asistente conversacional sobre el corpus (capa RAG real).
 *
 * QUÉ HACE: interfaz de chat que envía cada pregunta (con el historial reciente)
 * a `/api/chat` y muestra la respuesta generada junto con las fuentes citadas.
 * Ofrece preguntas de ejemplo para orientar al evaluador.
 *
 * ROL EN EL SISTEMA: es la vía de consulta libre a la capa semántica, en la ruta
 * `/asistente`. Complementa a FichaContextoRAG (que ancla el RAG a una alerta):
 * aquí el usuario formula cualquier consulta sobre el corpus.
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - El historial se envía al servidor en cada turno para dar continuidad
 *    conversacional; el servidor recorta a los últimos turnos para acotar coste
 *    y evitar deriva.
 *  - Estado puramente local (useState): no se persiste la conversación, acorde a
 *    un prototipo de defensa.
 *  - Las preguntas de ejemplo están redactadas para caer dentro de la cobertura
 *    real del corpus (mercurio, radar vs óptico, detección satelital,
 *    degradación forestal).
 *
 * PARA EL INFORME: evidencia el comportamiento anti-alucinación —si el corpus no
 * cubre algo, el asistente lo declara— y la trazabilidad de cada afirmación a
 * fuentes reales (autor, año, similitud).
 */
"use client";

import { useRef, useState } from "react";
import type { RespuestaRAG } from "@/lib/tipos";
import ListaFuentes from "./ListaFuentes";
import EtiquetaOrigen from "./EtiquetaOrigen";

interface MensajeChat {
  rol: "usuario" | "asistente";
  texto: string;
  datos?: RespuestaRAG; // en respuestas del asistente
  error?: boolean;
}

const PREGUNTAS_EJEMPLO = [
  "¿Qué evidencia científica hay de contaminación por mercurio en el río Cuyuní?",
  "¿Por qué se usa radar en lugar de imágenes ópticas para detectar minería en la Amazonía?",
  "¿Qué técnicas se han aplicado para detectar minería artesanal desde satélite?",
  "¿Qué se sabe sobre la degradación forestal en la Amazonía venezolana?",
];

export default function ChatRAG() {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [entrada, setEntrada] = useState("");
  const [cargando, setCargando] = useState(false);
  const finRef = useRef<HTMLDivElement>(null);

  async function enviar(pregunta: string) {
    const texto = pregunta.trim();
    if (!texto || cargando) return;

    // Historial previo (antes de añadir el turno actual), solo rol + texto.
    const historial = mensajes.map((m) => ({ rol: m.rol, texto: m.texto }));

    setMensajes((m) => [...m, { rol: "usuario", texto }]);
    setEntrada("");
    setCargando(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensaje: texto, historial }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);

      const datos = json as RespuestaRAG;
      setMensajes((m) => [
        ...m,
        { rol: "asistente", texto: datos.respuesta, datos },
      ]);
    } catch (e) {
      setMensajes((m) => [
        ...m,
        {
          rol: "asistente",
          texto:
            e instanceof Error ? e.message : "Error al consultar el asistente.",
          error: true,
        },
      ]);
    } finally {
      setCargando(false);
      // Desplazar al final tras renderizar.
      setTimeout(() => finRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-96px)] max-w-3xl flex-col">
      {/* Encabezado */}
      <div className="border-b border-base-700 px-4 py-3">
        <div className="flex items-center gap-2">
          <h1 className="text-base font-semibold text-texto-primario">
            Asistente científico RAG
          </h1>
          <EtiquetaOrigen
            origen="real"
            titulo="Respuestas ancladas en el corpus científico real, con citas verificables."
          />
        </div>
        <p className="mt-1 text-[12px] text-texto-tenue">
          Responde a partir del corpus de 12 artículos científicos. Cada
          respuesta muestra las fuentes consultadas. Si el corpus no cubre algo,
          lo declara en lugar de inventar.
        </p>
      </div>

      {/* Conversación */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {mensajes.length === 0 && (
          <div className="pt-6">
            <p className="mb-3 text-center text-[13px] text-texto-tenue">
              Prueba con una de estas preguntas:
            </p>
            <div className="mx-auto grid max-w-xl gap-2">
              {PREGUNTAS_EJEMPLO.map((p) => (
                <button
                  key={p}
                  onClick={() => enviar(p)}
                  disabled={cargando}
                  className="rounded-lg border border-base-700 bg-base-800/50 px-3 py-2 text-left text-[13px] text-texto-secundario transition-colors hover:border-base-600 hover:bg-base-800 disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {mensajes.map((m, i) => (
          <MensajeBurbuja key={i} mensaje={m} />
        ))}

        {cargando && (
          <div className="flex items-center gap-2 text-[13px] text-texto-tenue">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-texto-tenue [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-texto-tenue [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-texto-tenue" />
            </span>
            Recuperando fragmentos y generando respuesta…
          </div>
        )}
        <div ref={finRef} />
      </div>

      {/* Entrada */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(entrada);
        }}
        className="border-t border-base-700 px-4 py-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(entrada);
              }
            }}
            rows={1}
            placeholder="Escribe tu pregunta sobre el corpus científico…"
            className="max-h-32 flex-1 resize-none rounded-lg border border-base-700 bg-base-800 px-3 py-2 text-[14px] text-texto-primario placeholder:text-texto-tenue focus:border-acento focus:outline-none"
          />
          <button
            type="submit"
            disabled={cargando || !entrada.trim()}
            className="rounded-lg bg-acento/90 px-4 py-2 text-[14px] font-medium text-base-900 transition-colors hover:bg-acento disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
}

function MensajeBurbuja({ mensaje }: { mensaje: MensajeChat }) {
  if (mensaje.rol === "usuario") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-lg rounded-br-sm bg-base-700 px-3 py-2 text-[14px] text-texto-primario">
          {mensaje.texto}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] rounded-lg rounded-bl-sm border border-base-700 bg-base-800/60 px-3 py-2.5">
        {mensaje.datos?.aviso && (
          <p className="mb-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
            {mensaje.datos.aviso}
          </p>
        )}
        <p
          className={`whitespace-pre-line text-[14px] leading-relaxed ${
            mensaje.error ? "text-severidad-alta" : "text-texto-secundario"
          }`}
        >
          {mensaje.texto}
        </p>
        {mensaje.datos && <ListaFuentes fuentes={mensaje.datos.fuentes} />}
      </div>
    </div>
  );
}
