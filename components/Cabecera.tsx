"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", etiqueta: "Mapa de alertas" },
  { href: "/asistente", etiqueta: "Asistente RAG" },
  { href: "/acerca", etiqueta: "Acerca del prototipo" },
];

/**
 * Cabecera con navegación + banner permanente de transparencia.
 * El banner NO es descartable a propósito: declara el alcance real del
 * prototipo en todo momento (requisito académico no negociable).
 */
export default function Cabecera() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-base-700 bg-base-900/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-acento/15 text-acento">
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
          <div>
            <div className="text-sm font-semibold leading-tight">Centinela Orinoco</div>
            <div className="text-[11px] leading-tight text-texto-tenue">
              Monitoreo de minería ilegal · Arco Minero del Orinoco
            </div>
          </div>
        </div>

        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const activo =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-1.5 transition-colors ${
                  activo
                    ? "bg-base-700 text-texto-primario"
                    : "text-texto-secundario hover:bg-base-800 hover:text-texto-primario"
                }`}
              >
                {item.etiqueta}
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
