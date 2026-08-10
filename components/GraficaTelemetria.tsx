"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Line,
  ComposedChart,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { LecturaTelemetria, SensorTelemetria } from "@/lib/tipos";
import EtiquetaOrigen from "./EtiquetaOrigen";

/**
 * GraficaTelemetria — series temporales del sensor asociado a una alerta.
 *
 * QUÉ HACE: grafica turbidez, pH y conductividad del sensor a lo largo del
 * tiempo (Recharts), resaltando la ventana temporal del disturbio (el periodo
 * de la detección) para correlacionar visualmente sensor y evento.
 *
 * ROL EN EL SISTEMA: es la cara visible de la CAPA SIMULADA (telemetría IoT).
 * Vive dentro de PanelAlerta, bajo la ficha RAG.
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - Los datos se generan de forma reproducible (PRNG con semilla fija, ver
 *    `scripts/generar-datos.ts`) con un pico sincronizado a la fecha de
 *    detección; no provienen de sensores reales.
 *  - IMPORTANTE (dominio): el sistema NO mide mercurio. Los sensores modelan
 *    PROXIES (turbidez, pH, conductividad) que orientan dónde priorizar el
 *    muestreo de laboratorio. El componente lleva la etiqueta "simulado".
 *
 * PARA EL INFORME: representa la telemetría que, en un despliegue real, llegaría
 * de nodos ESP32 vía MQTT/LoRaWAN. La distinción proxy-vs-mercurio es un punto
 * de rigor científico del proyecto.
 */
export default function GraficaTelemetria({
  sensor,
  fechaDeteccion,
  persistenciaDias,
}: {
  sensor: SensorTelemetria;
  fechaDeteccion: string;
  persistenciaDias: number;
}) {
  // Ventana resaltada: desde ~3 días antes de la detección hasta el final
  // del periodo de persistencia declarado por la alerta.
  const inicioEvento = desplazarFecha(fechaDeteccion, -3);
  const finEvento = clampFecha(
    desplazarFecha(fechaDeteccion, persistenciaDias),
    sensor.lecturas[sensor.lecturas.length - 1]?.fecha
  );

  const datos = sensor.lecturas;
  const ejeTicks = ticksMensuales(datos.map((l) => l.fecha));

  // Resúmenes numéricos para alimentar la interpretación con IA (sin enviar
  // toda la serie). Deterministas por sensor → memorizados.
  const resumenTurbidez = useMemo(
    () => resumirSerie(datos, "turbidez_ntu"),
    [datos]
  );
  const resumenConductividad = useMemo(
    () => resumirSerie(datos, "conductividad_us"),
    [datos]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-texto-primario">
            {sensor.nombre}
          </div>
          <div className="text-[11px] text-texto-tenue">
            {sensor.id_sensor} · {sensor.lat.toFixed(2)}, {sensor.lon.toFixed(2)}
          </div>
        </div>
        <EtiquetaOrigen
          origen="simulado"
          titulo="Telemetría generada sintéticamente. En producción provendría de nodos ESP32 vía MQTT/LoRaWAN."
        />
      </div>

      {/* Turbidez — evidencia principal del disturbio aluvial */}
      <div>
        <div className="mb-1 text-[11px] font-medium text-texto-secundario">
          Turbidez (NTU)
        </div>
        <InterpretacionIA
          sensorId={sensor.id_sensor}
          cuenca={sensor.cuenca}
          variable="turbidez"
          etiqueta="Turbidez"
          unidad="NTU"
          resumen={resumenTurbidez}
          fechaDeteccion={fechaDeteccion}
        />
        <ResponsiveContainer width="100%" height={140}>
          <ComposedChart data={datos} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="gradTurbidez" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1a2432" vertical={false} />
            <XAxis
              dataKey="fecha"
              ticks={ejeTicks}
              tickFormatter={fmtMes}
              tick={{ fill: "#6b7d92", fontSize: 10 }}
              stroke="#26364a"
            />
            <YAxis
              tick={{ fill: "#6b7d92", fontSize: 10 }}
              stroke="#26364a"
              width={44}
            />
            <Tooltip content={<TooltipPersonalizado unidad="NTU" campo="turbidez_ntu" />} />
            <ReferenceArea
              x1={inicioEvento}
              x2={finEvento}
              fill="#ef4444"
              fillOpacity={0.1}
              stroke="#ef4444"
              strokeOpacity={0.25}
            />
            <ReferenceLine
              x={fechaDeteccion}
              stroke="#ef4444"
              strokeDasharray="3 3"
              strokeWidth={1.2}
            />
            <Area
              type="monotone"
              dataKey="turbidez_ntu"
              stroke="#38bdf8"
              strokeWidth={1.6}
              fill="url(#gradTurbidez)"
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* pH y conductividad — variables de apoyo (doble eje) */}
      <div>
        <div className="mb-1 flex items-center gap-3 text-[11px] font-medium text-texto-secundario">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
            pH
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            Conductividad (µS/cm)
          </span>
        </div>
        <InterpretacionIA
          sensorId={sensor.id_sensor}
          cuenca={sensor.cuenca}
          variable="conductividad"
          etiqueta="Conductividad"
          unidad="µS/cm"
          resumen={resumenConductividad}
          fechaDeteccion={fechaDeteccion}
        />
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={datos} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
            <CartesianGrid stroke="#1a2432" vertical={false} />
            <XAxis
              dataKey="fecha"
              ticks={ejeTicks}
              tickFormatter={fmtMes}
              tick={{ fill: "#6b7d92", fontSize: 10 }}
              stroke="#26364a"
            />
            <YAxis
              yAxisId="ph"
              domain={[5.8, 7.2]}
              tick={{ fill: "#6b7d92", fontSize: 10 }}
              stroke="#26364a"
              width={30}
            />
            <YAxis
              yAxisId="cond"
              orientation="right"
              domain={[0, 160]}
              tick={{ fill: "#6b7d92", fontSize: 10 }}
              stroke="#26364a"
              width={30}
            />
            <Tooltip content={<TooltipApoyo />} />
            <ReferenceArea
              yAxisId="ph"
              x1={inicioEvento}
              x2={finEvento}
              fill="#ef4444"
              fillOpacity={0.08}
            />
            <Line
              yAxisId="ph"
              type="monotone"
              dataKey="ph"
              stroke="#34d399"
              strokeWidth={1.4}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              yAxisId="cond"
              type="monotone"
              dataKey="conductividad_us"
              stroke="#fbbf24"
              strokeWidth={1.4}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] leading-relaxed text-texto-tenue">
        La banda roja marca el periodo del disturbio detectado. El pico
        sostenido de turbidez coincide con la remoción de sedimentos típica de
        la minería aluvial; el pH desciende y la conductividad aumenta.
      </p>
    </div>
  );
}

