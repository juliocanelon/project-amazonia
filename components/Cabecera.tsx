"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", etiqueta: "Mapa de alertas", corta: "Mapa" },
  { href: "/asistente", etiqueta: "Asistente RAG", corta: "Asistente" },
  { href: "/arquitectura", etiqueta: "Arquitectura", corta: "Arquitectura" },
  { href: "/acerca", etiqueta: "Acerca del prototipo", corta: "Acerca" },
];

/**
 * Cabecera — navegación global + banner permanente de transparencia.
 *
 * QUÉ HACE: barra superior fija con las tres rutas del prototipo (mapa,
 * asistente RAG, acerca) y un banner que declara el alcance real del sistema.
 *
 * ROL EN EL SISTEMA: capa de presentación transversal. Se monta una sola vez en
 * `app/layout.tsx`, por lo que el banner acompaña a TODAS las vistas.
 *
 * DECISIÓN DE ARQUITECTURA: el banner es NO descartable a propósito. La
 * "frontera de honestidad" (distinguir lo real de lo simulado/pre-calculado) es
 * un requisito académico no negociable; por eso se ancla en el layout raíz y no
 * en cada página, para que sea imposible navegar sin verlo.
 *
 * PARA EL INFORME: materializa el principio de transparencia de alcance a nivel
 * de arquitectura de UI —la restricción se cumple por construcción, no por
 * disciplina del desarrollador—. El texto del banner cita literalmente el
 * alcance del prototipo (RAG real; detecciones pre-calculadas; telemetría
 * simulada).
 */
export default function Cabecera() {
  const pathname = usePathname();

  // El portal de acceso se muestra a pantalla completa, sin cabecera ni banner.
  if (pathname === "/acceso") return null;

  return (
    <header className="sticky top-0 z-30 border-b border-base-700 bg-base-900/95 backdrop-blur">
      <div className="flex items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-4 sm:py-2.5">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-acento/15 text-acento">
            {/* Marca simple: un "ojo" centinela */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-tight">
              Centinela Orinoco
            </div>
            {/* Subtítulo oculto en móvil para ganar espacio. */}
            <div className="hidden truncate text-[11px] leading-tight text-texto-tenue sm:block">
              Monitoreo de minería ilegal · Arco Minero del Orinoco
            </div>
          </div>
        </div>

        {/* Nav deslizable en horizontal si no cabe (móvil). */}
        <nav className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((item) => {
            const activo =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 whitespace-nowrap rounded px-2.5 py-1.5 transition-colors sm:px-3 ${
                  activo
                    ? "bg-base-700 text-texto-primario"
                    : "text-texto-secundario hover:bg-base-800 hover:text-texto-primario"
                }`}
              >
                {/* Etiqueta corta en móvil, completa desde sm. */}
                <span className="sm:hidden">{item.corta}</span>
                <span className="hidden sm:inline">{item.etiqueta}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Banner permanente de transparencia de alcance */}
      <div className="border-t border-amber-500/20 bg-amber-500/[0.07] px-4 py-1.5 text-center text-[11px] text-amber-200/90">
        <span className="font-semibold">Prototipo académico</span> — Capa
        semántica (RAG) operativa sobre corpus científico real. Detecciones
        pre-calculadas y telemetría simulada con fines demostrativos.
      </div>
    </header>
  );
}
