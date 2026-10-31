import pool from '../db';
import { embedMovies, toSqlVector } from './embeddings';
import { MediaType, summarise, TmdbTitle } from './tmdb';

export type MovieCacheRow = {
  tmdb_id: number;
  media_type: MediaType;
  details: TmdbTitle;
  title: string;
  year: string;
  genre: string;
  type: string;
  director: string;
  actors: string;
  plot: string | null;
};

// Cached titles are served as the TMDB response they were stored from.
export const movieFromCacheRow = (row: MovieCacheRow): TmdbTitle => ({
  ...row.details,
  id: row.tmdb_id,
  media_type: row.media_type,
});

export const storeMovieEmbedding = async (details: TmdbTitle) => {
  const { title, genre, plot } = summarise(details);
  const [embedding] = await embedMovies([{ title, genre, plot }]);
  await pool.query(
    'UPDATE movie_cache SET embedding = $1 WHERE media_type = $2 AND tmdb_id = $3',
    [toSqlVector(embedding), details.media_type, details.id],
  );
};

export const cacheMovie = async (details: TmdbTitle | null) => {
  if (!details?.id || !details.media_type) return;

  const summary = summarise(details);
  await pool.query(
    `
      INSERT INTO movie_cache (
        tmdb_id,
        media_type,
        details,
        title,
        year,
        genre,
        type,
        director,
        actors,
        plot,
        cached_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (media_type, tmdb_id) DO UPDATE SET
        details = EXCLUDED.details,
        title = EXCLUDED.title,
        year = EXCLUDED.year,
        genre = EXCLUDED.genre,
        type = EXCLUDED.type,
        director = EXCLUDED.director,
        actors = EXCLUDED.actors,
        plot = EXCLUDED.plot,
        cached_at = NOW()
    `,
    [
      details.id,
      details.media_type,
      details,
      summary.title,
      summary.year,
      summary.genre,
      summary.type,
      summary.director,
      summary.actors,
      summary.plot,
    ],
  );

  // Fire and forget: a slow or failed embedding must never fail the request.
  storeMovieEmbedding(details).catch((error) =>
    console.error(`Error embedding ${details.media_type} ${details.id}:`, error),
  );
};
