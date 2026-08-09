/**
 * Generador reproducible de los datos DEMOSTRATIVOS del prototipo.
 *
 *   - public/data/alertas.geojson  → detecciones PRE-CALCULADAS
 *   - public/data/telemetria.json  → telemetría de sensores SIMULADA
 *
 * En un despliegue real:
 *   - las alertas vendrían del modelo de detección satelital orquestado por Airflow.
 *   - la telemetría vendría de nodos ESP32 vía MQTT/LoRaWAN.
 *
 * Ejecutar con:  npm run generar-datos
 * Usa un PRNG con semilla fija para que la salida sea determinista.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type {
  ColeccionAlertas,
  FeatureAlerta,
  PropiedadesAlerta,
  SensorTelemetria,
  LecturaTelemetria,
} from "../lib/tipos";

// ── PRNG determinista (mulberry32) ──────────────────────────────
function crearPRNG(semilla: number) {
  let a = semilla >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = crearPRNG(20260806);

/** Ruido gaussiano aproximado (suma de uniformes). */
function ruido(amplitud: number) {
  return (rand() + rand() + rand() - 1.5) * amplitud;
}

// ── Fechas: ventana de telemetría de 90 días hasta hoy ──────────
const FECHA_FIN = new Date("2026-08-06T00:00:00Z");
const DIAS_TELEMETRIA = 90;

function fechaISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function sumarDias(base: Date, dias: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + dias);
  return d;
}
function diffDias(a: string, b: string): number {
  return Math.round(
    (new Date(a).getTime() - new Date(b).getTime()) / 86_400_000
  );
}

// ── Definición de sensores (uno por cuenca) ─────────────────────
interface DefSensor {
  id: string;
  nombre: string;
  lat: number;
  lon: number;
  cuenca: string;
}
const SENSORES: DefSensor[] = [
  { id: "SEN-CUY-03", nombre: "Estación Cuyuní Medio", lat: 6.42, lon: -61.83, cuenca: "Río Cuyuní" },
  { id: "SEN-CAR-01", nombre: "Estación Caroní Bajo", lat: 6.05, lon: -62.75, cuenca: "Río Caroní" },
  { id: "SEN-YUR-02", nombre: "Estación Yuruari Norte", lat: 6.72, lon: -61.62, cuenca: "Río Yuruari" },
  { id: "SEN-VEN-01", nombre: "Estación Venamo", lat: 6.78, lon: -61.12, cuenca: "Río Venamo" },
];

// ── Definición de las 14 alertas ────────────────────────────────
// centro (lat, lon) por cuenca; el polígono se genera alrededor.
interface DefAlerta extends Omit<PropiedadesAlerta, never> {
  _lat: number;
  _lon: number;
}

