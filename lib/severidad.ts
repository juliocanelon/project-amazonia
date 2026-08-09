/**
 * lib/severidad.ts — semántica visual de la severidad de las alertas.
 *
 * QUÉ HACE: centraliza los colores, etiquetas y clases CSS asociados a cada
 * nivel de severidad (alta/media/baja).
 *
 * ROL EN EL SISTEMA: utilidad de presentación compartida por el mapa, su
 * leyenda, el panel de filtros y el panel de detalle.
 *
 * DECISIÓN DE ARQUITECTURA: un único origen para la codificación por color evita
 * inconsistencias entre componentes (que el rojo signifique lo mismo en el mapa
 * y en el panel) y facilita ajustar la paleta en un solo sitio.
 *
 * PARA EL INFORME: la paleta por severidad es parte del diseño de visualización
 * orientado a lectura rápida en pantalla de proyección durante la defensa.
 */
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
