/**
 * Mapa — visor geoespacial de alertas y estaciones de sensores (MapLibre GL).
 *
 * QUÉ HACE: renderiza los polígonos de detección coloreados por severidad
 * (con selección por feature-state) y los marcadores de las estaciones de
 * sensores; emite la selección hacia el contenedor (VistaMapa).
 *
 * ROL EN EL SISTEMA: componente de presentación del tablero. Se carga con
 * `dynamic(..., { ssr:false })` desde VistaMapa porque MapLibre necesita
 * `window` (no puede renderizarse en el servidor).
 *
 * DECISIÓN DE ARQUITECTURA:
 *  - MapLibre GL JS + teselas oscuras de CARTO (derivadas de OpenStreetMap) en
 *    lugar de Mapbox: evita un token de pago y cumple la restricción de "solo
 *    servicios con capa gratuita, sin tarjeta".
 *  - La geometría de los polígonos es esquemática (exagerada para visibilidad);
 *    la superficie real la porta el atributo `superficie_ha`.
 *  - Los marcadores de sensores llevan el badge "simulado" en su popup, en línea
 *    con la frontera de honestidad.
 *
 * PARA EL INFORME: representa la visualización de la salida del (hipotético)
 * modelo de detección satelital. Aquí los polígonos se cargan pre-calculados;
 * en un despliegue real vendrían del modelo orquestado por Airflow.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { ColeccionAlertas, SensorTelemetria } from "@/lib/tipos";
import { COLOR_SEVERIDAD, ETIQUETA_SEVERIDAD } from "@/lib/severidad";

// Encuadre inicial: Arco Minero del Orinoco (estado Bolívar).
const CENTRO: [number, number] = [-62.0, 6.4];
const ZOOM_INICIAL = 6.4;

/**
 * Estilo base oscuro usando teselas de CARTO (derivadas de OpenStreetMap),
 * sin token de pago. Se atribuye tanto a OSM como a CARTO.
 */
const ESTILO_BASE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "carto-oscuro": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · © <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    { id: "fondo", type: "background", paint: { "background-color": "#0b1017" } },
    { id: "carto-oscuro", type: "raster", source: "carto-oscuro" },
  ],
};

