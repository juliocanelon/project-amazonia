"use client";

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
 * Barra de filtros: severidad, cuenca y rango de fechas.
 * Los cambios se propagan hacia arriba vía onCambio.
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
    filtros.fechaDesde ||
    filtros.fechaHasta;

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-3 border-b border-base-700 bg-base-800/50 px-4 py-3">
      {/* Contadores */}
      <div className="flex items-center gap-4">
        <Contador valor={totalAlertas} etiqueta="alertas activas" />
        <Contador
          valor={totalHectareas.toLocaleString("es", { maximumFractionDigits: 1 })}
          etiqueta="ha afectadas"
          acento
        />
      </div>

      <div className="h-8 w-px bg-base-700" />

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
          className="text-[12px] text-texto-tenue underline-offset-2 hover:text-texto-primario hover:underline"
        >
          Limpiar filtros
        </button>
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