// ── Interpretación con IA ───────────────────────────────────────

type CampoNumerico = "turbidez_ntu" | "conductividad_us";

interface ResumenSerie {
  min: number;
  max: number;
  prom: number;
  pico: number;
  fechaPico: string;
  baseline: number;
}

function redondear(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Resume una serie (min/max/promedio/pico/línea base) para pasarla al LLM. */
function resumirSerie(
  lecturas: LecturaTelemetria[],
  campo: CampoNumerico
): ResumenSerie | null {
  if (!lecturas.length) return null;
  let min = Infinity;
  let max = -Infinity;
  let suma = 0;
  let fechaPico = lecturas[0].fecha;
  for (const l of lecturas) {
    const v = l[campo];
    if (v < min) min = v;
    if (v > max) {
      max = v;
      fechaPico = l.fecha;
    }
    suma += v;
  }
  // Línea base: promedio del primer 20 % de lecturas (antes del disturbio).
  const nBase = Math.max(1, Math.floor(lecturas.length * 0.2));
  const base =
    lecturas.slice(0, nBase).reduce((s, l) => s + l[campo], 0) / nBase;
  return {
    min: redondear(min),
    max: redondear(max),
    prom: redondear(suma / lecturas.length),
    pico: redondear(max),
    fechaPico,
    baseline: redondear(base),
  };
}

// Caché de cliente: `${sensorId}:${variable}` → interpretación ya inferida.
const cacheInterpretacionCliente = new Map<string, string>();
// Duración mínima visible de la "inferencia" (para que la carga desde caché
// también muestre la animación, como pidió el requisito).
const MIN_INFER_MS = 1100;

/**
 * Bloque de interpretación con IA que precede a una gráfica. Explica qué mide la
 * variable y qué muestra la serie. Cachea por sensor+variable (dos capas:
 * cliente aquí y servidor en /api/interpretacion). Si sirve desde caché,
 * SIMULA la inferencia mostrando la animación de carga un instante.
 */
function InterpretacionIA({
  sensorId,
  cuenca,
  variable,
  etiqueta,
  unidad,
  resumen,
  fechaDeteccion,
}: {
  sensorId: string;
  cuenca: string;
  variable: "turbidez" | "conductividad";
  etiqueta: string;
  unidad: string;
  resumen: ResumenSerie | null;
  fechaDeteccion: string;
}) {
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [texto, setTexto] = useState("");
  const [deCache, setDeCache] = useState(false);
  const [sinIA, setSinIA] = useState(false);

  useEffect(() => {
    if (!resumen) {
      setEstado("error");
      setTexto("Sin datos suficientes para interpretar la serie.");
      return;
    }
    let cancel = false;
    setEstado("cargando");
    const clave = `${sensorId}:${variable}`;
    const inicio = Date.now();

    // Muestra el resultado respetando una duración mínima de "inferencia".
    const terminar = (t: string, cache: boolean, sin: boolean) => {
      const restante = Math.max(0, MIN_INFER_MS - (Date.now() - inicio));
      window.setTimeout(() => {
        if (cancel) return;
        setTexto(t);
        setDeCache(cache);
        setSinIA(sin);
        setEstado("listo");
      }, restante);
    };

    const enCache = cacheInterpretacionCliente.get(clave);
    if (enCache) {
      terminar(enCache, true, false); // desde caché: se simula la inferencia
      return () => {
        cancel = true;
      };
    }

    fetch("/api/interpretacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sensorId,
        variable,
        etiqueta,
        unidad,
        cuenca,
        resumen,
        fechaDeteccion,
      }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Error ${res.status}`);
        return json as { interpretacion: string; generacion_deshabilitada?: boolean };
      })
      .then((json) => {
        cacheInterpretacionCliente.set(clave, json.interpretacion);
        terminar(json.interpretacion, false, !!json.generacion_deshabilitada);
      })
      .catch((e) => {
        if (!cancel) {
          setEstado("error");
          setTexto(e instanceof Error ? e.message : "Error al interpretar la serie");
        }
      });

    return () => {
      cancel = true;
    };
  }, [sensorId, variable, etiqueta, unidad, cuenca, resumen, fechaDeteccion]);

  return (
    <div className="mb-2 rounded-md border border-acento/20 bg-acento/[0.06] px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-acento">
        <IconoIA />
        Interpretación IA
        {estado === "listo" && deCache && (
          <span className="rounded bg-base-700 px-1 text-[9px] font-normal normal-case text-texto-tenue">
            caché
          </span>
        )}
      </div>

      {estado === "cargando" && (
        <div
          className="flex items-center gap-2 text-[11px] text-texto-tenue"
          role="status"
          aria-live="polite"
        >
          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-base-600 border-t-acento" />
          <span>Infiriendo la interpretación de los datos con IA…</span>
        </div>
      )}

      {estado === "error" && (
        <p className="text-[11px] text-severidad-alta">{texto}</p>
      )}

      {estado === "listo" && (
        <>
          {sinIA && (
            <p className="mb-1 text-[10px] text-amber-300/80">
              Interpretación de reserva (sin IA): falta la clave de Anthropic.
            </p>
          )}
          <p className="text-[12px] leading-relaxed text-texto-secundario">
            {texto}
          </p>
        </>
      )}
    </div>
  );
}

/** Estrella de cuatro puntas: marca de "generado por IA". */
function IconoIA() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l1.7 4.6 4.6 1.7-4.6 1.7L12 15.6l-1.7-4.6L5.7 9.3l4.6-1.7L12 3Z"
        fill="currentColor"
      />
    </svg>
  );
}

// ── Tooltips ────────────────────────────────────────────────────
function TooltipPersonalizado({
  active,
  payload,
  label,
  unidad,
  campo,
}: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-base-600 bg-base-800 px-2 py-1 text-[11px] shadow-lg">
      <div className="text-texto-tenue">{fmtFechaCompleta(label)}</div>
      <div className="font-medium text-texto-primario">
        {payload[0].value} {unidad}
      </div>
    </div>
  );
}

function TooltipApoyo({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-base-600 bg-base-800 px-2 py-1 text-[11px] shadow-lg">
      <div className="text-texto-tenue">{fmtFechaCompleta(label)}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="text-texto-primario">
          {p.dataKey === "ph" ? "pH" : "Conductividad"}: {p.value}
          {p.dataKey === "conductividad_us" ? " µS/cm" : ""}
        </div>
      ))}
    </div>
  );
}

// ── Utilidades de fecha ─────────────────────────────────────────
function desplazarFecha(iso: string, dias: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}
function clampFecha(iso: string, max?: string): string {
  if (max && iso > max) return max;
  return iso;
}
function ticksMensuales(fechas: string[]): string[] {
  const vistos = new Set<string>();
  const ticks: string[] = [];
  for (const f of fechas) {
    const mes = f.slice(0, 7);
    if (!vistos.has(mes)) {
      vistos.add(mes);
      ticks.push(f);
    }
  }
  return ticks;
}
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function fmtMes(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return MESES[d.getUTCMonth()];
}
function fmtFechaCompleta(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
