"use client";

/**
 * FormAcceso — formulario del PIN de entrada.
 *
 * Envía el PIN a /api/acceso; si es válido, el servidor setea la cookie de
 * sesión y aquí se recarga hacia el tablero. El PIN nunca se guarda en cliente.
 */

import { useState } from "react";

export default function FormAcceso() {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!pin.trim() || cargando) return;
    setCargando(true);
    setError(null);
    try {
      const res = await fetch("/api/acceso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json?.error || "No se pudo validar el PIN.");
        setCargando(false);
        return;
      }
      // Éxito: recarga completa para que el middleware vea la nueva cookie.
      window.location.assign("/");
    } catch {
      setError("Error de red. Inténtalo de nuevo.");
      setCargando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="mt-6">
      <label htmlFor="pin" className="mb-1.5 block text-[12px] font-medium text-texto-secundario">
        PIN de acceso
      </label>
      <input
        id="pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        value={pin}
        onChange={(e) => {
          setPin(e.target.value);
          if (error) setError(null);
        }}
        placeholder="••••••"
        className="w-full rounded-lg border border-base-600 bg-base-900 px-3 py-2.5 text-center text-lg tracking-[0.3em] text-texto-primario outline-none focus:border-acento"
      />

      {error && (
        <p className="mt-2 rounded border border-severidad-alta/30 bg-severidad-alta/10 px-2 py-1.5 text-[13px] text-severidad-alta">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando || !pin.trim()}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-acento px-4 py-2.5 text-sm font-semibold text-base-900 transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {cargando ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-base-900/40 border-t-base-900" />
            Verificando…
          </>
        ) : (
          "Entrar"
        )}
      </button>
    </form>
  );
}