export default function Mapa({
  datos,
  sensores,
  seleccionada,
  onSeleccionar,
}: {
  datos: ColeccionAlertas;
  sensores: SensorTelemetria[];
  seleccionada: string | null;
  onSeleccionar: (id: string | null) => void;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<maplibregl.Map | null>(null);
  const listoRef = useRef(false);
  // Guardamos el callback en un ref para no re-registrar los listeners.
  const onSeleccionarRef = useRef(onSeleccionar);
  onSeleccionarRef.current = onSeleccionar;
  const sensoresRef = useRef(sensores);
  sensoresRef.current = sensores;

  // ── Inicialización (una sola vez) ─────────────────────────────
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return;

    const mapa = new maplibregl.Map({
      container: contenedorRef.current,
      style: ESTILO_BASE,
      center: CENTRO,
      zoom: ZOOM_INICIAL,
      attributionControl: { compact: true },
    });
    mapaRef.current = mapa;

    mapa.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapa.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

    mapa.on("load", () => {
      mapa.addSource("alertas", {
        type: "geojson",
        data: datos as GeoJSON.FeatureCollection,
        promoteId: "id", // usa la propiedad `id` como id de feature (feature-state)
      });

      // Relleno coloreado por severidad
      mapa.addLayer({
        id: "alertas-relleno",
        type: "fill",
        source: "alertas",
        paint: {
          "fill-color": [
            "match",
            ["get", "severidad"],
            "alta", COLOR_SEVERIDAD.alta,
            "media", COLOR_SEVERIDAD.media,
            "baja", COLOR_SEVERIDAD.baja,
            "#888888",
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "seleccionada"], false],
            0.75,
            0.4,
          ],
        },
      });

      // Contorno (más grueso si está seleccionada)
      mapa.addLayer({
        id: "alertas-contorno",
        type: "line",
        source: "alertas",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "seleccionada"], false],
            "#ffffff",
            [
              "match",
              ["get", "severidad"],
              "alta", COLOR_SEVERIDAD.alta,
              "media", COLOR_SEVERIDAD.media,
              "baja", COLOR_SEVERIDAD.baja,
              "#888888",
            ],
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "seleccionada"], false],
            2.5,
            1,
          ],
        },
      });

      // Interacción: cursor + selección
      mapa.on("mouseenter", "alertas-relleno", () => {
        mapa.getCanvas().style.cursor = "pointer";
      });
      mapa.on("mouseleave", "alertas-relleno", () => {
        mapa.getCanvas().style.cursor = "";
      });
      mapa.on("click", "alertas-relleno", (e) => {
        const f = e.features?.[0];
        const id = f?.properties?.id as string | undefined;
        if (id) onSeleccionarRef.current(id);
      });
      // Clic en zona vacía → deseleccionar
      mapa.on("click", (e) => {
        const hits = mapa.queryRenderedFeatures(e.point, {
          layers: ["alertas-relleno"],
        });
        if (hits.length === 0) onSeleccionarRef.current(null);
      });

      // Marcadores de las estaciones de sensores (telemetría SIMULADA).
      for (const s of sensoresRef.current) {
        const el = document.createElement("div");
        el.className = "marcador-sensor";
        el.title = `${s.nombre} (simulado)`;
        // Rombo en un hijo: MapLibre transforma `el` (translate) pero no al hijo,
        // preservando la rotación 45° (coherente con la leyenda).
        const rombo = document.createElement("div");
        rombo.className = "marcador-sensor__rombo";
        el.appendChild(rombo);
        const popup = new maplibregl.Popup({ offset: 14, closeButton: false }).setHTML(
          `<div style="font-size:12px">
             <strong>${s.nombre}</strong><br/>
             <span style="color:#9fb0c3">${s.id_sensor} · ${s.cuenca}</span><br/>
             <span style="display:inline-block;margin-top:4px;padding:1px 5px;border-radius:4px;
               background:rgba(245,158,11,.15);color:#fcd34d;font-size:10px;text-transform:uppercase">
               Sensor simulado
             </span>
           </div>`
        );
        new maplibregl.Marker({ element: el })
          .setLngLat([s.lon, s.lat])
          .setPopup(popup)
          .addTo(mapa);
      }

      listoRef.current = true;
      aplicarSeleccion(mapa, seleccionadaRef.current);
    });

    return () => {
      mapa.remove();
      mapaRef.current = null;
      listoRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Actualizar datos cuando cambian los filtros ───────────────
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !listoRef.current) return;
    const fuente = mapa.getSource("alertas") as maplibregl.GeoJSONSource | undefined;
    fuente?.setData(datos as GeoJSON.FeatureCollection);
  }, [datos]);

  // ── Resaltar la alerta seleccionada ───────────────────────────
  const seleccionadaRef = useRef(seleccionada);
  seleccionadaRef.current = seleccionada;
  useEffect(() => {
    const mapa = mapaRef.current;
    if (!mapa || !listoRef.current) return;
    aplicarSeleccion(mapa, seleccionada);
  }, [seleccionada]);

  return (
    <div className="relative h-full w-full">
      <div ref={contenedorRef} className="h-full w-full" />
      <Leyenda />
    </div>
  );
}

/** Aplica feature-state `seleccionada` limpiando el estado previo. */
let idAnterior: string | null = null;
function aplicarSeleccion(mapa: maplibregl.Map, id: string | null) {
  if (idAnterior) {
    mapa.setFeatureState({ source: "alertas", id: idAnterior }, { seleccionada: false });
  }
  if (id) {
    mapa.setFeatureState({ source: "alertas", id }, { seleccionada: true });
  }
  idAnterior = id;
}

function Leyenda() {
  const [abierta, setAbierta] = useState(true);
  return (
    <div className="absolute bottom-6 right-3 z-10 rounded-md border border-base-600 bg-base-800/90 text-[12px] backdrop-blur">
      {/* Cabecera clicable: colapsa/expande la leyenda. */}
      <button
        onClick={() => setAbierta((o) => !o)}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between gap-3 px-3 py-1.5 font-semibold text-texto-primario"
      >
        <span>Leyenda</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className={`text-texto-tenue transition-transform ${abierta ? "" : "rotate-180"}`}
        >
          <path
            d="m6 15 6-6 6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {abierta && (
        <ul className="space-y-1 px-3 pb-2">
          {(["alta", "media", "baja"] as const).map((s) => (
            <li key={s} className="flex items-center gap-2 text-texto-secundario">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{ backgroundColor: COLOR_SEVERIDAD[s] }}
              />
              {ETIQUETA_SEVERIDAD[s]}
            </li>
          ))}
          <li className="mt-1.5 flex items-center gap-2 border-t border-base-700 pt-1.5 text-texto-secundario">
            <span
              className="inline-block h-2.5 w-2.5 border border-base-900"
              style={{ backgroundColor: "#38bdf8", transform: "rotate(45deg)", boxShadow: "0 0 0 1.5px #38bdf8" }}
            />
            Estación de sensor
            <span className="rounded bg-amber-500/15 px-1 text-[10px] uppercase text-amber-300">
              sim.
            </span>
          </li>
        </ul>
      )}
    </div>
  );
}
