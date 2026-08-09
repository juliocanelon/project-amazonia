/**
 * app/page.tsx — ruta raíz `/`: el tablero de alertas.
 *
 * ROL EN EL SISTEMA: página de entrada; delega todo en VistaMapa (mapa +
 * filtros + panel de detalle). Es un Server Component mínimo que monta el
 * contenedor cliente del tablero.
 *
 * PARA EL INFORME: vista principal de monitoreo geoespacial, donde convergen
 * detección pre-calculada, telemetría simulada y contexto RAG real.
 */
import VistaMapa from "@/components/VistaMapa";

export default function PaginaInicio() {
  return <VistaMapa />;
}
