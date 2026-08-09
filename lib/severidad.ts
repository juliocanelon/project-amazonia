import type { Severidad } from "./tipos";

/** Colores hex por severidad (compartidos entre mapa, leyenda y etiquetas). */
export const COLOR_SEVERIDAD: Record<Severidad, string> = {
  alta: "#ef4444",
  media: "#f59e0b",
  baja: "#eab308",
};

export const ETIQUETA_SEVERIDAD: Record<Severidad, string> = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

/** Clases de Tailwind para chips de severidad. */
export const CLASE_CHIP_SEVERIDAD: Record<Severidad, string> = {
  alta: "bg-severidad-alta/15 text-severidad-alta border-severidad-alta/40",
  media: "bg-severidad-media/15 text-severidad-media border-severidad-media/40",
  baja: "bg-severidad-baja/15 text-severidad-baja border-severidad-baja/40",
};

export const CUENCAS = [
  "Río Cuyuní",
  "Río Caroní",
  "Río Yuruari",
  "Río Venamo",
] as const;
