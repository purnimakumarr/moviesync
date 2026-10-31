-- Up Migration

-- Step 2 of moving from OMDb to TMDB. Refuse to run before
-- scripts/migrateToTmdb.ts has given every existing row a TMDB id, so the
-- IMDb IDs are never dropped while they are the only way to find a title.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM favourites_yn085 WHERE tmdb_id IS NULL OR media_type IS NULL)
    OR EXISTS (SELECT 1 FROM user_movies_yn085 WHERE tmdb_id IS NULL OR media_type IS NULL)
    OR EXISTS (SELECT 1 FROM movie_cache WHERE tmdb_id IS NULL OR media_type IS NULL OR details IS NULL)
  THEN
    RAISE EXCEPTION 'Some rows have no TMDB id yet. Run "npm run migrate:tmdb-ids" first.';
  END IF;
END $$;

-- Two IMDb IDs can point at the same TMDB title; keep one row of each.
DELETE FROM favourites_yn085 a USING favourites_yn085 b
  WHERE a.ctid < b.ctid AND a.user_id = b.user_id
    AND a.media_type = b.media_type AND a.tmdb_id = b.tmdb_id;
DELETE FROM user_movies_yn085 a USING user_movies_yn085 b
  WHERE a.ctid < b.ctid AND a.user_id = b.user_id
    AND a.media_type = b.media_type AND a.tmdb_id = b.tmdb_id;
DELETE FROM movie_cache a USING movie_cache b
  WHERE a.ctid < b.ctid AND a.media_type = b.media_type AND a.tmdb_id = b.tmdb_id;

-- Databases created before migrations may use other constraint names.
DO $$
DECLARE
  table_name TEXT;
  constraint_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['favourites_yn085', 'user_movies_yn085', 'movie_cache'] LOOP
    SELECT conname INTO constraint_name
      FROM pg_constraint
      WHERE conrelid = table_name::regclass AND contype = 'p';
    IF constraint_name IS NOT NULL THEN
      EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', table_name, constraint_name);
    END IF;
  END LOOP;
END $$;

ALTER TABLE favourites_yn085
  DROP COLUMN imdb_id,
  ALTER COLUMN tmdb_id SET NOT NULL,
  ALTER COLUMN media_type SET NOT NULL,
  ADD CONSTRAINT favourites_yn085_media_type_check CHECK (media_type IN ('movie', 'tv')),
  ADD PRIMARY KEY (user_id, media_type, tmdb_id);

ALTER TABLE user_movies_yn085
  DROP COLUMN imdb_id,
  ALTER COLUMN tmdb_id SET NOT NULL,
  ALTER COLUMN media_type SET NOT NULL,
  ADD CONSTRAINT user_movies_yn085_media_type_check CHECK (media_type IN ('movie', 'tv')),
  ADD PRIMARY KEY (user_id, media_type, tmdb_id);

-- poster, rating, language and runtime are read from details now.
ALTER TABLE movie_cache
  DROP COLUMN imdb_id,
  DROP COLUMN poster,
  DROP COLUMN imdb_rating,
  DROP COLUMN language,
  DROP COLUMN runtime,
  ALTER COLUMN tmdb_id SET NOT NULL,
  ALTER COLUMN media_type SET NOT NULL,
  ALTER COLUMN details SET NOT NULL,
  ADD CONSTRAINT movie_cache_media_type_check CHECK (media_type IN ('movie', 'tv')),
  ADD PRIMARY KEY (media_type, tmdb_id);

-- Down Migration

-- Intentionally empty: the IMDb IDs are gone, so the old keys cannot be
-- rebuilt. Restore from the backup taken before migrating instead.
