/**
 * app/asistente/page.tsx — ruta `/asistente`: el chat RAG.
 *
 * ROL EN EL SISTEMA: página de consulta libre a la capa semántica; delega en
 * ChatRAG. Es la segunda superficie de consumo del RAG, junto con la ficha de
 * contexto embebida en el tablero.
 *
 * PARA EL INFORME: permite al evaluador interrogar el corpus directamente y
 * comprobar la trazabilidad de las respuestas (citas y similitud).
 */
import ChatRAG from "@/components/ChatRAG";

export default function PaginaAsistente() {
  return <ChatRAG />;
}
