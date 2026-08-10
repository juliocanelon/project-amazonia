"use client";

/**
 * DiagramaArquitectura — diagrama interactivo y animado de la arquitectura.
 *
 * QUÉ HACE: dibuja las capas del sistema como un grafo dirigido con partículas
 * animadas que recorren las conexiones (el "flujo" de datos). Cada bloque es
 * clicable y despliega qué es, su estado y de dónde vendría el dato en
 * producción.
 *
 * ROL EN EL SISTEMA: pieza didáctica de la capa de presentación (ruta
 * `/arquitectura`). Hace tangible la "frontera de honestidad": distingue con
 * color qué es real (RAG), pre-calculado, simulado o solo diseño documentado.
 *
 * DECISIÓN DE ARQUITECTURA: SVG + animateMotion (SMIL), sin librerías externas,
 * para mantener el bundle ligero. Los nodos y aristas se declaran como datos y
 * se posicionan en un viewBox fijo, escalado de forma responsiva.
 *
 * PARA EL INFORME: resume de un vistazo las 5 capas y el camino real
 * implementado (corpus → embeddings → pgvector → generación → consumo).
 */

import { useState } from "react";

type Estado = "real" | "pre-calculado" | "simulado" | "diseno" | "fuente";

const ESTILO_ESTADO: Record<
  Estado,
  { linea: string; chip: string; etiqueta: string }
> = {
  real: {
    linea: "#34d399",
    chip: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    etiqueta: "Real — operativo",
  },
  "pre-calculado": {
    linea: "#38bdf8",
    chip: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    etiqueta: "Pre-calculado",
  },
  simulado: {
    linea: "#f59e0b",
    chip: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    etiqueta: "Simulado",
  },
  diseno: {
    linea: "#64748b",
    chip: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    etiqueta: "Diseño documentado (no implementado)",
  },
  fuente: {
    linea: "#a78bfa",
    chip: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    etiqueta: "Fuente de datos externa",
  },
};

interface Nodo {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  titulo: string;
  sub: string;
  estado: Estado;
  que: string;
  prod: string;
}

