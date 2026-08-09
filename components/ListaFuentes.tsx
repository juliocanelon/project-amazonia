import type { FuenteCitada } from "@/lib/tipos";

/**
 * ListaFuentes — fuentes que el RAG consultó para una respuesta.
 *
 * QUÉ HACE: lista cada fuente citada (autor, año, revista/medio) con su grado de
 * similitud vectorial, distinguiendo visiblemente la PRENSA (no arbitrada) de la
 * ciencia revisada por pares.
 *
 * ROL EN EL SISTEMA: componente de presentación compartido por FichaContextoRAG
 * y ChatRAG. Es lo que convierte una respuesta generada en una respuesta
 * VERIFICABLE.
 *
 * DECISIÓN DE ARQUITECTURA: mostrar la similitud y el tipo de fuente hace
 * auditable la recuperación —el evaluador ve de dónde salió cada afirmación y
 * con qué relevancia—, reforzando la trazabilidad frente a la alucinación.
 *
 * PARA EL INFORME: sostiene la afirmación de "citas verificables". La distinción
 * prensa/arbitrada es coherente con el prompt del sistema, que prioriza la
 * evidencia revisada por pares.
 */
export default function ListaFuentes({ fuentes }: { fuentes: FuenteCitada[] }) {
  if (!fuentes?.length) return null;

  return (
    <div className="mt-3 border-t border-base-700 pt-2">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-texto-tenue">
        Fuentes consultadas ({fuentes.length})
      </div>
      <ul className="space-y-1.5">
        {fuentes.map((f, i) => {
          const esPrensa = f.tipo === "prensa";
          return (
            <li key={`${f.fuente_id}-${i}`} className="flex gap-2 text-[12px] leading-snug">
              <span className="mt-0.5 shrink-0 font-mono text-[10px] text-acento">
                [{i + 1}]
              </span>
              <span className="text-texto-secundario">
                <span className="font-medium text-texto-primario">
                  {f.autores} ({f.anio}).
                </span>{" "}
                {f.titulo}. <span className="italic">{f.revista}</span>.
                {/* Distintivo de tipo de fuente */}
                {esPrensa ? (
                  <span
                    className="ml-1.5 inline-flex items-center rounded border border-amber-500/40 bg-amber-500/10 px-1 py-0 text-[10px] font-medium uppercase tracking-wide text-amber-300"
                    title="Fuente de prensa, no revisada por pares"
                  >
                    Prensa · no arbitrada
                  </span>
                ) : (
                  f.indexacion && (
                    <span className="ml-1 text-texto-tenue">· {f.indexacion}</span>
                  )
                )}
                {typeof f.similitud === "number" && (
                  <span className="ml-1 text-texto-tenue">
                    · similitud {(f.similitud * 100).toFixed(0)}%
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