const ALERTAS: DefAlerta[] = [
  // Río Cuyuní
  { id: "ALT-2026-001", fecha_deteccion: "2026-07-14", superficie_ha: 34.7, severidad: "alta", confianza_modelo: 0.91, sensor_origen: "Sentinel-1 SAR", cuenca: "Río Cuyuní", distancia_area_protegida_km: 12.4, persistencia_dias: 45, id_sensor_agua: "SEN-CUY-03", _lat: 6.42, _lon: -61.83 },
  { id: "ALT-2026-002", fecha_deteccion: "2026-06-02", superficie_ha: 12.3, severidad: "media", confianza_modelo: 0.78, sensor_origen: "Sentinel-2 MSI", cuenca: "Río Cuyuní", distancia_area_protegida_km: 22.0, persistencia_dias: 20, id_sensor_agua: null, _lat: 6.51, _lon: -61.66 },
  { id: "ALT-2026-003", fecha_deteccion: "2026-03-11", superficie_ha: 5.1, severidad: "baja", confianza_modelo: 0.64, sensor_origen: "Sentinel-2 MSI", cuenca: "Río Cuyuní", distancia_area_protegida_km: 30.5, persistencia_dias: 12, id_sensor_agua: null, _lat: 6.35, _lon: -61.98 },

  // Río Caroní
  { id: "ALT-2026-004", fecha_deteccion: "2026-06-20", superficie_ha: 58.2, severidad: "alta", confianza_modelo: 0.94, sensor_origen: "Sentinel-1 SAR", cuenca: "Río Caroní", distancia_area_protegida_km: 6.8, persistencia_dias: 60, id_sensor_agua: "SEN-CAR-01", _lat: 6.05, _lon: -62.75 },
  { id: "ALT-2026-005", fecha_deteccion: "2026-05-28", superficie_ha: 18.9, severidad: "media", confianza_modelo: 0.81, sensor_origen: "Sentinel-2 MSI", cuenca: "Río Caroní", distancia_area_protegida_km: 15.2, persistencia_dias: 33, id_sensor_agua: null, _lat: 6.22, _lon: -62.61 },
  { id: "ALT-2026-006", fecha_deteccion: "2026-04-05", superficie_ha: 7.4, severidad: "baja", confianza_modelo: 0.69, sensor_origen: "Fusión Sentinel-1/2", cuenca: "Río Caroní", distancia_area_protegida_km: 41.0, persistencia_dias: 18, id_sensor_agua: null, _lat: 5.88, _lon: -62.88 },
  { id: "ALT-2026-007", fecha_deteccion: "2026-07-02", superficie_ha: 41.0, severidad: "alta", confianza_modelo: 0.88, sensor_origen: "Sentinel-1 SAR", cuenca: "Río Caroní", distancia_area_protegida_km: 9.1, persistencia_dias: 52, id_sensor_agua: null, _lat: 6.13, _lon: -62.7 },

  // Río Yuruari
  { id: "ALT-2026-008", fecha_deteccion: "2026-07-21", superficie_ha: 46.5, severidad: "alta", confianza_modelo: 0.9, sensor_origen: "Sentinel-1 SAR", cuenca: "Río Yuruari", distancia_area_protegida_km: 4.2, persistencia_dias: 70, id_sensor_agua: "SEN-YUR-02", _lat: 6.72, _lon: -61.62 },
  { id: "ALT-2026-009", fecha_deteccion: "2026-06-11", superficie_ha: 15.7, severidad: "media", confianza_modelo: 0.76, sensor_origen: "Sentinel-2 MSI", cuenca: "Río Yuruari", distancia_area_protegida_km: 19.4, persistencia_dias: 27, id_sensor_agua: null, _lat: 6.83, _lon: -61.48 },
  { id: "ALT-2026-010", fecha_deteccion: "2026-05-19", superficie_ha: 22.4, severidad: "media", confianza_modelo: 0.83, sensor_origen: "Sentinel-2 MSI", cuenca: "Río Yuruari", distancia_area_protegida_km: 13.7, persistencia_dias: 30, id_sensor_agua: null, _lat: 6.64, _lon: -61.74 },

  // Río Venamo
  { id: "ALT-2026-011", fecha_deteccion: "2026-06-27", superficie_ha: 29.8, severidad: "alta", confianza_modelo: 0.87, sensor_origen: "Sentinel-1 SAR", cuenca: "Río Venamo", distancia_area_protegida_km: 3.1, persistencia_dias: 48, id_sensor_agua: "SEN-VEN-01", _lat: 6.78, _lon: -61.12 },
  { id: "ALT-2026-012", fecha_deteccion: "2026-03-24", superficie_ha: 6.2, severidad: "baja", confianza_modelo: 0.66, sensor_origen: "Sentinel-2 MSI", cuenca: "Río Venamo", distancia_area_protegida_km: 25.8, persistencia_dias: 15, id_sensor_agua: null, _lat: 6.69, _lon: -61.05 },
  { id: "ALT-2026-013", fecha_deteccion: "2026-05-30", superficie_ha: 19.1, severidad: "media", confianza_modelo: 0.8, sensor_origen: "Fusión Sentinel-1/2", cuenca: "Río Venamo", distancia_area_protegida_km: 17.3, persistencia_dias: 35, id_sensor_agua: null, _lat: 6.86, _lon: -61.19 },
  { id: "ALT-2026-014", fecha_deteccion: "2026-07-09", superficie_ha: 37.6, severidad: "alta", confianza_modelo: 0.92, sensor_origen: "Sentinel-1 SAR", cuenca: "Río Venamo", distancia_area_protegida_km: 8.0, persistencia_dias: 55, id_sensor_agua: null, _lat: 6.73, _lon: -61.22 },
];

/**
 * Construye un polígono irregular (6 vértices) alrededor de un centro.
 * IMPORTANTE: la geometría es ESQUEMÁTICA y está exagerada para que sea
 * visible a escala regional; la superficie real la lleva `superficie_ha`.
 */
