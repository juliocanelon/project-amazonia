# Centinela Orinoco

Prototipo funcional de la **capa de consumo con memoria semántica (RAG)** de una
arquitectura de datos inteligente para detectar y monitorear la minería ilegal
en el **Arco Minero del Orinoco** (estado Bolívar, Amazonía venezolana).

Proyecto de maestría — UNEG, asignatura *Arquitecturas de Datos Inteligentes*.

---

## 🎯 Alcance y frontera de honestidad

Este prototipo implementa **una sola capa** del sistema completo. Declara de
forma visible qué es real y qué es demostrativo (requisito académico):

| Componente | Estado | Detalle |
|---|---|---|
| **Capa semántica RAG** | ✅ **Real** | Corpus científico real, embeddings, recuperación vectorial y respuestas con citas verificables. |
| **Detecciones de minería** | 🔵 **Pre-calculado** | Se cargan desde un GeoJSON estático. En producción vendrían del modelo de detección satelital vía Airflow. |
| **Telemetría de sensores** | 🟡 **Simulado** | Turbidez/pH/conductividad sintéticos. En producción vendrían de nodos ESP32 vía MQTT/LoRaWAN. |

El resto de la arquitectura (ingesta Kafka/NiFi, Lakehouse Delta Lake/MinIO,
orquestación Airflow, modelo de detección) queda **documentado como diseño**, no
se implementa. Ver la página **"Acerca del prototipo"** dentro de la app.

---

## 🧱 Stack técnico

- **Next.js 14 (App Router) + TypeScript** — desplegable en Vercel.
- **Tailwind CSS** — tema oscuro sobrio.
- **MapLibre GL JS** + teselas oscuras de CARTO (derivadas de OpenStreetMap, sin token de pago).
- **Recharts** — series temporales de telemetría.
- **Supabase + pgvector** — base de datos vectorial (capa gratuita).
- **Voyage AI** (`voyage-3.5-lite`, multilingüe) — embeddings (capa gratuita).
- **API de Anthropic** (`@anthropic-ai/sdk`) — generación de respuestas RAG (configurable).

> Todas las llamadas a APIs con claves ocurren en **API routes del servidor**
> (`/app/api/rag/*`). Ninguna clave se expone al cliente.

### Sobre el proveedor de embeddings

Se eligió **Voyage AI** por su capa gratuita amplia (sin tarjeta), sus modelos
multilingües —el corpus está en español— y su buena integración con Anthropic.
Para cambiar de proveedor basta con reescribir [lib/embeddings.ts](lib/embeddings.ts)
y ajustar la dimensión del vector en [supabase/schema.sql](supabase/schema.sql).

### Sobre el modelo de generación

La API de Anthropic **requiere créditos de pago** (no tiene capa gratuita). El
modelo es configurable con la variable `ANTHROPIC_MODEL`. Si la clave falta, la
app **no se rompe**: la ficha y el chat muestran los fragmentos recuperados por
similitud vectorial (con sus citas) y un aviso de que la generación está
deshabilitada.

---

## 📂 Estructura del proyecto

```
app/
  (dashboard)  page.tsx        → mapa + filtros + panel de detalle
  asistente/   page.tsx        → chat conversacional RAG
  acerca/      page.tsx        → transparencia de alcance
  api/rag/contexto/route.ts    → ficha RAG por alerta (servidor)
  api/rag/chat/route.ts        → chat RAG (servidor)
components/                    → Mapa, PanelAlerta, GraficaTelemetria, ChatRAG, Cabecera…
lib/                           → tipos, embeddings (Voyage), supabaseServidor, rag, generacion
corpus/                        → 24 resúmenes .md con front-matter bibliográfico (14 ciencia + 10 prensa)
scripts/
  generar-datos.ts             → genera alertas.geojson y telemetria.json
  indexar-corpus.ts            → chunking + embeddings + upsert a Supabase (re-ejecutable)
supabase/schema.sql            → tabla documentos + pgvector + función match_documentos
public/data/                   → alertas.geojson, telemetria.json (generados)
```

---

## 🚀 Instalación local

### 1. Requisitos

