"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type {
  ColeccionAlertas,
  FeatureAlerta,
  SensorTelemetria,
} from "@/lib/tipos";
import PanelFiltros, { type EstadoFiltros } from "./PanelFiltros";
import PanelAlerta from "./PanelAlerta";

// MapLibre necesita `window`; se carga solo en cliente.
const Mapa = dynamic(() => import("./Mapa"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-texto-tenue">
      Cargando mapa…
    </div>
  ),
});

const FILTROS_INICIALES: EstadoFiltros = {
  severidades: [],
  cuencas: [],
  fechaDesde: "",
  fechaHasta: "",
};

export default function VistaMapa() {
  const [alertas, setAlertas] = useState<ColeccionAlertas | null>(null);
  const [telemetria, setTelemetria] = useState<SensorTelemetria[]>([]);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<EstadoFiltros>(FILTROS_INICIALES);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);

  // ── Carga de datos estáticos ──────────────────────────────────
  useEffect(() => {
    async function cargar() {
      try {
        const [rA, rT] = await Promise.all([
          fetch("/data/alertas.geojson"),
          fetch("/data/telemetria.json"),
        ]);
        if (!rA.ok || !rT.ok) throw new Error("No se pudieron cargar los datos");
        setAlertas(await rA.json());
        setTelemetria(await rT.json());
      } catch (e) {
        setErrorCarga(e instanceof Error ? e.message : "Error de carga");
      }
    }
    cargar();
  }, []);

  const cuencasDisponibles = useMemo(() => {
    if (!alertas) return [];
    return Array.from(
      new Set(alertas.features.map((f) => f.properties.cuenca))
    ).sort();
  }, [alertas]);

  // ── Aplicación de filtros ─────────────────────────────────────
  const alertasFiltradas = useMemo<ColeccionAlertas>(() => {
    if (!alertas) return { type: "FeatureCollection", features: [] };
    const features = alertas.features.filter((f) => {
      const p = f.properties;
      if (filtros.severidades.length && !filtros.severidades.includes(p.severidad))
        return false;
      if (filtros.cuencas.length && !filtros.cuencas.includes(p.cuenca)) return false;
      if (filtros.fechaDesde && p.fecha_deteccion < filtros.fechaDesde) return false;
      if (filtros.fechaHasta && p.fecha_deteccion > filtros.fechaHasta) return false;
      return true;
    });
    return { type: "FeatureCollection", features };
  }, [alertas, filtros]);

  // Si la alerta seleccionada deja de estar visible, se deselecciona.
  useEffect(() => {
    if (
      seleccionada &&
      !alertasFiltradas.features.some((f) => f.properties.id === seleccionada)
    ) {
      setSeleccionada(null);
    }
  }, [alertasFiltradas, seleccionada]);

  const totalHectareas = useMemo(
    () =>
      alertasFiltradas.features.reduce(
        (s, f) => s + f.properties.superficie_ha,
        0
      ),
    [alertasFiltradas]
  );

  const featureSeleccionada: FeatureAlerta | null = useMemo(
    () =>
      alertasFiltradas.features.find((f) => f.properties.id === seleccionada) ??
      null,
    [alertasFiltradas, seleccionada]
  );

  const sensorSeleccionado = useMemo(() => {
    const idSensor = featureSeleccionada?.properties.id_sensor_agua;
    if (!idSensor) return null;
    return telemetria.find((s) => s.id_sensor === idSensor) ?? null;
  }, [featureSeleccionada, telemetria]);

  if (errorCarga) {
    return (
      <div className="p-6 text-severidad-alta">
        Error al cargar los datos: {errorCarga}
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-96px)] flex-col">
      <PanelFiltros
        filtros={filtros}
        cuencasDisponibles={cuencasDisponibles}
        onCambio={setFiltros}
        totalAlertas={alertasFiltradas.features.length}
        totalHectareas={totalHectareas}
      />
      <div className="flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          {alertas ? (
            <Mapa
              datos={alertasFiltradas}
              sensores={telemetria}
              seleccionada={seleccionada}
              onSeleccionar={setSeleccionada}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-texto-tenue">
              Cargando datos…
            </div>
          )}
        </div>
        {featureSeleccionada && (
          <PanelAlerta
            alerta={featureSeleccionada.properties}
            sensor={sensorSeleccionado}
            onCerrar={() => setSeleccionada(null)}
          />
        )}
      </div>
    </div>
  );
}
