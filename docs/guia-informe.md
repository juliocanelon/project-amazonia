# Guía para el informe — dónde está cada cosa

Índice maestro de la documentación de **Centinela Orinoco**, para localizar
rápidamente la evidencia y la información al redactar el informe del proyecto
integrador (UNEG · Maestría en TI · Arquitecturas de Datos Inteligentes).

> **Fuente primaria recomendada:** casi todos los archivos de `components/`,
> `lib/`, `app/` y `scripts/` empiezan con una **cabecera de documentación** con
> cuatro apartados: *Qué hace · Rol en el sistema · Decisión de arquitectura ·
> Para el informe*. Leerlas es la forma más rápida de citar decisiones concretas.

---

## Mapa temático (tema del informe → dónde está)

| Tema del informe | Dónde encontrarlo |
|---|---|
| **Alcance y frontera de honestidad** (qué es real / simulado / diseño) | `CLAUDE.md` (regla crítica); página `/acerca` (`app/acerca/page.tsx`); banner en `components/Cabecera.tsx`; `README.md` §"Alcance y frontera de honestidad". |
| **Arquitectura del sistema** (5 capas y flujo) | Página `/arquitectura` (`components/DiagramaArquitectura.tsx`) — diagrama animado interactivo; `README.md` §"Stack técnico"; `docs/ESPECIFICACION.md`. |
| **Capa RAG: recuperación** (embeddings + vectorial) | `lib/embeddings.ts` (Voyage), `lib/rag.ts` (recuperación), `supabase/schema.sql` (pgvector + `match_fragmentos`), `lib/supabaseServidor.ts`. |
| **Capa RAG: generación con citas** | `lib/generacion.ts` (system prompt anti-alucinación), rutas `app/api/contexto/route.ts` y `app/api/chat/route.ts`. |
| **Corpus y referencias** | Carpeta `corpus/` (24 fuentes .md); `docs/referencias.json` (referencias verificadas); lista completa en `/acerca` y en `README.md` §"Corpus"; indexador `scripts/indexar-corpus.ts`. |
| **Interpretación IA de la telemetría** | `app/api/interpretacion/route.ts` + `components/GraficaTelemetria.tsx` (subcomponente `InterpretacionIA`). |
| **Datos demostrativos** (detecciones y telemetría) | `scripts/generar-datos.ts` (generación reproducible con semilla); `public/data/alertas.geojson` y `public/data/telemetria.json`. |
| **Seguridad / control de acceso** | `middleware.ts` (protección global), `lib/acceso.ts` (hash del PIN), `app/api/acceso/route.ts`, `app/acceso/page.tsx`. |
| **Responsividad / UX** | `README.md` §Bitácora (decisiones de móvil); `components/VistaMapa.tsx`, `PanelFiltros.tsx`, `Mapa.tsx`, `Cabecera.tsx`. |
| **Decisiones de diseño** (con justificación) | `README.md` §"Bitácora de puesta en marcha → Decisiones de diseño". |
| **Incidencias técnicas y su resolución** | `README.md` §"Bitácora → Incidencias encontradas y su resolución". |
| **Pruebas / verificación (QA)** | `docs/qa-informe-2026-08-09.md` (informe de QA + triage de hallazgos). |
| **Despliegue** | `README.md` §"Despliegue en Vercel"; variables en `.env.example`. |
| **Reproducibilidad** (paso a paso) | `README.md` §"Bitácora → Reproducibilidad". |

---

## Documentos clave

- **`README.md`** — documento central: alcance, stack, estructura, instalación,
  despliegue y la **bitácora de puesta en marcha** (decisiones e incidencias).
- **`CLAUDE.md`** — reglas del proyecto: alcance, honestidad, datos y contenido,
  convenciones. Útil para justificar por qué el prototipo es como es.
- **`docs/ESPECIFICACION.md`** — especificación técnica (modelos de datos, API,
  criterios de aceptación).
- **`docs/referencias.json`** — referencias bibliográficas verificadas del corpus.
- **`docs/qa-informe-2026-08-09.md`** — evidencia de verificación funcional.
- **`docs/guia-informe.md`** — este índice.

---

## Qué es real, qué no (resumen para citar)

| Componente | Estado | Evidencia |
|---|---|---|
| Capa semántica RAG (recuperación + generación con citas) | **Real y funcional** | `lib/rag.ts`, `lib/generacion.ts`, `corpus/`, Supabase/pgvector |
| Base vectorial sobre corpus científico | **Real** | `supabase/schema.sql`, 73 fragmentos indexados |
| Tablero web (mapa, detalle, chat, arquitectura) | **Real** | `components/`, `app/` |
| Polígonos de detección de minería | **Pre-calculado** | `public/data/alertas.geojson`, `scripts/generar-datos.ts` |
| Telemetría de sensores | **Simulado** | `public/data/telemetria.json`, `scripts/generar-datos.ts` |
| Ingesta, Lakehouse, Orquestación, Modelo de detección | **Diseño documentado** | `/arquitectura`, `/acerca`, `docs/ESPECIFICACION.md` |

---

## Cifras útiles

- **Corpus:** 24 fuentes reales = 14 científicas arbitradas + 10 de prensa/informes.
- **Fragmentos indexados:** 73.
- **Embeddings:** Voyage `voyage-3.5-lite`, 1024 dimensiones (multilingüe).
- **Generación:** Anthropic `claude-sonnet-5` (configurable).
- **Cuencas monitoreadas:** Río Cuyuní, Río Caroní, Río Yuruari, Río Venamo.
- **Rutas de la app:** `/` (tablero), `/asistente`, `/arquitectura`, `/acerca`,
  `/acceso`; APIs `/api/contexto`, `/api/chat`, `/api/interpretacion`, `/api/acceso`.
