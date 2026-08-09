# CLAUDE.md — Centinela Orinoco

Contexto persistente del proyecto. Claude Code lee este archivo automáticamente en cada sesión.

## Qué es este proyecto

Prototipo funcional de la capa de consumo y memoria semántica de **Centinela Orinoco**, un sistema de detección y monitoreo de minería ilegal en el Arco Minero del Orinoco (estado Bolívar, Amazonía venezolana).

Es el entregable práctico de un proyecto integrador de maestría (UNEG — Maestría en Tecnologías de la Información, asignatura Arquitecturas de Datos Inteligentes). Autor: Julio César Canelón.

## Alcance: qué se implementa y qué no

La arquitectura completa diseñada en la propuesta académica tiene cinco capas. **Este prototipo implementa solo una parte.**

| Componente | Estado en el prototipo |
|---|---|
| Servicio RAG (recuperación + generación con citas) | **IMPLEMENTADO — real y funcional** |
| Base de datos vectorial sobre corpus científico | **IMPLEMENTADO — corpus real** |
| Tablero web (mapa, panel de detalle, chat) | **IMPLEMENTADO — real y funcional** |
| Polígonos de detección de minería | Pre-calculados, cargados desde GeoJSON estático |
| Telemetría de sensores IoT | Simulada sintéticamente |
| Ingesta (Kafka / NiFi / MQTT / LoRaWAN) | No se implementa — solo diseño documentado |
| Lakehouse (Delta Lake / MinIO) | No se implementa — solo diseño documentado |
| Orquestación (Apache Airflow) | No se implementa — solo diseño documentado |
| Modelo de detección (CNN / Random Forest) | No se implementa — solo diseño documentado |

## REGLA CRÍTICA: honestidad sobre el alcance

Este es un requisito académico, no una preferencia estética. **El prototipo debe declarar visiblemente qué es real y qué es simulado.** No debe aparentar ser un pipeline vivo que no existe.

Obligatorio en toda la aplicación:

1. Banner permanente en la cabecera con el texto exacto:
   > "Prototipo académico — Capa semántica (RAG) operativa sobre corpus científico real. Detecciones pre-calculadas y telemetría simulada con fines demostrativos."
2. Página `/acerca` que explique en detalle qué está implementado, qué no, y de dónde vendría cada dato en un despliegue real.
3. Etiquetas discretas de "simulado" o "pre-calculado" junto a los datos correspondientes en la interfaz.

Nunca elimines ni suavices estos elementos. Si una decisión de diseño entra en conflicto con la transparencia, gana la transparencia.

## Reglas sobre datos y contenido

- **No inventes referencias bibliográficas.** El corpus está compuesto por 24 fuentes reales en `corpus/`: 14 científicas arbitradas y 10 de prensa/informes no arbitrados. Las referencias base están verificadas en `docs/referencias.json`; las fuentes adicionales incorporan sus datos bibliográficos tomados directamente del propio documento (declarado en la NOTA de cada archivo). Si hace falta una fuente nueva, pregúntame; no fabriques citas ni DOIs.
- **No reproduzcas texto literal de los artículos.** Los archivos del corpus son resúmenes redactados en español, marcados como tales en su encabezado.
- **No inventes datos científicos.** Las cifras de mercurio, deforestación y superficie provienen de las fuentes del corpus.
- El asistente RAG debe responder **exclusivamente** con base en los fragmentos recuperados. Si el corpus no cubre la pregunta, debe decirlo explícitamente en vez de fabricar una respuesta.

## Stack técnico

- **Next.js 14+ (App Router) + TypeScript** — desplegable en Vercel
- **Tailwind CSS**
- **MapLibre GL JS** con tiles de OpenStreetMap (no Mapbox: requiere token de pago)
- **Recharts** para series temporales
- **Supabase + pgvector** como base vectorial
- **@anthropic-ai/sdk** para generación. Modelo: `claude-sonnet-5` (verificar disponibilidad en https://docs.claude.com/en/docs/about-claude/models/overview antes de fijarlo)
- **Embeddings**: Voyage AI si tiene capa gratuita suficiente; si complica el arranque, alternativa local con Transformers.js. Documenta la decisión en el README.

Todas las claves de API van en variables de entorno y **solo se usan en API routes del servidor**, nunca desde el cliente.

## Convenciones

- Toda la interfaz de usuario en **español**
- Comentarios de código en español donde la lógica no sea evidente
- Componentes modulares y tipados; nada de `any` salvo justificación
- Manejo explícito de errores en llamadas a APIs y a la base vectorial
- Estados de carga visibles en la UI
- Solo servicios con capa gratuita; nada que requiera tarjeta de crédito

## Diseño visual

Sobrio y profesional, apropiado para una defensa académica de postgrado — no un dashboard de startup. Paleta oscura con acentos por severidad. Buena densidad de información, legible al proyectarse en pantalla grande. Responsive, priorizando escritorio.

## Glosario del dominio

- **ASGM**: minería aurífera artesanal y de pequeña escala
- **Arco Minero del Orinoco**: zona de explotación minera en el estado Bolívar, Venezuela
- **RAG**: generación aumentada por recuperación
- **Turbidez (NTU)**: proxy de actividad minera; la minería aluvial remueve sedimentos hacia los ríos
- **Cuencas del área**: Río Cuyuní, Río Caroní, Río Yuruari, Río Venamo
- **Nota importante**: el sistema NO mide mercurio en campo. El mercurio requiere análisis de laboratorio. Los sensores miden proxies (turbidez, pH, conductividad) que orientan dónde priorizar el muestreo analítico.

## Flujo de trabajo

Antes de escribir código en una etapa nueva, describe brevemente tu plan y espera confirmación. Al terminar cada etapa, resume qué quedó hecho y qué falta.
