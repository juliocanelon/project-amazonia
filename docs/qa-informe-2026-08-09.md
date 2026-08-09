# Informe de QA — Centinela Orinoco (2026-08-09)

Prueba funcional del prototipo realizada con un agente de navegador (Chromium
automatizado, viewport 1253×770) sobre `http://localhost:3000`. Este documento
recoge el informe recibido y la **triage** (análisis y resolución) de cada
hallazgo, como evidencia de verificación para el informe académico.

## Resultados por caso

| # | Caso | Veredicto | Observación resumida |
|---|------|-----------|----------------------|
| 1 | Banner de transparencia | **PASA** | Presente y permanente en las 3 páginas; texto exacto conforme al requisito. |
| 2 | Mapa de alertas | **PARCIAL** | Teselas, polígonos, marcadores y filtros correctos (14→5→3 alertas al filtrar). Popup de sensor se abre con **clic**, no con *hover*. |
| 3 | Panel de detalle | **PARCIAL** | Estructura correcta (badges REAL / PRE-CALCULADO / SIMULADO, ficha con citas, fuentes). Fallo intermitente **429 de Voyage** en la ficha de contexto (2 de 3 intentos). |
| 4A | RAG dentro del corpus | **PASA** | Respuesta con cifras y citas (autor, año) + fuentes consultadas. |
| 4B | RAG fuera del corpus | **PASA** | Declara que el corpus no cubre el tema; no inventa ("capital de Francia"). |
| 5 | /acerca | **PASA** | Tres categorías, aclaración del mercurio y listas 14 científicas + 10 prensa. |

**Veredicto global del agente:** *Con incidencias*. La honestidad de alcance es
el punto más fuerte. Bugs relevantes: 429 intermitente de Voyage en la ficha del
mapa, popup de sensor solo con clic, e inconsistencia numérica 12 vs 14.

## Triage (análisis y resolución)

### H1 — Inconsistencia de cifras: `/asistente` decía "12 artículos" vs `/acerca` "14"
- **Severidad:** media (afecta la honestidad de alcance).
- **Causa:** texto codificado a mano en `components/ChatRAG.tsx` no actualizado al
  ampliar el corpus a 24 fuentes.
- **Resolución:** ✅ corregido — ahora declara "24 fuentes reales (14 artículos
  científicos y 10 documentos de prensa e informes)".
- **Pendiente documental:** `docs/ESPECIFICACION.md` e `INSTRUCCIONES.md` aún
  mencionan "12 fuentes" (son documentos de especificación previos; se
  actualizarán aparte para no alterar el registro histórico sin acuerdo).

### H2 — Error 429 de Voyage en la ficha de contexto del mapa (intermitente)
- **Severidad:** alta para la demo (puede romper la ficha durante la defensa).
- **Causa:** la capa gratuita de Voyage limita a **3 peticiones/min**. Cada clic
  en una alerta genera un embedding de consulta; varios clics seguidos superan el
  límite. (El asistente `/asistente` no falló porque se consultó con menos
  frecuencia.)
- **Opciones de resolución:**
  1. **Reintento con espera** en la ruta `/api/contexto` (como en el indexador).
     Simple, pero introduce una espera visible al usuario.
  2. **Caché por alerta** en el servidor: computar la ficha de cada alerta una
     sola vez y reutilizarla. Elimina las llamadas repetidas (patrón típico de la
     demo: volver a abrir la misma alerta).
  3. **Pre-generar** las 14 fichas de alerta en un archivo estático y servirlas.
     Robustez total en la demo (sin llamadas en vivo), a costa de perder la
     generación "en el momento".
  4. **Añadir método de pago** en Voyage (sube el límite; sigue gratis por los
     200M tokens). Descartado por la restricción de "sin tarjeta".
- **Decisión adoptada:** **opción 2 + 1** (caché por alerta + reintento).
- **Resolución:** ✅ implementado.
  - *A (caché):* `app/api/contexto/route.ts` guarda en memoria la ficha de cada
    `alertaId`; reabrir la misma alerta no vuelve a llamar a Voyage/Anthropic.
  - *C (reintento):* `lib/rag.ts` reintenta el embedding de la consulta ante un
    429 con esperas breves (7 s, 14 s) como red de seguridad para ráfagas de la
    primera visita. Cubre tanto la ficha del mapa como el asistente.

### H3 — Popup de estación de sensor se abre con clic, no con *hover*
- **Severidad:** baja (cosmética; el requisito de transparencia se cumple: el
  badge "Sensor simulado" sí aparece).
- **Causa:** los `Marker` de MapLibre alternan el popup con clic por defecto.
- **Opciones:** dejarlo como está (clic) o añadir apertura por *hover*
  (mouseenter/mouseleave).
- **Decisión adoptada:** dejarlo **como está** (apertura por clic). El requisito
  de transparencia se cumple y no justifica el cambio.

## Notas
- **Consola del navegador:** sin errores no capturados. El 429 se maneja dentro
  de la app y se muestra como texto en la interfaz, no como excepción.
- El fallo de H2 no es un defecto de la interfaz sino una limitación del plan
  gratuito del proveedor de embeddings; la app lo reporta correctamente.
