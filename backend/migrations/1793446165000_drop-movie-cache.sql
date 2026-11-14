-- Up Migration

-- Titles are always read live from TMDB now. Saved lists keep their own TMDB
-- id and media type, so they do not depend on this table.
DROP TABLE IF EXISTS movie_cache;
DROP EXTENSION IF EXISTS vector;

-- Down Migration

-- Restores the empty table only; the rows it held are not recoverable.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS movie_cache (
  tmdb_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CONSTRAINT movie_cache_media_type_check CHECK (media_type IN ('movie', 'tv')),
  details JSONB NOT NULL,
  title TEXT,
  year TEXT,
  genre TEXT,
  type TEXT,
  director TEXT,
  actors TEXT,
  plot TEXT,
  embedding vector(384),
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (media_type, tmdb_id)
);

CREATE INDEX IF NOT EXISTS movie_cache_embedding_idx
  ON movie_cache USING hnsw (embedding vector_cosine_ops);
