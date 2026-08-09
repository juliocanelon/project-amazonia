"use client";

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
import type { SensorTelemetria } from "@/lib/tipos";
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