// Coordenadas en el viewBox (988 × 560). Tres carriles:
//  · Superior: cadena satelital (diseño) → detección → tablero.
//  · Medio-izq: sensores IoT (simulado) → tablero.
//  · Inferior: pipeline RAG real → tablero / asistente.
const NODOS: Nodo[] = [
  // ── Carril superior: pipeline de datos satelitales (diseño) ──
  { id: "sat", x: 16, y: 90, w: 156, h: 60, titulo: "Satélite", sub: "Sentinel-1/2 (SAR/óptico)", estado: "fuente",
    que: "Imágenes de radar (SAR) y ópticas de acceso libre que cubren el Arco Minero.",
    prod: "Se descargarían y procesarían para alimentar el modelo de detección. En el prototipo no se ingieren." },
  { id: "ingesta", x: 212, y: 90, w: 156, h: 60, titulo: "Ingesta", sub: "Kafka · NiFi · MQTT", estado: "diseno",
    que: "Captura y transporte de los flujos satelitales e IoT.",
    prod: "Kafka/NiFi para lotes satelitales; MQTT/LoRaWAN para sensores. No implementado en el prototipo." },
  { id: "lake", x: 408, y: 90, w: 156, h: 60, titulo: "Lakehouse", sub: "Delta Lake · MinIO", estado: "diseno",
    que: "Almacenamiento de datos crudos y curados.",
    prod: "Delta Lake sobre MinIO (S3). No implementado en el prototipo." },
  { id: "airflow", x: 604, y: 90, w: 156, h: 60, titulo: "Orquestación", sub: "Apache Airflow", estado: "diseno",
    que: "Programa y encadena los procesos (ETL, inferencia, indexación).",
    prod: "DAGs de Airflow disparando ingesta, detección e indexación. No implementado en el prototipo." },
  { id: "deteccion", x: 800, y: 90, w: 156, h: 60, titulo: "Modelo de detección", sub: "CNN / Random Forest", estado: "diseno",
    que: "Clasifica minería a partir de las imágenes y genera los polígonos de alerta.",
    prod: "CNN/RF sobre Sentinel. En el prototipo el modelo no corre: los polígonos vienen pre-calculados en un GeoJSON." },

  // ── Fuente IoT (simulada) ──
  { id: "sensores", x: 16, y: 300, w: 156, h: 60, titulo: "Sensores IoT", sub: "ESP32 · proxies de agua", estado: "simulado",
    que: "Miden PROXIES de perturbación del agua: turbidez, pH y conductividad. No miden mercurio.",
    prod: "Nodos ESP32 en campo vía MQTT/LoRaWAN. En el prototipo la telemetría se genera sintéticamente." },

  // ── Carril inferior: capa semántica RAG (real) ──
  { id: "corpus", x: 16, y: 470, w: 156, h: 60, titulo: "Corpus científico", sub: "24 fuentes reales", estado: "real",
    que: "14 fuentes científicas arbitradas + 10 de prensa/informes, resumidas en español.",
    prod: "Igual que en el prototipo: es real y verificable." },
  { id: "embed", x: 212, y: 470, w: 156, h: 60, titulo: "Embeddings", sub: "Voyage voyage-3.5-lite", estado: "real",
    que: "Convierte cada fragmento y cada consulta en vectores de 1024 dimensiones (multilingüe).",
    prod: "Igual que en el prototipo: real." },
  { id: "pgvector", x: 408, y: 470, w: 156, h: 60, titulo: "Base vectorial", sub: "Supabase · pgvector", estado: "real",
    que: "Almacena 73 fragmentos y busca los más similares por distancia coseno (índice HNSW).",
    prod: "Igual que en el prototipo: real." },
  { id: "gen", x: 604, y: 470, w: 156, h: 60, titulo: "Recuperación + Generación", sub: "Anthropic claude-sonnet-5", estado: "real",
    que: "Recupera los fragmentos relevantes y redacta la respuesta con citas verificables, sin inventar.",
    prod: "Igual que en el prototipo: real." },

  // ── Consumo (real) ──
  { id: "tablero", x: 800, y: 300, w: 172, h: 76, titulo: "Tablero web", sub: "Mapa · alertas · telemetría", estado: "real",
    que: "Mapa MapLibre con las alertas, panel de detalle y gráficas de telemetría.",
    prod: "Real. Combina polígonos pre-calculados, telemetría simulada y el contexto RAG real de cada alerta." },
  { id: "asistente", x: 800, y: 470, w: 172, h: 60, titulo: "Asistente RAG", sub: "Chat con citas", estado: "real",
    que: "Chat conversacional que responde solo con base en el corpus y muestra sus fuentes.",
    prod: "Real." },
];

interface Arista {
  from: string;
  to: string;
  estado: Estado;
  fromA?: "right" | "left" | "top" | "bottom";
  toA?: "right" | "left" | "top" | "bottom";
  modo?: "h" | "v";
}

const ARISTAS: Arista[] = [
  { from: "sat", to: "ingesta", estado: "diseno" },
  { from: "ingesta", to: "lake", estado: "diseno" },
  { from: "lake", to: "airflow", estado: "diseno" },
  { from: "airflow", to: "deteccion", estado: "diseno" },
  { from: "deteccion", to: "tablero", estado: "pre-calculado", fromA: "bottom", toA: "top", modo: "v" },
  { from: "sensores", to: "tablero", estado: "simulado" },
  { from: "corpus", to: "embed", estado: "real" },
  { from: "embed", to: "pgvector", estado: "real" },
  { from: "pgvector", to: "gen", estado: "real" },
  { from: "gen", to: "tablero", estado: "real" },
  { from: "gen", to: "asistente", estado: "real" },
];

function anclaje(n: Nodo, cual: "right" | "left" | "top" | "bottom") {
  switch (cual) {
    case "right":
      return { x: n.x + n.w, y: n.y + n.h / 2 };
    case "left":
      return { x: n.x, y: n.y + n.h / 2 };
    case "top":
      return { x: n.x + n.w / 2, y: n.y };
    case "bottom":
      return { x: n.x + n.w / 2, y: n.y + n.h };
  }
}