- Node.js 18+ (probado con Node 22).
- Una cuenta gratuita de [Supabase](https://supabase.com).
- Una clave de [Voyage AI](https://www.voyageai.com) (capa gratuita, sin tarjeta).
- *(Opcional)* Una clave de [Anthropic](https://console.anthropic.com) con créditos.

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno

Copia `.env.example` a `.env.local` y rellena los valores:

```bash
cp .env.example .env.local
```

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (solo servidor). |
| `VOYAGE_API_KEY` | Clave de Voyage AI. |
| `VOYAGE_MODEL` | Modelo de embeddings (por defecto `voyage-3.5-lite`). |
| `ANTHROPIC_API_KEY` | Clave de Anthropic (opcional; sin ella se degrada con elegancia). |
| `ANTHROPIC_MODEL` | Modelo de generación (por defecto `claude-sonnet-5`). Alternativas: `claude-haiku-4-5` (más económico), `claude-opus-5` (máxima calidad). |

### 4. Preparar la base vectorial (Supabase)

1. En el panel de Supabase, abre **SQL Editor**.
2. Pega y ejecuta el contenido de [supabase/schema.sql](supabase/schema.sql).
   Esto crea la extensión `vector`, la tabla `documentos` y la función
   `match_documentos`.

### 5. Generar los datos demostrativos (opcional)

Los archivos `public/data/alertas.geojson` y `public/data/telemetria.json` ya
vienen generados. Para regenerarlos de forma reproducible:

```bash
npm run generar-datos
```

### 6. Indexar el corpus

Con Supabase y Voyage configurados:

```bash
npm run indexar-corpus
```

Esto lee los archivos de `corpus/` (24: 14 científicos y 10 de prensa), los
fragmenta, genera sus embeddings con Voyage y los inserta en Supabase.

### 7. Ejecutar

```bash
npm run dev
```

Abre <http://localhost:3000>.

---

## 🔄 Re-indexación del corpus

El corpus está pensado para **sustituirse** por los resúmenes definitivos. El
proceso es re-ejecutable y no genera duplicados (borra por `id` antes de
insertar):

1. Edita o reemplaza los archivos `.md` en [corpus/](corpus/). Cada archivo
   necesita un front-matter con estos campos. Para fuentes científicas:

   ```markdown
   ---
   id: "garcia-sanchez-2008"
   autores: "García-Sánchez, A., Contreras, F., Adams, M., & Santos-Francés, F."
   anio: 2008
   titulo: "Mercury contamination of surface water and fish..."
   revista: "International Journal of Environment and Pollution, 33(2/3), 260-274"
   doi: "10.1504/IJEP.2008.019398"
   indexacion: "Scopus"
   tipo: "resumen_elaborado"
   ---

   NOTA: Resumen elaborado en español. No reproduce texto literal del original.

   (texto del resumen…)
   ```

   Para fuentes de prensa o informes no arbitrados, usa `tipo: "prensa"` y añade
   `fecha` y `url` cuando existan (`null` si no):

   ```markdown
   ---
   id: "csis-mineria-ilegal-venezuela-2020"
   autores: "Rendon, M., Sandin, L., & Fernandez, C."
   anio: 2020
   titulo: "Minería ilegal en Venezuela…"
   revista: "Center for Strategic and International Studies (CSIS)"
   fecha: "2020-04"
   url: null
   doi: null
   indexacion: "No arbitrada (think tank / informe de política pública)"
   tipo: "prensa"
   ---
   ```

   El campo `id` es la clave única del documento (se acepta `ref` por
   compatibilidad). Todo lo que esté fuera del front-matter (menos la nota y los
   encabezados) se indexa como contenido.

2. Vuelve a ejecutar:

   ```bash
   npm run indexar-corpus
   ```

Para **cambiar el proveedor o modelo de embeddings**, ajusta `VOYAGE_MODEL` (o
reescribe `lib/embeddings.ts`), actualiza la dimensión del vector en
`supabase/schema.sql`, vuelve a ejecutar el `schema.sql` y re-indexa.

---

## ☁️ Despliegue en Vercel

1. Sube el repositorio a GitHub.
2. En [Vercel](https://vercel.com), importa el proyecto (framework Next.js se
   detecta automáticamente).
3. En **Settings → Environment Variables**, añade las mismas variables de
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `VOYAGE_API_KEY`, `VOYAGE_MODEL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`).
4. Despliega. Las API routes de RAG corren como funciones serverless (runtime
   Node.js).

> La indexación del corpus (`npm run indexar-corpus`) se ejecuta **una vez en
> local** (o en cualquier máquina con las variables configuradas), no en Vercel:
> escribe directamente en Supabase, que es la fuente de datos del despliegue.

---

## 🛠️ Bitácora de puesta en marcha (decisiones e incidencias)

Registro del proceso real de construcción y despliegue del prototipo, pensado
como insumo para el informe. Documenta las decisiones de diseño tomadas y las
incidencias técnicas encontradas con su resolución.

### Secuencia de puesta en marcha

1. **Construcción de la app** (Next.js 14 App Router + TypeScript + Tailwind):
   tablero (mapa MapLibre, panel de detalle, gráficas), asistente RAG y página
   de transparencia `/acerca`.
2. **Preparación del corpus**: los PDF y notas descargados se transcribieron a
   resúmenes en español (`.md` con front-matter bibliográfico) en una sesión
   aparte, respetando la regla de no reproducir texto literal.
3. **Base vectorial (Supabase)**: ejecución de `supabase/schema.sql` (extensión
   `vector`, tabla `fragmentos_corpus`, índice HNSW y función
   `match_fragmentos`).
4. **Credenciales**: alta de claves de Supabase, Voyage AI y Anthropic en
   `.env.local` (nunca versionadas).
5. **Indexación**: `npm run indexar-corpus` — fragmentación (~500 tokens con
   solapamiento), embeddings con Voyage y carga en pgvector.
6. **Verificación**: pruebas de conectividad de cada servicio y prueba
   extremo-a-extremo del circuito RAG.
7. **Publicación**: commit inicial y `git push` a GitHub; despliegue en Vercel.

### Decisiones de diseño

| Decisión | Justificación |
|---|---|
| **Corpus mixto ciencia + prensa**, con campo `tipo` (`resumen_elaborado` / `prensa`) | El fenómeno (minería ilegal) se documenta tanto en literatura arbitrada como en informes de organismos y prensa. Se incorporan ambos, pero **visiblemente distinguidos** en la interfaz y al citar, para no equiparar prensa con ciencia revisada por pares. |
| **Ampliación de 12 → 24 fuentes** (14 científicas + 10 de prensa) | Durante el procesamiento del corpus se localizaron fuentes venezolanas relevantes sobre mercurio y minería no incluidas en la lista base. Las 6 científicas nuevas **no figuran en `docs/referencias.json`**; sus datos bibliográficos se tomaron directamente del propio documento y así se declara en la NOTA de cada archivo y con una etiqueta en `/acerca`. |
| **Embeddings: Voyage `voyage-3.5-lite` (1024 dim)** | Modelo multilingüe (el corpus está en español), con **capa gratuita sin tarjeta** y 200M tokens gratuitos. La dimensión 1024 fija el esquema de la tabla. |
| **Generación: `claude-sonnet-5` con degradación elegante** | Si falta `ANTHROPIC_API_KEY`, la app no se rompe: muestra los fragmentos recuperados con sus citas y un aviso. Esto permite operar el RAG (recuperación) aun sin créditos de generación. |
| **RLS activado en Supabase** | La app accede **solo desde el servidor** con la `service_role` key (que ignora RLS). Activar Row Level Security sin políticas bloquea el acceso anónimo público sin afectar la app. |
| **Anti-alucinación en el prompt del sistema** | El asistente responde **exclusivamente** con los fragmentos recuperados, cita autor+año, distingue prensa de ciencia y declara explícitamente cuando el corpus no cubre la pregunta. |

### Incidencias encontradas y su resolución

| Incidencia | Causa | Resolución |
|---|---|---|
| **Límite de tasa de Voyage (HTTP 429)** al indexar | La capa gratuita sin método de pago está limitada a **3 peticiones/min** y 10K tokens/min. | Se añadió al indexador un **espaciado de ~22 s entre peticiones** y **reintento automático** ante 429 (`RETARDO_MS` en `scripts/indexar-corpus.ts`). La indexación tarda unos minutos pero **no requiere tarjeta**. |
| **Función `match_fragmentos` ausente** tras correr el schema | El `schema.sql` se aplicó de forma parcial (la tabla se creó, la función no). | Como el script es **idempotente** (`create table if not exists`, `create or replace function`), bastó **re-ejecutarlo completo** en el SQL Editor. |
| **Aviso de Supabase: tabla sin RLS** | Buenas prácticas de seguridad de Supabase. | Se eligió **"Run and enable RLS"**: no afecta a la app (usa `service_role`) y cierra el acceso anónimo. |
| **Clave de Voyage con prefijo duplicado** (`pa-pa-…`) | Al pegar la clave sobre el ejemplo de la plantilla quedó el prefijo `pa-` repetido. | Se detectó con una **validación de formato** y una **prueba de conexión en vivo**; corregida, la prueba devolvió un embedding de 1024 dimensiones. |
| **Valores `null` del front-matter guardados como texto `"null"`** | El parser mínimo de front-matter no distinguía el literal `null`. | Se normalizó en el indexador: `fecha`, `url` e `indexacion` con valor `"null"` se guardan como `NULL` real. |
| **Vulnerabilidad de seguridad en Next.js 14.2.15** | Versión con CVE conocido. | Actualización a **`next@^14.2.35`**. |

### Reproducibilidad (resumen paso a paso)

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno (ver .env.example para el formato de cada valor)
cp .env.example .env.local   # y rellenar Supabase, Voyage y (opcional) Anthropic

# 3. En Supabase → SQL Editor: ejecutar supabase/schema.sql completo
#    (al aparecer el aviso de RLS, elegir "Run and enable RLS")

# 4. Indexar el corpus (respeta el límite gratuito de Voyage; tarda unos minutos)
npm run indexar-corpus

# 5. Ejecutar
npm run dev   # http://localhost:3000
```

---

## 📜 Scripts

| Script | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo. |
| `npm run build` | Compilación de producción. |
| `npm run generar-datos` | Regenera `alertas.geojson` y `telemetria.json`. |
| `npm run indexar-corpus` | Indexa el corpus en Supabase/pgvector. |

---

## ⚠️ Restricciones y notas

- No se usan servicios de pago obligatorios salvo la API de Anthropic (opcional
  y con fallback). Supabase y Voyage funcionan en capas gratuitas sin tarjeta.
- Las referencias bibliográficas son reales; los resúmenes del corpus son
  **elaborados** (no reproducen texto literal de los artículos). El corpus mezcla
  fuentes científicas arbitradas y fuentes de prensa/informes **no arbitrados**,
  distinguidas visiblemente en la interfaz y al citar.
- Las detecciones y la telemetría son **demostrativas** y no representan eventos
  reales verificados.

---

## 📚 Corpus (24 fuentes reales)

El corpus mezcla dos tipos de fuente, distinguidos por el campo `tipo` del
front-matter y etiquetados en la interfaz.

### Científicas revisadas por pares (14)

1. Camalan et al. (2022). *Remote Sensing*, 14(7), 1746.
2. Becerra et al. (2024). *Environmental Research Communications*, 6(12), 125022.
3. Gallwey et al. (2020). *Remote Sensing of Environment*, 248, 111970.
4. Fonseca et al. (2024). *Remote Sensing*, 16(10), 1749.
5. Lobo et al. (2018). *Remote Sensing*, 10(8), 1178.
6. Pacheco-Angulo et al. (2021). *Remote Sensing*, 13(8), 1435.
7. García-Sánchez et al. (2008). *Int. J. Environment and Pollution*, 33(2/3), 260-274.
8. Ficili et al. (2025). *Sensors*, 25(6), 1763.
9. Carrasquero-Durán & Adams (2003). *Agronomía Tropical*, 53(3). †
10. García-Sánchez et al. (2006). *Environmental Geochemistry and Health*, 28, 529-540. †
11. García-Sánchez et al. (2006). *Int. J. Environmental Health Research*, 16(5), 361-373. †
12. Álvarez Fermín & Rojas (2009). *Universidad, Ciencia y Tecnología*, 13(51). †
13. Shrestha & Ruiz de Quilarque (1989). *The Science of the Total Environment*, 79, 233-239. †
14. Urbani et al. (2012). *Rev. Fac. Ingeniería UCV*, 27(2). †

† No figuran en `docs/referencias.json`; son fuentes científicas arbitradas
localizadas durante el procesamiento del corpus, con datos bibliográficos
tomados directamente del propio documento.

### Prensa e informes no arbitrados (10)

15. OACNUDH / ONU (2020). *Informe A/HRC/44/54 — Arco Minero del Orinoco*.
16. Rendon et al. / CSIS (2020). *Minería ilegal en Venezuela*.
17. Global Nature Watch / WRI (2026). *Venezuela Deforestation Rates & Statistics*.
18. Ya Es Hora Venezuela (2026). *El Arco Minero del Orinoco: explotación e impacto ambiental*.
19. Transparencia Venezuela (2023). *Economías ilícitas en Venezuela — Arco Minero*.
20. Transparencia Venezuela (2022). *Arco Minero del Orinoco: concentración de ilícitos*.
21. Pernalete / Martí Noticias (2026). *Denuncian ante la CIDH la expansión de la minería ilegal*.
22. Ruiz & Belo / Global Forest Watch (2021). *La minería de oro y los bosques venezolanos*.
23. Moreno Parra / Clima21 (2023). *Minería y racismo ambiental*.
24. Clima21 (2023). *Situación de los derechos humanos ambientales en Venezuela 2022*.
