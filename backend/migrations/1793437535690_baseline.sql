-- Up Migration

-- Baseline of the schema that existed before migrations were introduced.
-- Every statement is idempotent so this can run against databases that
-- already have these tables (local and production) without changing them.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profile fields are encrypted with pgp_sym_encrypt; user_id is sha256(email).
CREATE TABLE IF NOT EXISTS users_yn085 (
  user_id VARCHAR PRIMARY KEY,
  first_name BYTEA,
  middle_name BYTEA,
  last_name BYTEA,
  phone BYTEA,
  dob BYTEA,
  country BYTEA
);

CREATE TABLE IF NOT EXISTS favourites_yn085 (
  user_id VARCHAR NOT NULL REFERENCES users_yn085 (user_id) ON DELETE CASCADE,
  imdb_id VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, imdb_id)
);

CREATE TABLE IF NOT EXISTS user_movies_yn085 (
  user_id VARCHAR NOT NULL REFERENCES users_yn085 (user_id) ON DELETE CASCADE,
  imdb_id VARCHAR NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('watched', 'watch_later')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, imdb_id)
);

-- Older databases created the list tables before created_at existed.
ALTER TABLE favourites_yn085 ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE user_movies_yn085 ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Local copy of OMDb details, used by trending and the spin wheel.
CREATE TABLE IF NOT EXISTS movie_cache (
  imdb_id TEXT PRIMARY KEY,
  title TEXT,
  poster TEXT,
  year TEXT,
  genre TEXT,
  type TEXT,
  imdb_rating TEXT,
  language TEXT,
  runtime TEXT,
  director TEXT,
  actors TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW()
);

-- Down Migration

-- Intentionally empty: rolling back the baseline would drop every user's data.
