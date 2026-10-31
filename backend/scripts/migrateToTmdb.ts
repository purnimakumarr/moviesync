// Gives every IMDb-keyed row a TMDB id and media type, and refills
// movie_cache with TMDB details. Run once per database, between the
// tmdb-ids and tmdb-keys migrations:
//   npm run migrate -- 1
//   npm run migrate:tmdb-ids
//   npm run migrate
// Rows whose IMDb ID TMDB does not know are logged and removed.
import 'dotenv/config';
import pool from '../db';
import { findByImdbId, getDetails, summarise } from '../services/tmdb';

// TMDB allows around 50 requests a second.
const TMDB_DELAY_MS = 50;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pendingImdbIds = async () => {
  const { rows } = await pool.query<{ imdb_id: string }>(`
    SELECT imdb_id FROM favourites_yn085 WHERE tmdb_id IS NULL
    UNION
    SELECT imdb_id FROM user_movies_yn085 WHERE tmdb_id IS NULL
    UNION
    SELECT imdb_id FROM movie_cache WHERE tmdb_id IS NULL OR details IS NULL
    ORDER BY imdb_id
  `);
  return rows.map((row) => row.imdb_id);
};

const migrateTitle = async (imdbID: string) => {
  const match = await findByImdbId(imdbID);
  if (!match) return false;

  for (const table of ['favourites_yn085', 'user_movies_yn085']) {
    await pool.query(
      `UPDATE ${table} SET tmdb_id = $1, media_type = $2 WHERE imdb_id = $3`,
      [match.id, match.media_type, imdbID],
    );
  }

  const cached = await pool.query('SELECT 1 FROM movie_cache WHERE imdb_id = $1', [imdbID]);
  if (cached.rows.length > 0) {
    const details = await getDetails(match.media_type, match.id);
    if (!details) return false;
    const summary = summarise(details);
    // Existing embeddings were built from the same title, genre and plot.
    await pool.query(
      `UPDATE movie_cache
       SET tmdb_id = $1, media_type = $2, details = $3, title = $4, year = $5,
           genre = $6, type = $7, director = $8, actors = $9,
           plot = COALESCE($10, plot), cached_at = NOW()
       WHERE imdb_id = $11`,
      [
        match.id,
        match.media_type,
        details,
        summary.title,
        summary.year,
        summary.genre,
        summary.type,
        summary.director,
        summary.actors,
        summary.plot,
        imdbID,
      ],
    );
  }
  return true;
};

const main = async () => {
  const imdbIds = await pendingImdbIds();
  console.log(`${imdbIds.length} titles to move to TMDB`);

  const unresolved: string[] = [];
  const failed: string[] = [];
  for (const [index, imdbID] of imdbIds.entries()) {
    try {
      if (!(await migrateTitle(imdbID))) unresolved.push(imdbID);
    } catch (error) {
      console.warn(`Could not migrate ${imdbID}:`, (error as Error).message);
      failed.push(imdbID);
    }
    if ((index + 1) % 25 === 0) console.log(`Migrated ${index + 1}/${imdbIds.length}`);
    await sleep(TMDB_DELAY_MS);
  }

  // A network or key error says nothing about the title, so nothing is
  // removed until a run finishes without them.
  if (failed.length > 0) {
    console.log(`${failed.length} titles failed (${failed.join(', ')}). Fix the error and run this again.`);
    process.exitCode = 1;
    return;
  }

  if (unresolved.length > 0) {
    console.log(`TMDB has no match for ${unresolved.length} titles, removing them: ${unresolved.join(', ')}`);
    await pool.query('DELETE FROM favourites_yn085 WHERE tmdb_id IS NULL');
    await pool.query('DELETE FROM user_movies_yn085 WHERE tmdb_id IS NULL');
    await pool.query('DELETE FROM movie_cache WHERE tmdb_id IS NULL OR details IS NULL');
  }
  console.log('Done. Run "npm run migrate" to finish the migration.');
};

main()
  .catch((error) => {
    console.error('TMDB migration failed:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
