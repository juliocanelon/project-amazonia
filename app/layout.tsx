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
