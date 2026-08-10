/**
 * app/arquitectura/page.tsx — ruta `/arquitectura`: diagrama vivo del sistema.
 *
 * ROL EN EL SISTEMA: explica la arquitectura completa (5 capas) y resalta el
 * camino real implementado, con un diagrama animado e interactivo. Refuerza la
 * frontera de honestidad distinguiendo real / pre-calculado / simulado / diseño.
 *
 * PARA EL INFORME: apoyo visual para la defensa; el diagrama y sus fichas por
 * componente describen de dónde vendría cada dato en un despliegue real.
 */
import DiagramaArquitectura from "@/components/DiagramaArquitectura";

export const metadata = {
  title: "Arquitectura — Centinela Orinoco",
};

export default function PaginaArquitectura() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-semibold text-texto-primario">
        Arquitectura del sistema
      </h1>
      <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-texto-secundario">
        La arquitectura completa diseñada tiene cinco capas. Este prototipo
        implementa <strong className="text-texto-primario">de forma real</strong>{" "}
        la capa de consumo con memoria semántica (RAG); el resto se documenta
        como diseño. El diagrama muestra el flujo de datos: las partículas
        recorren las conexiones y cada bloque es{" "}
        <strong className="text-texto-primario">clicable</strong> para ver su
        detalle.
      </p>

      <div className="mt-6">
        <DiagramaArquitectura />
      </div>

      <p className="mt-6 max-w-3xl text-[12px] leading-relaxed text-texto-tenue">
        El camino inferior (corpus → embeddings → base vectorial → generación →
        consumo) es el circuito real y verificable. Los polígonos de detección se
        cargan pre-calculados y la telemetría es simulada; la cadena satelital de
        ingesta, lakehouse, orquestación y modelo de detección queda como diseño
        documentado, no implementado en este prototipo.
      </p>
    </div>
  );
}
