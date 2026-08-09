/**
 * EtiquetaOrigen — sello de procedencia de un dato ("real" / "pre-calculado" /
 * "simulado").
 *
 * QUÉ HACE: renderiza una etiqueta discreta y consistente (color por origen)
 * que acompaña a los datos en toda la interfaz.
 *
 * ROL EN EL SISTEMA: primitiva de UI que hace operativa la "frontera de
 * honestidad". La reutilizan mapa, panel de alerta, ficha RAG, gráficas y chat,
 * garantizando un lenguaje visual único para la procedencia.
 *
 * DECISIÓN DE ARQUITECTURA: centralizar la semántica del origen en un solo
 * componente (colores + textos) evita etiquetas inconsistentes y asegura que el
 * requisito de transparencia se aplique de forma uniforme.
 *
 * PARA EL INFORME: es la pieza atómica del principio de transparencia de
 * alcance —verde = RAG real; azul = detección pre-calculada; ámbar = telemetría
 * simulada—.
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
