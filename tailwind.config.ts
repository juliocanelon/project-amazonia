import type { Config } from "tailwindcss";

/**
 * Paleta sobria de tema oscuro para una defensa académica.
 * Los acentos de severidad se usan tanto en el mapa como en las etiquetas.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fondo y superficies (grises azulados profundos)
        base: {
          900: "#0b1017", // fondo principal
          800: "#111823", // superficie
          700: "#1a2432", // superficie elevada / bordes
          600: "#26364a", // bordes sutiles
        },
        texto: {
          primario: "#e6edf3",
          secundario: "#9fb0c3",
          tenue: "#6b7d92",
        },
        acento: "#38bdf8", // cian informativo (no severidad)
        // Severidad
        severidad: {
          alta: "#ef4444",
          media: "#f59e0b",
          baja: "#eab308",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
