"use client";

import { useEffect, useState } from "react";
import type { PropiedadesAlerta, FuenteCitada } from "@/lib/tipos";
import EtiquetaOrigen from "./EtiquetaOrigen";
import ListaFuentes from "./ListaFuentes";

interface RespuestaContexto {
  ficha: string;
  fuentes: FuenteCitada[];
  generacion_deshabilitada?: boolean;
  aviso?: string;
}

/**
 * FichaContextoRAG — contexto científico de una alerta, generado por el RAG real.
 *
 * QUÉ HACE: al montarse con una alerta, llama a `/api/contexto` con su id,
 * recibe una ficha redactada por el LLM anclada en el corpus y la lista de
 * fuentes citadas, y las muestra con estados de carga/error explícitos.
 *
 * ROL EN EL SISTEMA: es la cara visible de la CAPA REAL del prototipo (RAG).
 * Vive dentro de PanelAlerta y convierte una detección geoespacial en una
 * explicación fundamentada con evidencia citable.
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - Toda la lógica sensible (embeddings, consulta vectorial, generación) ocurre
 *    en el servidor (`/api/contexto`); el componente solo consume JSON. Así las
 *    claves de API nunca llegan al cliente.
 *  - Degradación elegante: si falta la clave de Anthropic, la API responde con
 *    los fragmentos recuperados + un aviso, y este componente lo muestra sin
 *    romperse.
 *
 * PARA EL INFORME: demuestra "recuperación + generación con citas verificables"
 * aplicada a un caso de uso concreto (fundamentar una alerta), que es el
 * objetivo del prototipo. La etiqueta de origen "real" lo distingue del resto.
 */
export default function FichaContextoRAG({
  alerta,
}: {
  alerta: PropiedadesAlerta;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<RespuestaContexto | null>(null);
  // Colapsable: permite plegar la ficha para ver las gráficas de abajo.
  const [colapsado, setColapsado] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setDatos(null);
    setError(null);

    async function cargar() {
      setCargando(true);
      try {
        const res = await fetch("/api/contexto", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ alertaId: alerta.id }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
        if (!cancelado) setDatos(json as RespuestaContexto);
      } catch (e) {
        if (!cancelado)
          setError(e instanceof Error ? e.message : "Error al generar el contexto");
      } finally {
        if (!cancelado) setCargando(false);
      }
    }

    cargar();
    return () => {
      cancelado = true;
    };
  }, [alerta]);

  return (
    <div className="rounded-lg border border-base-700 bg-base-800/60 p-3">
      <div className="flex items-center justify-between gap-2">
        {/* Cabecera clicable: colapsa/expande la ficha para dejar ver las gráficas. */}
        <button
          type="button"
          onClick={() => setColapsado((c) => !c)}
          aria-expanded={!colapsado}
          className="flex min-w-0 items-center gap-1.5 text-left"
        >
          <Chevron abierto={!colapsado} />
          <h4 className="truncate text-sm font-semibold text-texto-primario">
            Contexto científico
          </h4>
          {/* Mientras carga, un punto animado también en la cabecera colapsada. */}
          {cargando && (
            <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-base-600 border-t-acento" />
          )}
        </button>
        <EtiquetaOrigen
          origen="real"
          titulo="Texto generado por RAG sobre el corpus científico real, con citas verificables."
        />
      </div>

      {!colapsado && (
        <div className="mt-2">
          {cargando && <IndicadorCarga />}

          {error && !cargando && (
            <p className="rounded border border-severidad-alta/30 bg-severidad-alta/10 px-2 py-1.5 text-[13px] text-severidad-alta">
              No se pudo generar el contexto: {error}
            </p>
          )}

          {datos && !cargando && (
            <>
              {datos.aviso && (
                <p className="mb-2 rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                  {datos.aviso}
                </p>
              )}
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-texto-secundario">
                {datos.ficha}
              </p>
              <ListaFuentes fuentes={datos.fuentes} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

/** Chevron que apunta hacia abajo (abierto) o hacia la derecha (colapsado). */
function Chevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={`shrink-0 text-texto-tenue transition-transform ${
        abierto ? "" : "-rotate-90"
      }`}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Indicador de carga: spinner en movimiento + texto de lo que ocurre + un
 * esqueleto con brillo desplazándose (shimmer). Hace visible que el RAG está
 * recuperando y redactando (la generación puede tardar varios segundos).
 */
function IndicadorCarga() {
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      <div className="flex items-center gap-2 text-[12px] text-texto-tenue">
        <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-base-600 border-t-acento" />
        Recuperando fragmentos del corpus y redactando la ficha…
      </div>
      <div className="space-y-2">
        {["w-full", "w-11/12", "w-10/12", "w-9/12"].map((w, i) => (
          <div
            key={i}
            className={`h-3 ${w} overflow-hidden rounded bg-base-700`}
          >
            <div className="h-full w-1/3 animate-shimmer bg-gradient-to-r from-transparent via-base-600 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  );
}
