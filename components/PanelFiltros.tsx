"use client";

import { useState } from "react";
import type { Severidad } from "@/lib/tipos";
import { COLOR_SEVERIDAD, ETIQUETA_SEVERIDAD } from "@/lib/severidad";

export interface EstadoFiltros {
  severidades: Severidad[];
  cuencas: string[];
  fechaDesde: string; // ISO o ""
  fechaHasta: string; // ISO o ""
}

const SEVERIDADES: Severidad[] = ["alta", "media", "baja"];

/**
 * PanelFiltros — barra de filtrado del tablero (severidad, cuenca, fechas).
 *
 * QUÉ HACE: expone controles de filtro y muestra el resumen agregado (nº de
 * alertas y hectáreas visibles). No filtra por sí mismo: emite el estado de
 * filtros hacia arriba (onCambio) y VistaMapa aplica el filtrado.
 *
 * ROL EN EL SISTEMA: componente de presentación "controlado"; el estado vive en
 * el contenedor (VistaMapa), este solo lo edita.
 *
 * DECISIÓN DE ARQUITECTURA: patrón de estado elevado (lifting state up) —un
 * único origen de verdad para los filtros— de modo que mapa, panel y resumen
 * reaccionen de forma coherente al mismo estado.
 *
 * PARA EL INFORME: la lista de cuencas se deriva dinámicamente de los datos
 * (Río Cuyuní, Caroní, Yuruari, Venamo), no está codificada a mano.
 */
export default function PanelFiltros({
  filtros,
  cuencasDisponibles,
  onCambio,
  totalAlertas,
  totalHectareas,
}: {
  filtros: EstadoFiltros;
  cuencasDisponibles: string[];
  onCambio: (f: EstadoFiltros) => void;
  totalAlertas: number;
  totalHectareas: number;
}) {
  function toggleSeveridad(s: Severidad) {
    const activo = filtros.severidades.includes(s);
    onCambio({
      ...filtros,
      severidades: activo
        ? filtros.severidades.filter((x) => x !== s)
        : [...filtros.severidades, s],
    });
  }

  function toggleCuenca(c: string) {
    const activo = filtros.cuencas.includes(c);
    onCambio({
      ...filtros,
      cuencas: activo
        ? filtros.cuencas.filter((x) => x !== c)
        : [...filtros.cuencas, c],
    });
  }

  const hayFiltros =
    filtros.severidades.length > 0 ||
    filtros.cuencas.length > 0 ||
    Boolean(filtros.fechaDesde) ||
    Boolean(filtros.fechaHasta);

  const nActivos =
    filtros.severidades.length +
    filtros.cuencas.length +
    (filtros.fechaDesde ? 1 : 0) +
    (filtros.fechaHasta ? 1 : 0);

  // Estado de despliegue de los filtros en móvil (en escritorio siempre visibles).
  const [abierto, setAbierto] = useState(false);

  // Grupos de filtros, reutilizados en escritorio (fila) y móvil (colapsable).
  const grupos = (
    <>
      {/* Severidad */}
      <Grupo etiqueta="Severidad">
        <div className="flex gap-1.5">
          {SEVERIDADES.map((s) => {
            const activo = filtros.severidades.includes(s);
            return (
              <button
                key={s}
                onClick={() => toggleSeveridad(s)}
                className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[12px] transition-colors ${
                  activo
                    ? "border-base-600 bg-base-700 text-texto-primario"
                    : "border-base-700 text-texto-secundario hover:bg-base-800"
                }`}
              >
                <span
                  className="inline-block h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: COLOR_SEVERIDAD[s] }}
                />
                {ETIQUETA_SEVERIDAD[s]}
              </button>
            );
          })}
        </div>
      </Grupo>

      {/* Cuenca */}
      <Grupo etiqueta="Cuenca">
        <div className="flex flex-wrap gap-1.5">
          {cuencasDisponibles.map((c) => {
            const activo = filtros.cuencas.includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleCuenca(c)}
                className={`rounded border px-2 py-1 text-[12px] transition-colors ${
                  activo
                    ? "border-base-600 bg-base-700 text-texto-primario"
                    : "border-base-700 text-texto-secundario hover:bg-base-800"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </Grupo>

      {/* Rango de fechas */}
      <Grupo etiqueta="Rango de fechas">
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={filtros.fechaDesde}
            onChange={(e) => onCambio({ ...filtros, fechaDesde: e.target.value })}
            className="rounded border border-base-700 bg-base-800 px-2 py-1 text-[12px] text-texto-primario [color-scheme:dark]"
          />
          <span className="text-texto-tenue">–</span>
          <input
            type="date"
            value={filtros.fechaHasta}
            onChange={(e) => onCambio({ ...filtros, fechaHasta: e.target.value })}
            className="rounded border border-base-700 bg-base-800 px-2 py-1 text-[12px] text-texto-primario [color-scheme:dark]"
          />
        </div>
      </Grupo>

      {hayFiltros && (
        <button
          onClick={() =>
            onCambio({ severidades: [], cuencas: [], fechaDesde: "", fechaHasta: "" })
          }
          className="self-center text-[12px] text-texto-tenue underline-offset-2 hover:text-texto-primario hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </>
  );

  return (
    <div className="border-b border-base-700 bg-base-800/50 px-3 py-2.5 sm:px-4 sm:py-3">
      {/* Fila principal: contadores + (escritorio) grupos / (móvil) botón. */}
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2.5 sm:gap-x-6 sm:gap-y-3">
        <div className="flex items-center gap-4">
          <Contador valor={totalAlertas} etiqueta="alertas activas" />
          <Contador
            valor={totalHectareas.toLocaleString("es", { maximumFractionDigits: 1 })}
            etiqueta="ha afectadas"
            acento
          />
        </div>

        <div className="hidden h-8 w-px bg-base-700 sm:block" />

        {/* Botón para desplegar filtros (solo móvil). */}
        <button
          onClick={() => setAbierto((o) => !o)}
          aria-expanded={abierto}
          className="ml-auto flex items-center gap-1.5 self-center rounded border border-base-700 px-2.5 py-1.5 text-[12px] text-texto-secundario sm:hidden"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 5h18l-7 8v6l-4-2v-4L3 5Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          Filtros{nActivos > 0 ? ` (${nActivos})` : ""}
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            className={`transition-transform ${abierto ? "rotate-180" : ""}`}
          >
            <path
              d="m6 9 6 6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Grupos en línea (solo escritorio). */}
        <div className="hidden flex-wrap items-end gap-x-6 gap-y-3 sm:flex">
          {grupos}
        </div>
      </div>

      {/* Grupos colapsables (solo móvil). */}
      {abierto && (
        <div className="mt-2.5 flex flex-wrap items-end gap-x-4 gap-y-2.5 sm:hidden">
          {grupos}
        </div>
      )}
    </div>
  );
}

function Contador({
  valor,
  etiqueta,
  acento,
}: {
  valor: number | string;
  etiqueta: string;
  acento?: boolean;
}) {
  return (
    <div>
      <div
        className={`text-xl font-semibold leading-none ${
          acento ? "text-acento" : "text-texto-primario"
        }`}
      >
        {valor}
      </div>
      <div className="mt-1 text-[11px] text-texto-tenue">{etiqueta}</div>
    </div>
  );
}

function Grupo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] uppercase tracking-wide text-texto-tenue">
        {etiqueta}
      </div>
      {children}
    </div>
  );
}
