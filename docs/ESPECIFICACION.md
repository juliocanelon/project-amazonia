# ESPECIFICACIÓN FUNCIONAL — Centinela Orinoco (prototipo)

Documento de referencia para la implementación. Complementa a `CLAUDE.md`.

---

## 1. Modelos de datos

### 1.1. Alertas de detección — `public/data/alertas.geojson`

GeoJSON `FeatureCollection` con 12–15 features de tipo `Polygon`, distribuidas en el Arco Minero del Orinoco.

**Área geográfica de referencia:** latitud 5.5°N a 7.5°N, longitud −64.5°W a −61.0°W (estado Bolívar, Venezuela).

Propiedades de cada feature:

```json
{
  "id": "ALT-2026-001",
  "fecha_deteccion": "2026-07-14",
  "superficie_ha": 34.7,
  "severidad": "alta",
  "confianza_modelo": 0.91,
  "sensor_origen": "Sentinel-1 SAR",
  "cuenca": "Río Cuyuní",
  "distancia_area_protegida_km": 12.4,
  "persistencia_dias": 45,
  "id_sensor_agua": "SEN-CUY-03"
}
```

Reglas de generación:

- `severidad` ∈ `alta` | `media` | `baja`
- `confianza_modelo` entre 0 y 1; correlacionada con la severidad
- `sensor_origen` ∈ `Sentinel-1 SAR` | `Sentinel-2 MSI` | `Fusión Sentinel-1/2`
- `cuenca` ∈ `Río Cuyuní` | `Río Caroní` | `Río Yuruari` | `Río Venamo`
- `fecha_deteccion` dentro de los últimos 6 meses
- Los polígonos deben tener forma irregular (no rectángulos perfectos): la minería artesanal produce parches irregulares
- Superficies entre 5 y 120 ha
- `id_sensor_agua` puede ser `null` en algunas alertas (no todas las zonas tienen sensor)

### 1.2. Telemetría simulada — `public/data/telemetria.json`

Un objeto por sensor referenciado en las alertas:

```json
{
  "id_sensor": "SEN-CUY-03",
  "nombre": "Estación Cuyuní Medio",
  "lat": 6.42,
  "lon": -61.83,
  "cuenca": "Río Cuyuní",
  "lecturas": [
    { "fecha": "2026-05-08", "turbidez_ntu": 145, "ph": 6.8, "conductividad_us": 62 }
  ]
}
```

Reglas de generación (90 días de lecturas diarias por sensor):

- **Línea base**: turbidez 120–180 NTU, pH 6.6–7.2, conductividad 55–75 µS/cm, con ruido diario realista
- **Evento minero**: un pico sostenido de turbidez que sube gradualmente hasta 1000–1400 NTU, coincidiendo temporalmente con la `fecha_deteccion` de la alerta asociada, y que se mantiene elevado durante el periodo de `persistencia_dias`
- Durante el evento: pH baja ligeramente (hasta ~5.9) y conductividad sube (hasta ~140 µS/cm)
- La transición debe ser gradual, no un escalón abrupto

### 1.3. Corpus científico — `corpus/`

Un archivo Markdown por fuente, nombrado `NN-primer-autor-año.md`. Las 12 fuentes están en `docs/referencias.json`.

Estructura de cada archivo:

```markdown
---
id: "camalan-2022"
autores: "Camalan, S., Cui, K., Pauca, V. P., et al."
anio: 2022
titulo: "Change detection of Amazonian alluvial gold mining using deep learning and Sentinel-2 imagery"
revista: "Remote Sensing, 14(7), 1746"
doi: "10.3390/rs14071746"
indexacion: "Scopus, Web of Science"
tipo: "resumen_elaborado"
---

> NOTA: Este documento es un resumen elaborado en español a partir del artículo
> original. No reproduce texto literal de la fuente. Sustituible por el resumen
> definitivo del autor del proyecto.

[Resumen de 400–600 palabras: objetivo, metodología, hallazgos principales,
y relevancia para la detección de minería ilegal en la Amazonía venezolana]
```

---

## 2. Esquema de la base vectorial (Supabase / pgvector)

```sql
create extension if not exists vector;

create table fragmentos_corpus (
  id            bigserial primary key,
  fuente_id     text not null,
  autores       text not null,
  anio          int  not null,
  titulo        text not null,
  revista       text,
  doi           text,
  indexacion    text,
  fragmento     text not null,
  posicion      int  not null,
  embedding     vector(1024),
  creado_en     timestamptz default now()
);

create index on fragmentos_corpus
  using hnsw (embedding vector_cosine_ops);
```

Ajustar la dimensión del vector al modelo de embeddings elegido y documentarlo.

**Script de indexación** (`scripts/indexar-corpus.ts`): lee `corpus/`, trocea cada documento en fragmentos de ~500 tokens con solapamiento de ~50, genera embeddings, y hace *upsert* en la tabla. Debe ser **re-ejecutable de forma idempotente** (borra e inserta por `fuente_id`) para poder sustituir resúmenes sin duplicar filas.

---

## 3. Rutas de la aplicación

| Ruta | Contenido |
|---|---|
| `/` | Tablero principal: mapa de alertas + panel de detalle |
| `/asistente` | Chat conversacional con RAG |
| `/acerca` | Alcance del prototipo y arquitectura completa |

## 4. API routes

| Endpoint | Método | Función |
|---|---|---|
| `/api/contexto` | POST | Recibe `{ alertaId }`. Recupera fragmentos relevantes según cuenca/tema y genera la ficha de contexto. Devuelve `{ ficha, fuentes[] }` |
| `/api/chat` | POST | Recibe `{ mensaje, historial }`. Recupera fragmentos, genera respuesta anclada. Devuelve `{ respuesta, fuentes[] }` |

