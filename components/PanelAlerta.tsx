"use client";

import type { PropiedadesAlerta, SensorTelemetria } from "@/lib/tipos";
import {
  CLASE_CHIP_SEVERIDAD,
  ETIQUETA_SEVERIDAD,
} from "@/lib/severidad";
import EtiquetaOrigen from "./EtiquetaOrigen";
import FichaContextoRAG from "./FichaContextoRAG";
import GraficaTelemetria from "./GraficaTelemetria";

/**
 * PanelAlerta — panel lateral de detalle de la alerta seleccionada.
 *
 * QUÉ HACE: muestra los atributos de la detección (id, severidad, cuenca,
 * superficie, fecha, origen del sensor) y compone en un mismo lugar tres
 * bloques: la ficha de contexto RAG (real), las gráficas de telemetría
 * (simuladas) y la lista de fuentes citadas.
 *
 * ROL EN EL SISTEMA: es el punto de encuentro entre las tres naturalezas de
 * dato del prototipo —pre-calculado (atributos de la alerta), real
 * (FichaContextoRAG) y simulado (GraficaTelemetria)— cada uno con su etiqueta
 * de origen.
 *
 * DECISIÓN DE ARQUITECTURA: al seleccionar una alerta, la ficha RAG se solicita
 * bajo demanda (lazy) a `/api/contexto`; no se pre-calcula para todas las
 * alertas, lo que ahorra llamadas a embeddings y generación.
 *
 * PARA EL INFORME: ilustra cómo la capa semántica (RAG) se integra en el flujo
 * de trabajo del analista —contexto científico con citas verificables junto al
 * evento geoespacial— que es el aporte central del prototipo.
 */
export default function PanelAlerta({
  alerta,
  sensor,
  onCerrar,
}: {
  alerta: PropiedadesAlerta;
  sensor: SensorTelemetria | null;
  onCerrar: () => void;
}) {
  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-l border-base-700 bg-base-900 md:w-[420px]">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-2 border-b border-base-700 px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-texto-primario">
              {alerta.id}
            </span>
            <span
              className={`rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase ${CLASE_CHIP_SEVERIDAD[alerta.severidad]}`}
            >
              Severidad {ETIQUETA_SEVERIDAD[alerta.severidad]}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-texto-tenue">
            <span>{alerta.cuenca}</span>
            <EtiquetaOrigen
              origen="pre-calculado"
              titulo="Polígono de detección pre-calculado. En producción provendría del modelo satelital vía Airflow."
            />
          </div>
        </div>
        <button
          onClick={onCerrar}
          aria-label="Cerrar panel"
          className="rounded p-1 text-texto-tenue transition-colors hover:bg-base-800 hover:text-texto-primario"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </button>
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* Datos de la alerta */}
        <section>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5 text-[13px]">
            <Dato etiqueta="Fecha de detección" valor={fmtFecha(alerta.fecha_deteccion)} />
            <Dato etiqueta="Superficie" valor={`${alerta.superficie_ha} ha`} />
            <Dato
              etiqueta="Confianza del modelo"
              valor={`${(alerta.confianza_modelo * 100).toFixed(0)} %`}
            />
            <Dato etiqueta="Sensor de origen" valor={alerta.sensor_origen} />
            <Dato
              etiqueta="Distancia a área protegida"
              valor={`${alerta.distancia_area_protegida_km} km`}
            />
            <Dato etiqueta="Persistencia" valor={`${alerta.persistencia_dias} días`} />
          </dl>
        </section>

        {/* Ficha de contexto RAG */}
        <FichaContextoRAG alerta={alerta} />

        {/* Telemetría del sensor asociado */}
        <section>
          <h4 className="mb-2 text-sm font-semibold text-texto-primario">
            Telemetría de agua
          </h4>
          {sensor ? (
            <GraficaTelemetria
              sensor={sensor}
              fechaDeteccion={alerta.fecha_deteccion}
              persistenciaDias={alerta.persistencia_dias}
            />
          ) : (
            <p className="rounded border border-base-700 bg-base-800/60 px-3 py-4 text-[13px] text-texto-tenue">
              Esta alerta no tiene un sensor de agua asociado
              {alerta.id_sensor_agua ? ` (${alerta.id_sensor_agua} no disponible).` : "."}
            </p>
          )}
        </section>
      </div>
    </aside>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-texto-tenue">
        {etiqueta}
      </dt>
      <dd className="mt-0.5 font-medium text-texto-primario">{valor}</dd>
    </div>
  );
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
function fmtFecha(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return `${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
}
