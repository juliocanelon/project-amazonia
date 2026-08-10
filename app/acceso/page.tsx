/**
 * app/acceso/page.tsx — portal de acceso (pantalla de entrada con PIN).
 *
 * Muestra la universidad, el proyecto y los integrantes, y solicita el PIN. El
 * middleware redirige aquí cualquier intento de acceso sin sesión válida.
 *
 * Para editar los integrantes, modifica el arreglo INTEGRANTES de abajo.
 */
import FormAcceso from "@/components/FormAcceso";

export const metadata = {
  title: "Acceso — Centinela Orinoco",
};

// TODO: completar con los nombres reales de todos los integrantes del equipo.
const INTEGRANTES = ["Miguel Mota","Julio César Canelón"];

export default function PaginaAcceso() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-base-700 bg-base-800/60 p-7 shadow-xl">
        {/* Marca */}
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-acento/15 text-acento">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
            </svg>
          </div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-texto-tenue">
            UNEG · Maestría en Tecnologías de la Información
          </p>
          <p className="text-[11px] text-texto-tenue">
            Arquitecturas de Datos Inteligentes 
          </p>
          <p className="text-[11px] text-texto-tenue">
            Profa. Livia Carolina Borjas Medina  - livacaro7@gmail.com
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-texto-primario">
            Centinela Orinoco
          </h1>
          <p className="mt-1 text-[13px] leading-relaxed text-texto-secundario">
            Detección y monitoreo de minería ilegal en el Arco Minero del Orinoco
          </p>
        </div>

        {/* Integrantes */}
        <div className="rounded-lg border border-base-700 bg-base-900/50 px-3 py-2.5">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-texto-tenue">
            {INTEGRANTES.length > 1 ? "Integrantes" : "Autor"}
          </div>
          <ul className="space-y-0.5 text-[13px] text-texto-secundario">
            {INTEGRANTES.map((nombre) => (
              <li key={nombre}>{nombre}</li>
            ))}
          </ul>
        </div>

        {/* PIN */}
        <FormAcceso />

        <p className="mt-6 text-center text-[11px] leading-relaxed text-texto-tenue">
          Prototipo académico. El acceso está restringido por PIN con fines de la
          defensa del proyecto integrador.
        </p>
      </div>
    </div>
  );
}
