# Kit para desarrollar el prototipo con Claude Code

## Archivos de este kit

| Archivo | Dónde va | Para qué sirve |
|---|---|---|
| `CLAUDE.md` | Raíz del proyecto | Contexto persistente. Claude Code lo lee automáticamente en cada sesión, sin que tengas que repetirlo. |
| `ESPECIFICACION.md` | `docs/ESPECIFICACION.md` | Especificación funcional detallada: modelos de datos, esquema SQL, rutas, pantallas, criterios de aceptación. |
| `referencias.json` | `docs/referencias.json` | Las 12 fuentes verificadas del corpus. Evita que se inventen referencias. |
| `INSTRUCCIONES.md` | (este archivo) | Cómo montar todo y el prompt inicial. |

---

## Paso 1 — Preparar la carpeta

```bash
mkdir centinela-orinoco && cd centinela-orinoco
git init
mkdir docs
```

Copia `CLAUDE.md` a la raíz, y `ESPECIFICACION.md` y `referencias.json` dentro de `docs/`.

## Paso 2 — Cuentas necesarias (todas con capa gratuita)

Conviene tenerlas listas antes de empezar, para no bloquearte a mitad de camino:

1. **Supabase** — proyecto nuevo, con la extensión `vector` habilitada. Anota la URL del proyecto y la `service_role key`.
2. **Anthropic** — clave de API desde la consola.
3. **Proveedor de embeddings** — Voyage AI u otro; o decidir con Claude Code usar un modelo local.
4. **Vercel** — cuenta conectada a tu GitHub para el despliegue.

## Paso 3 — Iniciar la sesión

```bash
claude
```

Y pega el prompt inicial que está más abajo.

---

## PROMPT INICIAL

> Copia desde aquí hasta el final del bloque.

```
Vamos a construir el prototipo "Centinela Orinoco".

Antes de escribir nada de código, lee estos tres archivos y confírmame que los
entendiste:

- CLAUDE.md (raíz del proyecto): contexto, alcance, reglas de honestidad y stack
- docs/ESPECIFICACION.md: especificación funcional completa
- docs/referencias.json: las 12 fuentes verificadas del corpus

Contexto de por qué importa el alcance: este prototipo es el entregable práctico
de un proyecto de maestría. La arquitectura completa tiene cinco capas, pero solo
implementamos la capa de consumo y la memoria semántica (RAG). Las detecciones de
minería son pre-calculadas y la telemetría de sensores es simulada. Esto NO es una
carencia que haya que disimular: la transparencia sobre el alcance es un requisito
de evaluación explícito, y el prototipo debe declararla visiblemente en la interfaz.

Lo que sí es completamente real y funcional es el RAG: el corpus son 12 artículos
científicos verdaderos, la recuperación vectorial es real y las citas son
verificables. Esa es la parte que voy a demostrar en vivo durante la defensa.

Trabajaremos en las 8 etapas listadas al final de la especificación, en orden.

Empieza por lo siguiente:
1. Confirma que leíste los tres archivos y resume en pocas líneas qué vamos a
   construir y qué queda fuera del alcance.
2. Señálame cualquier decisión técnica que consideres que debo tomar yo antes de
   arrancar (por ejemplo, el proveedor de embeddings).
3. Propón el plan concreto de la Etapa 1 (estructura del proyecto) y espera mi
   confirmación antes de crear archivos.

No escribas código todavía.
```

---

## Cómo trabajar durante el desarrollo

**Confirma antes de cada etapa.** El prompt ya se lo pide, pero si Claude Code se adelanta, detenlo. Es más barato corregir un plan que un módulo entero.

**Verifica el RAG con preguntas trampa.** Cuando el asistente esté funcionando, pregúntale algo que el corpus no cubra —por ejemplo, "¿cuántas personas trabajan en el Arco Minero?"— y comprueba que admite no saberlo en vez de inventar. Si inventa, hay que endurecer el system prompt.

**Cuida el banner de transparencia.** En refactorizaciones es lo primero que se pierde. Revísalo cada vez que se toque el layout.

**Guarda el trabajo a menudo.** Haz commits al cerrar cada etapa, así puedes volver atrás sin perder todo.

**Sustituye los resúmenes del corpus.** Claude Code generará resúmenes iniciales de los 12 artículos. Reemplázalos por los tuyos cuando los tengas y vuelve a ejecutar el script de indexación: es idempotente, no duplicará filas.

---

## Si algo se complica

- **Los embeddings dan problemas de configuración**: pídele que use un modelo local con Transformers.js. Es más lento pero no requiere cuenta externa.
- **Supabase se vuelve un obstáculo**: se puede sustituir por una búsqueda vectorial en memoria sobre un archivo JSON. El corpus es de 12 documentos, cabe perfectamente. Pierdes el argumento de "base vectorial real", así que úsalo solo como último recurso y decláralo en `/acerca`.
- **El mapa no renderiza**: verifica que MapLibre esté cargándose del lado del cliente (`"use client"` y carga dinámica sin SSR).
- **Vercel falla en el build**: casi siempre son variables de entorno faltantes o imports de servidor filtrados al cliente.
