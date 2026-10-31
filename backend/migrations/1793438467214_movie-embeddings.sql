-- Up Migration

CREATE EXTENSION IF NOT EXISTS vector;

-- The plot is the main signal for mood search. It was fetched before but
-- never stored, so cached movies also lost their plot on the details page.
ALTER TABLE movie_cache ADD COLUMN IF NOT EXISTS plot TEXT;

-- 384 dimensions = BAAI bge-small-en-v1.5 (see services/embeddings.ts).
ALTER TABLE movie_cache ADD COLUMN IF NOT EXISTS embedding vector(384);

CREATE INDEX IF NOT EXISTS movie_cache_embedding_idx
  ON movie_cache USING hnsw (embedding vector_cosine_ops);

-- Down Migration

DROP INDEX IF EXISTS movie_cache_embedding_idx;
ALTER TABLE movie_cache DROP COLUMN IF EXISTS embedding;
ALTER TABLE movie_cache DROP COLUMN IF EXISTS plot;