function generarPoligono(
  lat: number,
  lon: number,
  superficie_ha: number
): number[][] {
  const radio = 0.008 + superficie_ha / 1000; // grados; solo para visualización
  const factorLon = 1 / Math.cos((lat * Math.PI) / 180); // corrección por latitud
  const vertices: number[][] = [];
  const n = 6;
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const r = radio * (0.7 + rand() * 0.6); // radio variable → forma orgánica
    const dLat = Math.sin(ang) * r;
    const dLon = Math.cos(ang) * r * factorLon;
    vertices.push([
      Number((lon + dLon).toFixed(5)),
      Number((lat + dLat).toFixed(5)),
    ]);
  }
  vertices.push(vertices[0]); // cerrar el anillo
  return vertices;
}

// ── Construir GeoJSON de alertas ────────────────────────────────
const features: FeatureAlerta[] = ALERTAS.map((a) => {
  const { _lat, _lon, ...propiedades } = a;
  return {
    type: "Feature",
    properties: propiedades,
    geometry: {
      type: "Polygon",
      coordinates: [generarPoligono(_lat, _lon, a.superficie_ha)],
    },
  };
});

const coleccion: ColeccionAlertas = {
  type: "FeatureCollection",
  features,
};

// ── Construir telemetría simulada ───────────────────────────────
// Cada sensor toma como "evento" la fecha de detección de la alerta ALTA
// que tiene asociada, para que el pico de turbidez coincida temporalmente.
function fechaEventoDeSensor(idSensor: string): string | null {
  const alerta = ALERTAS.find((a) => a.id_sensor_agua === idSensor);
  return alerta ? alerta.fecha_deteccion : null;
}

/**
 * Perfil del evento de minería aluvial: multiplicador [0..1] según los días
 * transcurridos desde el inicio del disturbio. Sube rápido, se sostiene y
 * decae parcialmente (la actividad persiste, no recupera la línea base).
 */
function multiplicadorEvento(diasDesdeInicio: number): number {
  if (diasDesdeInicio < 0) return 0;
  if (diasDesdeInicio < 5) return diasDesdeInicio / 5; // rampa de subida (5 días)
  if (diasDesdeInicio < 20) return 1; // meseta sostenida (~15 días)
  if (diasDesdeInicio < 40) return 1 - ((diasDesdeInicio - 20) / 20) * 0.75; // decae a 0.25
  return 0.25; // residual: el disturbio no se limpia del todo
}

function generarLecturas(fechaEvento: string | null): LecturaTelemetria[] {
  const lecturas: LecturaTelemetria[] = [];
  const inicioVentana = sumarDias(FECHA_FIN, -(DIAS_TELEMETRIA - 1));
  // El disturbio empieza ~3 días antes de la detección satelital.
  const inicioEvento = fechaEvento ? diffDias(fechaEvento, fechaISO(inicioVentana)) - 3 : null;

  for (let i = 0; i < DIAS_TELEMETRIA; i++) {
    const fecha = fechaISO(sumarDias(inicioVentana, i));
    const m = inicioEvento !== null ? multiplicadorEvento(i - inicioEvento) : 0;

    const turbidez = 150 + m * 1050 + ruido(12);
    const ph = 6.8 - m * 0.6 + ruido(0.05);
    const conductividad = 60 + m * 65 + ruido(3);

    lecturas.push({
      fecha,
      turbidez_ntu: Math.max(20, Number(turbidez.toFixed(0))),
      ph: Number(ph.toFixed(2)),
      conductividad_us: Math.max(15, Number(conductividad.toFixed(0))),
    });
  }
  return lecturas;
}

const telemetria: SensorTelemetria[] = SENSORES.map((s) => ({
  id_sensor: s.id,
  nombre: s.nombre,
  lat: s.lat,
  lon: s.lon,
  cuenca: s.cuenca,
  lecturas: generarLecturas(fechaEventoDeSensor(s.id)),
}));

// ── Escribir archivos ───────────────────────────────────────────
const dirDatos = join(process.cwd(), "public", "data");
mkdirSync(dirDatos, { recursive: true });

writeFileSync(
  join(dirDatos, "alertas.geojson"),
  JSON.stringify(coleccion, null, 2),
  "utf-8"
);
writeFileSync(
  join(dirDatos, "telemetria.json"),
  JSON.stringify(telemetria, null, 2),
  "utf-8"
);

const totalHa = ALERTAS.reduce((s, a) => s + a.superficie_ha, 0);
console.log(`✓ alertas.geojson  → ${features.length} alertas (${totalHa.toFixed(1)} ha)`);
console.log(`✓ telemetria.json  → ${telemetria.length} sensores × ${DIAS_TELEMETRIA} días`);
