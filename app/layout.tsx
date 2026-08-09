/**
 * app/layout.tsx — layout raíz de la aplicación (App Router).
 *
 * QUÉ HACE: define el `<html lang="es">`, la tipografía, los metadatos globales
 * y monta la Cabecera (con su banner de transparencia) por encima de todas las
 * páginas.
 *
 * ROL EN EL SISTEMA: envoltura común de las tres rutas. Al vivir aquí la
 * Cabecera, el banner de alcance es omnipresente por construcción.
 *
 * DECISIÓN DE ARQUITECTURA: idioma fijado en español (toda la UI lo es) y la
 * Cabecera en el layout —no en cada página— para que el requisito de
 * transparencia no dependa de recordarlo en cada vista.
 *
 * PARA EL INFORME: es el nivel donde el principio de honestidad de alcance se
 * vuelve estructural.
 */
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Cabecera from "@/components/Cabecera";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Centinela Orinoco — Monitoreo de minería ilegal",
  description:
    "Prototipo académico de capa de consumo con memoria semántica (RAG) para el monitoreo de minería ilegal en el Arco Minero del Orinoco.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <Cabecera />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