Ambos endpoints deben devolver el array `fuentes` con `{ autores, anio, titulo, revista }` para poder mostrar las citas.

---

## 5. Pantallas y componentes

### 5.1. Tablero principal (`/`)

**Cabecera**
- Título "Centinela Orinoco"
- Banner permanente de transparencia (texto exacto en `CLAUDE.md`)
- Navegación: Tablero · Asistente · Acerca del prototipo

**Mapa (MapLibre GL)**
- Centrado en el Arco Minero del Orinoco, zoom inicial que abarque el área completa
- Polígonos coloreados por severidad: alta = rojo, media = ámbar, baja = amarillo
- Marcadores diferenciados para las estaciones de sensores, con etiqueta "simulado"
- Leyenda visible
- Clic en polígono → abre panel de detalle

**Filtros**
- Por severidad (multi-selección)
- Por cuenca (multi-selección)
- Por rango de fechas
- Contadores que se actualizan con los filtros: número de alertas activas y hectáreas acumuladas

**Panel de detalle** (lateral, se abre al seleccionar una alerta)
- Todos los campos de la alerta, con etiqueta "pre-calculado" en la cabecera del bloque
- **Ficha de contexto RAG**: se genera bajo demanda (botón o carga automática al abrir), con estado de carga visible. Muestra el texto generado y debajo la lista de fuentes citadas
- **Gráfica de telemetría** (Recharts): turbidez, pH y conductividad del sensor asociado, con el periodo de la alerta resaltado mediante un `ReferenceArea`. Etiqueta "simulado" visible
- Si la alerta no tiene sensor asociado, indicarlo explícitamente

### 5.2. Asistente (`/asistente`)

- Interfaz de chat con historial de la sesión
- Cada respuesta muestra debajo las fuentes consultadas (autores, año, revista)
- Estado de carga mientras se recupera y genera
- 4 preguntas de ejemplo clicables:
  1. "¿Qué evidencia científica hay de contaminación por mercurio en el río Cuyuní?"
  2. "¿Por qué se usa radar en lugar de imágenes ópticas para detectar minería en la Amazonía?"
  3. "¿Qué técnicas se han aplicado para detectar minería artesanal desde satélite?"
  4. "¿Qué se sabe sobre la degradación forestal en la Amazonía venezolana?"
- Si el corpus no cubre la pregunta, la respuesta debe declararlo abiertamente

### 5.3. Acerca del prototipo (`/acerca`)

- Tabla de componentes: implementado / no implementado (la de `CLAUDE.md`)
- Explicación de la arquitectura completa por capas y de dónde vendría cada dato en producción
- Aclaración sobre el mercurio: el sistema no lo mide en campo; los sensores miden proxies
- Listado de las 12 fuentes del corpus con sus datos bibliográficos completos

---

## 6. System prompt del RAG

El servicio de generación debe operar bajo estas instrucciones (adaptar la redacción, conservar las restricciones):

```
Eres el asistente documental de Centinela Orinoco, un sistema de monitoreo de
minería ilegal en el Arco Minero del Orinoco (Venezuela).

Respondes EXCLUSIVAMENTE con base en los fragmentos de contexto que se te
proporcionan. Reglas estrictas:

1. Si los fragmentos no contienen información suficiente para responder, dilo
   explícitamente. Nunca completes con conocimiento general.
2. Nunca inventes citas, autores, años, cifras ni DOIs.
3. Cita a los autores por apellido y año cuando afirmes algo que provenga de
   una fuente.
4. Distingue lo que las fuentes afirman de lo que son inferencias tuyas.
5. Si el usuario pregunta por datos de campo en tiempo real, aclara que las
   detecciones del prototipo son pre-calculadas y la telemetría es simulada.
6. Responde en español, con precisión técnica y sin adornos.
```

---

## 7. Criterios de aceptación

El prototipo está terminado cuando:

- [ ] El mapa carga y muestra las alertas coloreadas por severidad
- [ ] Los filtros modifican tanto el mapa como los contadores
- [ ] Al seleccionar una alerta se abre el panel con sus datos completos
- [ ] La ficha de contexto se genera con RAG real y muestra fuentes verificables
- [ ] La gráfica de telemetría muestra el pico coincidente con la fecha de la alerta
- [ ] El chat responde citando fuentes y admite cuando no sabe
- [ ] El banner de transparencia es visible en todas las pantallas
- [ ] La página `/acerca` está completa
- [ ] Las etiquetas "simulado" y "pre-calculado" acompañan a los datos correspondientes
- [ ] El script de indexación es re-ejecutable sin duplicar filas
- [ ] No hay claves de API expuestas en el cliente
- [ ] El README documenta instalación, variables de entorno, re-indexación y despliegue
- [ ] La aplicación despliega correctamente en Vercel

---

## 8. Orden de trabajo

1. Estructura Next.js + Tailwind + `.env.example`
2. Generación de `alertas.geojson` y `telemetria.json`
3. Mapa funcional con filtros y panel de detalle (ficha con datos mock)
4. Corpus + esquema Supabase + script de indexación
5. API routes de RAG (recuperación + generación)
6. Conexión del RAG a la ficha de contexto y al chat
7. Página `/acerca`, banner y etiquetas de transparencia
8. README y verificación de despliegue en Vercel

Describe tu plan antes de cada etapa y resume al terminarla.
