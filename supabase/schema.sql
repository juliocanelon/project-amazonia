-- ─────────────────────────────────────────────────────────────
-- Centinela Orinoco — esquema de la base vectorial (Supabase / pgvector)
--
-- Ejecutar UNA VEZ en el SQL Editor de Supabase antes de indexar el corpus.
-- La dimensión del vector (1024) corresponde a voyage-3.5-lite. Si cambias
-- de modelo de embeddings, ajusta la dimensión aquí y vuelve a indexar.
-- ─────────────────────────────────────────────────────────────

-- 1) Extensión pgvector
create extension if not exists vector;

-- 2) Tabla de fragmentos (chunks) del corpus
--    El corpus es mixto: fuentes revisadas por pares (tipo 'resumen_elaborado')
--    y fuentes de prensa no arbitradas (tipo 'prensa'). El campo `tipo` permite
--    distinguirlas al citar.
create table if not exists fragmentos_corpus (
  id          bigserial primary key,
  fuente_id   text    not null,        -- clave de la fuente, p.ej. "garcia-sanchez-2008"
  autores     text    not null,
  anio        integer not null,
  titulo      text    not null,
  revista     text,                    -- revista científica o nombre del medio (prensa)
  doi         text,
  indexacion  text,                    -- p.ej. "Scopus, Web of Science" o "No arbitrada (prensa)"
  tipo        text    not null default 'resumen_elaborado', -- 'resumen_elaborado' | 'prensa'
  fecha       text,                    -- opcional (prensa): fecha de publicación
  url         text,                    -- opcional (prensa): enlace a la nota
  fragmento   text    not null,        -- texto del fragmento
  posicion    integer not null,        -- posición del fragmento dentro del documento
  embedding   vector(1024),            -- embedding de voyage-3.5-lite
  creado_en   timestamptz default now()
);

-- Índice de búsqueda vectorial por similitud coseno (HNSW).
create index if not exists fragmentos_corpus_embedding_idx
  on fragmentos_corpus
  using hnsw (embedding vector_cosine_ops);

-- Índice por fuente_id para el borrado selectivo al re-indexar.
create index if not exists fragmentos_corpus_fuente_idx
  on fragmentos_corpus (fuente_id);

-- 3) Función de recuperación por similitud.
-- Devuelve los `match_count` fragmentos más similares al embedding de consulta,
-- con su similitud coseno (1 - distancia). Opcionalmente filtra por umbral.
create or replace function match_fragmentos (
  query_embedding  vector(1024),
  match_count      int   default 6,
  umbral_similitud float default 0.0
)
returns table (
  id         bigint,
  fuente_id  text,
  autores    text,
  anio       integer,
  titulo     text,
  revista    text,
  doi        text,
  indexacion text,
  tipo       text,
  fecha      text,
  url        text,
  fragmento  text,
  posicion   integer,
  similitud  float
)
language sql stable
as $$
  select
    f.id,
    f.fuente_id,
    f.autores,
    f.anio,
    f.titulo,
    f.revista,
    f.doi,
    f.indexacion,
    f.tipo,
    f.fecha,
    f.url,
    f.fragmento,
    f.posicion,
    1 - (f.embedding <=> query_embedding) as similitud
  from fragmentos_corpus f
  where 1 - (f.embedding <=> query_embedding) >= umbral_similitud
  order by f.embedding <=> query_embedding   -- <=> = distancia coseno (menor = más similar)
  limit match_count;
$$;
