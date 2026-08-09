/**
 * Etiqueta discreta que marca el origen de un dato dentro de la interfaz.
 * Es parte del requisito de transparencia de alcance: cada dato que NO es
 * real (RAG) debe declararse como "simulado" o "pre-calculado".
 */

type Origen = "simulado" | "pre-calculado" | "real";

const ESTILOS: Record<Origen, string> = {
  simulado: "bg-amber-500/10 text-amber-300 border-amber-500/30",
  "pre-calculado": "bg-sky-500/10 text-sky-300 border-sky-500/30",
  real: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
};

const TEXTO: Record<Origen, string> = {
  simulado: "Simulado",
  "pre-calculado": "Pre-calculado",
  real: "Real",
};

export default function EtiquetaOrigen({
  origen,
  titulo,
}: {
  origen: Origen;
  titulo?: string;
}) {
  return (
    <span
      title={titulo}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${ESTILOS[origen]}`}
    >
      {TEXTO[origen]}
    </span>
  );
}
