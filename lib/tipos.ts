/**
 * lib/tipos.ts — contratos de datos compartidos del prototipo.
 *
 * QUÉ HACE: define los tipos TypeScript que atraviesan toda la app (alertas,
 * telemetría, fuentes citadas, respuestas RAG, tipo de fuente…).
 *
 * ROL EN EL SISTEMA: fuente única de verdad de las estructuras de datos. Al
 * compartir estos tipos entre cliente, servidor y scripts, el compilador
 * garantiza que el GeoJSON, la base vectorial y la UI hablen el mismo lenguaje.
 *
 * DECISIÓN DE ARQUITECTURA: tipado estricto de extremo a extremo (sin `any`) para
 * detectar en compilación cualquier desalineación de esquema —por ejemplo, el
 * campo `tipo` (resumen_elaborado | prensa) que distingue ciencia de prensa
 * viaja tipado desde la BD hasta la interfaz—.
 *
 * PARA EL INFORME: refleja el modelo de datos del sistema en un solo lugar; es
 * un buen punto de partida para describir las entidades del prototipo.
 */

export type Severidad = "alta" | "media" | "baja";

/** Propiedades de cada feature de alerta en alertas.geojson */
export interface PropiedadesAlerta {
  id: string;
  fecha_deteccion: string; // ISO YYYY-MM-DD
  superficie_ha: number;
  severidad: Severidad;
  confianza_modelo: number; // 0-1
  sensor_origen: string;
  cuenca: string;
  distancia_area_protegida_km: number;
  persistencia_dias: number;
  id_sensor_agua: string | null; // enlaza con la telemetría
}

/** Feature GeoJSON de una alerta (geometría Polygon) */
export interface FeatureAlerta {
  type: "Feature";
  properties: PropiedadesAlerta;
  geometry: {
    type: "Polygon";
    coordinates: number[][][]; // [ [ [lon, lat], ... ] ]
  };
}

export interface ColeccionAlertas {
  type: "FeatureCollection";
  features: FeatureAlerta[];
}

/** Una lectura diaria de un sensor de agua (telemetría simulada) */
export interface LecturaTelemetria {
  fecha: string; // ISO YYYY-MM-DD
  turbidez_ntu: number;
  ph: number;
  conductividad_us: number;
}

export interface SensorTelemetria {
  id_sensor: string;
  nombre: string;
  lat: number;
  lon: number;
  cuenca: string;
  lecturas: LecturaTelemetria[];
}

/** Tipo de fuente del corpus */
export type TipoFuente = "resumen_elaborado" | "prensa";

/** Fuente citada devuelta por el RAG */
export interface FuenteCitada {
  fuente_id: string; // clave del corpus, p.ej. "garcia-sanchez-2008"
  autores: string;
  anio: number;
  titulo: string;
  revista: string;
  doi?: string | null;
  indexacion?: string | null;
  tipo: TipoFuente; // distingue ciencia revisada por pares de prensa
  url?: string | null;
  similitud: number; // 0-1
}

/** Respuesta estándar de las API routes de RAG */
export interface RespuestaRAG {
  respuesta: string;
  fuentes: FuenteCitada[];
  // true cuando la generación LLM está deshabilitada (falta la key) y solo
  // se devuelven los fragmentos recuperados.
  generacion_deshabilitada?: boolean;
  aviso?: string;
}
