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
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-texto-primario">
          Contexto científico
        </h4>
        <EtiquetaOrigen
          origen="real"
          titulo="Texto generado por RAG sobre el corpus científico real, con citas verificables."
        />
      </div>

      {cargando && <EsqueletoCarga />}

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
  );
}

function EsqueletoCarga() {
  return (
    <div className="animate-pulse space-y-2" aria-label="Generando contexto…">
      <div className="h-3 w-full rounded bg-base-700" />
      <div className="h-3 w-11/12 rounded bg-base-700" />
      <div className="h-3 w-10/12 rounded bg-base-700" />
      <div className="h-3 w-9/12 rounded bg-base-700" />
    </div>
  );
}