/** Curva de Bézier con tangentes horizontales o verticales. */
function curva(
  a: { x: number; y: number },
  b: { x: number; y: number },
  modo: "h" | "v"
) {
  if (modo === "v") {
    const dy = Math.abs(b.y - a.y) * 0.5;
    return `M ${a.x} ${a.y} C ${a.x} ${a.y + dy}, ${b.x} ${b.y - dy}, ${b.x} ${b.y}`;
  }
  const dx = Math.abs(b.x - a.x) * 0.5;
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
}

export default function DiagramaArquitectura() {
  const [sel, setSel] = useState<string | null>("gen");
  const porId = (id: string) => NODOS.find((n) => n.id === id)!;
  const nodoSel = sel ? porId(sel) : null;

  return (
    <div>
      {/* Leyenda */}
      <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
        {(Object.keys(ESTILO_ESTADO) as Estado[]).map((e) => (
          <span
            key={e}
            className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 ${ESTILO_ESTADO[e].chip}`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: ESTILO_ESTADO[e].linea }}
            />
            {ESTILO_ESTADO[e].etiqueta}
          </span>
        ))}
      </div>

      {/* Diagrama */}
      <div className="overflow-x-auto rounded-lg border border-base-700 bg-base-900/60 p-2">
        <svg
          viewBox="0 0 988 560"
          className="h-auto w-full min-w-[720px]"
          onClick={() => setSel(null)}
          role="img"
          aria-label="Diagrama de la arquitectura del sistema"
        >
          {/* Aristas + partículas */}
          {ARISTAS.map((ar, i) => {
            const a = anclaje(porId(ar.from), ar.fromA ?? "right");
            const b = anclaje(porId(ar.to), ar.toA ?? "left");
            const d = curva(a, b, ar.modo ?? "h");
            const color = ESTILO_ESTADO[ar.estado].linea;
            const id = `arista-${i}`;
            return (
              <g key={id}>
                <path
                  id={id}
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeOpacity={0.35}
                  strokeWidth={1.4}
                />
                {[0, 1, 2].map((p) => (
                  <circle key={p} r={3} fill={color}>
                    <animateMotion
                      dur="2.6s"
                      begin={`${p * 0.87}s`}
                      repeatCount="indefinite"
                    >
                      <mpath xlinkHref={`#${id}`} href={`#${id}`} />
                    </animateMotion>
                  </circle>
                ))}
              </g>
            );
          })}

          {/* Nodos */}
          {NODOS.map((n) => {
            const color = ESTILO_ESTADO[n.estado].linea;
            const activo = sel === n.id;
            return (
              <g
                key={n.id}
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setSel(n.id);
                }}
              >
                <rect
                  x={n.x}
                  y={n.y}
                  width={n.w}
                  height={n.h}
                  rx={10}
                  fill={color}
                  fillOpacity={activo ? 0.18 : 0.08}
                  stroke={color}
                  strokeOpacity={activo ? 1 : 0.6}
                  strokeWidth={activo ? 2.4 : 1.3}
                />
                <circle cx={n.x + 13} cy={n.y + 13} r={3.2} fill={color} />
                <text
                  x={n.x + n.w / 2}
                  y={n.y + n.h / 2 - 5}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={600}
                  fill="#e6edf3"
                >
                  {n.titulo}
                </text>
                <text
                  x={n.x + n.w / 2}
                  y={n.y + n.h / 2 + 12}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#9fb0c3"
                >
                  {n.sub}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Panel de detalle */}
      <div className="mt-3 min-h-[96px] rounded-lg border border-base-700 bg-base-800/50 p-3">
        {nodoSel ? (
          <div>
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold text-texto-primario">
                {nodoSel.titulo}
              </h3>
              <span className="text-[12px] text-texto-tenue">{nodoSel.sub}</span>
              <span
                className={`rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide ${ESTILO_ESTADO[nodoSel.estado].chip}`}
              >
                {ESTILO_ESTADO[nodoSel.estado].etiqueta}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-texto-secundario">
              <span className="text-texto-tenue">Qué es: </span>
              {nodoSel.que}
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-texto-secundario">
              <span className="text-texto-tenue">En producción vs. prototipo: </span>
              {nodoSel.prod}
            </p>
          </div>
        ) : (
          <p className="text-[13px] text-texto-tenue">
            Haz clic en cualquier componente del diagrama para ver qué es, su
            estado y de dónde vendría el dato en un despliegue real.
          </p>
        )}
      </div>
    </div>
  );
}
