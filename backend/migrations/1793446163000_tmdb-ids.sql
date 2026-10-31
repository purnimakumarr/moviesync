-- Up Migration

-- Step 1 of moving from OMDb to TMDB: titles are identified by TMDB id plus
-- media type ('movie' or 'tv') instead of IMDb ID. scripts/migrateToTmdb.ts
-- fills these in for existing rows; the next migration makes them the keys.
ALTER TABLE favourites_yn085
  ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
  ADD COLUMN IF NOT EXISTS media_type TEXT;

ALTER TABLE user_movies_yn085
  ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
  ADD COLUMN IF NOT EXISTS media_type TEXT;

-- details holds the full TMDB response; the text columns stay for SQL
-- filters, Smart Spin and embeddings.
ALTER TABLE movie_cache
  ADD COLUMN IF NOT EXISTS tmdb_id INTEGER,
  ADD COLUMN IF NOT EXISTS media_type TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB;

-- Down Migration

ALTER TABLE movie_cache
  DROP COLUMN IF EXISTS details,
  DROP COLUMN IF EXISTS media_type,
  DROP COLUMN IF EXISTS tmdb_id;

ALTER TABLE user_movies_yn085
  DROP COLUMN IF EXISTS media_type,
  DROP COLUMN IF EXISTS tmdb_id;

ALTER TABLE favourites_yn085
  DROP COLUMN IF EXISTS media_type,
  DROP COLUMN IF EXISTS tmdb_id;
