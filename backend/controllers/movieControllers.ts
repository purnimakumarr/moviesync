import axios from 'axios';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import pool from '../db';
import * as crypto from 'crypto';

dotenv.config();
const API_KEY = process.env.OMDB_API_KEY;
const API_URL =
  process.env.NODE_ENV === 'production'
    ? process.env.OMDB_URL_PROD
    : process.env.OMDB_URL_DEV;

type MovieCacheRow = {
  imdb_id: string;
  title: string;
  poster: string;
  year: string;
  genre: string;
  type: string;
  imdb_rating: string;
  language: string;
  runtime: string;
  director: string;
  actors: string;
};

let movieInfrastructureReady = false;

const ensureMovieInfrastructure = async () => {
  if (movieInfrastructureReady) return;

  await pool.query(`
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
    )
  `);

  await pool.query(
    'ALTER TABLE favourites_yn085 ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()',
  );
  await pool.query(
    'ALTER TABLE user_movies_yn085 ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()',
  );

  movieInfrastructureReady = true;
};

const movieFromCacheRow = (row: MovieCacheRow) => ({
  imdbID: row.imdb_id,
  Title: row.title,
  Poster: row.poster,
  Year: row.year,
  Genre: row.genre,
  Type: row.type,
  imdbRating: row.imdb_rating,
  Language: row.language,
  Runtime: row.runtime,
  Director: row.director,
  Actors: row.actors,
});

const cacheMovie = async (movie: any) => {
  if (!movie?.imdbID || movie.error) return;

  await ensureMovieInfrastructure();
  await pool.query(
    `
      INSERT INTO movie_cache (
        imdb_id,
        title,
        poster,
        year,
        genre,
        type,
        imdb_rating,
        language,
        runtime,
        director,
        actors,
        cached_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      ON CONFLICT (imdb_id) DO UPDATE SET
        title = EXCLUDED.title,
        poster = EXCLUDED.poster,
        year = EXCLUDED.year,
        genre = EXCLUDED.genre,
        type = EXCLUDED.type,
        imdb_rating = EXCLUDED.imdb_rating,
        language = EXCLUDED.language,
        runtime = EXCLUDED.runtime,
        director = EXCLUDED.director,
        actors = EXCLUDED.actors,
        cached_at = NOW()
    `,
    [
      movie.imdbID,
      movie.Title,
      movie.Poster,
      movie.Year,
      movie.Genre,
      movie.Type,
      movie.imdbRating,
      movie.Language,
      movie.Runtime,
      movie.Director,
      movie.Actors,
    ],
  );
};

export const fetchMovieById = async (imdbID: String) => {
  try {
    if (!imdbID) throw new Error('IMDb ID is required');

    await ensureMovieInfrastructure();

    const cachedMovie = await pool.query(
      'SELECT * FROM movie_cache WHERE imdb_id = $1',
      [imdbID],
    );

    if (cachedMovie.rows.length > 0) {
      return movieFromCacheRow(cachedMovie.rows[0]);
    }

    const query = `${API_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`;
    const response = await axios.get(query);

    if (response.data.Response === 'True') {
      await cacheMovie(response.data);
      return response.data;
    } else {
      return { imdbID: imdbID, error: response.data.Error };
    }
  } catch (error) {
    console.error(`Error fetching movie details for ${imdbID}:`, error);
    return { imdbID: imdbID, error: 'Failed to fetch data' };
  }
};

export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, type = '', year = '', page = 1 } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const query = `${API_URL}?apikey=${API_KEY}&s=${title}&y=${year}&t=${type}&page=${page}`;
    const response = await axios.get(query);

    if (response.data.Response === 'True') {
      res.status(200).json({
        success: true,
        movies: response.data.Search,
        totalPages: Math.ceil(Number(response.data.totalResults) / 10),
      });
    } else {
      res.status(200).json({
        success: false,
        error: response.data.Error,
      });
    }
  } catch (error) {
    console.error('Error in search controller:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { imdbID } = req.body;

    if (!imdbID) {
      res.status(400).json({
        error: 'IMDB id is required',
      });
      return;
    }
    const movie = await fetchMovieById(imdbID);

    if (movie.error) {
      res.status(400).json({
        success: false,
        error: movie.error,
      });
    } else {
      res.status(200).json({
        success: true,
        movie: movie,
      });
    }
  } catch (error) {
    console.error('Error in search controller:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getTrending = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    await ensureMovieInfrastructure();

    const result = await pool.query(`
      WITH activity AS (
        SELECT imdb_id, created_at FROM favourites_yn085
        UNION ALL
        SELECT imdb_id, created_at FROM user_movies_yn085
      )
      SELECT
        mc.*,
        COUNT(*)::int AS activity_count,
        MAX(activity.created_at) AS latest_activity_at
      FROM activity
      JOIN movie_cache mc ON mc.imdb_id = activity.imdb_id
      GROUP BY mc.imdb_id
      ORDER BY
        SUM(
          CASE
            WHEN activity.created_at >= NOW() - INTERVAL '14 days' THEN 3
            WHEN activity.created_at >= NOW() - INTERVAL '45 days' THEN 2
            ELSE 1
          END
        ) DESC,
        MAX(activity.created_at) DESC
      LIMIT 20
    `);

    const movies = result.rows.map((row) => ({
      ...movieFromCacheRow(row),
      tag: 'Trending',
      activityCount: row.activity_count,
      latestActivityAt: row.latest_activity_at,
    }));

    res.status(200).json({ success: true, movies });
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getWheelCandidates = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      genres = [],
      type = 'both',
      fromYear,
      toYear,
      excludeImdbIDs = [],
      limit = 24,
    } = req.body;

    await ensureMovieInfrastructure();

    const safeLimit = Math.min(Math.max(Number(limit) || 24, 1), 50);
    const filters: string[] = [];
    const values: unknown[] = [];

    if (Array.isArray(genres) && genres.length > 0) {
      values.push(genres.map((genre) => String(genre).toLowerCase()));
      filters.push(`
        EXISTS (
          SELECT 1
          FROM unnest($${values.length}::text[]) AS requested_genre
          WHERE lower(mc.genre) LIKE '%' || requested_genre || '%'
        )
      `);
    }

    if (type === 'movie' || type === 'series') {
      values.push(type);
      filters.push(`mc.type = $${values.length}`);
    }

    if (fromYear) {
      values.push(Number(fromYear));
      filters.push(
        `NULLIF(substring(mc.year from '\\d{4}'), '')::int >= $${values.length}`,
      );
    }

    if (toYear) {
      values.push(Number(toYear));
      filters.push(
        `NULLIF(substring(mc.year from '\\d{4}'), '')::int <= $${values.length}`,
      );
    }

    if (Array.isArray(excludeImdbIDs) && excludeImdbIDs.length > 0) {
      values.push(excludeImdbIDs.map(String));
      filters.push(`mc.imdb_id != ALL($${values.length}::text[])`);
    }

    values.push(safeLimit);

    const result = await pool.query(
      `
        SELECT mc.*
        FROM movie_cache mc
        ${filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : ''}
        ORDER BY RANDOM()
        LIMIT $${values.length}
      `,
      values,
    );

    res.status(200).json({
      success: true,
      movies: result.rows.map(movieFromCacheRow),
    });
  } catch (error) {
    console.error('Error fetching wheel candidates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addFavourite = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userID, imdbID } = req.body;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  if (!imdbID) {
    res.status(400).json({
      error: 'IMDB id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    await pool.query(
      'INSERT INTO favourites_yn085 (user_id, imdb_id) VALUES ($1, $2) ON CONFLICT (user_id, imdb_id) DO NOTHING',
      [userIDHash, imdbID],
    );
    const movie = await fetchMovieById(imdbID);
    res.status(200).json({ message: 'Favourite added', movie });
  } catch (error) {
    console.error('Error adding favourite:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getFavourites = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userID } = req.body;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');
  try {
    const result = await pool.query(
      'SELECT imdb_id FROM favourites_yn085 WHERE user_id = $1',
      [userIDHash],
    );
    const movieIds: String[] = result.rows.map((row: any) => row.imdb_id);

    if (movieIds.length === 0) {
      res.status(200).json({ movies: [] });
      return;
    }

    const movieDetails = await Promise.all(
      movieIds.map(async (imdbID) => await fetchMovieById(imdbID)),
    );
    res.status(200).json({ movies: movieDetails, length: movieDetails.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const removeFavourite = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userID, imdbID } = req.body;

    if (!userID) {
      res.status(400).json({
        error: 'User id is required',
      });
      return;
    }

    if (!imdbID) {
      res.status(400).json({
        error: 'IMDB id is required',
      });
      return;
    }

    const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

    await pool.query(
      'DELETE FROM favourites_yn085 WHERE user_id = $1 AND imdb_id = $2',
      [userIDHash, imdbID],
    );
    res.status(200).json({ message: 'Favourite deleted' });
  } catch (error) {
    console.error('Error deleting favourite:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const clearAllFavourites = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { userID } = req.body;

    if (!userID) {
      res.status(400).json({
        error: 'User id is required',
      });
      return;
    }

    const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

    await pool.query('DELETE FROM favourites_yn085 WHERE user_id = $1', [
      userIDHash,
    ]);
    res.status(200).json({ message: 'Favourites List deleted' });
  } catch (error) {
    console.error('Error deleting favourites:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addWatchLater = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userID, imdbID } = req.body;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  if (!imdbID) {
    res.status(400).json({
      error: 'IMDB id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    await pool.query(
      "INSERT INTO user_movies_yn085 (user_id, imdb_id, status) VALUES ($1, $2, 'watch_later') ON CONFLICT (user_id, imdb_id) DO UPDATE SET status = 'watch_later'",
      [userIDHash, imdbID],
    );
    const movie = await fetchMovieById(imdbID);
    res.status(200).json({ message: 'Movie added to Watch Later', movie });
  } catch (error) {
    console.error('Error adding watch later:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addWatched = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userID, imdbID } = req.body;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  if (!imdbID) {
    res.status(400).json({
      error: 'IMDB id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    await pool.query(
      "INSERT INTO user_movies_yn085 (user_id, imdb_id, status) VALUES ($1, $2, 'watched') ON CONFLICT (user_id, imdb_id) DO UPDATE SET status = 'watched'",
      [userIDHash, imdbID],
    );
    const movie = await fetchMovieById(imdbID);
    res.status(200).json({ message: 'Movie marked as Watched', movie });
  } catch (error) {
    console.error('Error adding watched:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const deleteWatch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userID, imdbID } = req.body;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  if (!imdbID) {
    res.status(400).json({
      error: 'IMDB id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    await pool.query(
      'DELETE FROM user_movies_yn085 WHERE user_id = $1 AND imdb_id = $2',
      [userIDHash, imdbID],
    );
    res.status(200).json({ message: 'Movie removed from watch list' });
  } catch (error) {
    console.error('Error deleting watch item:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getWatched = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userID } = req.body;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    const result = await pool.query(
      "SELECT * FROM user_movies_yn085 WHERE user_id = $1 AND status = 'watched'",
      [userIDHash],
    );
    const movieIds: String[] = result.rows.map((row) => row.imdb_id);

    if (movieIds.length === 0) {
      res.status(200).json({ movies: [] });
      return;
    }

    const movieDetails = await Promise.all(
      movieIds.map(async (imdbID) => await fetchMovieById(imdbID)),
    );

    res.status(200).json({ movies: movieDetails, length: movieDetails.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getWatchLater = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userID } = req.body;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    const result = await pool.query(
      "SELECT * FROM user_movies_yn085 WHERE user_id = $1 AND status = 'watch_later'",
      [userIDHash],
    );
    const movieIds: String[] = result.rows.map((row) => row.imdb_id);

    if (movieIds.length === 0) {
      res.status(200).json({ movies: [] });
      return;
    }

    const movieDetails = await Promise.all(
      movieIds.map(async (imdbID) => await fetchMovieById(imdbID)),
    );

    res.status(200).json({ movies: movieDetails, length: movieDetails.length });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const clearAllWatchLater = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userID } = req.body;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    await pool.query(
      "DELETE FROM user_movies_yn085 WHERE user_id = $1 AND status = 'watch_later'",
      [userIDHash],
    );
    res.status(200).json({ message: 'All Watch Later movies cleared' });
  } catch (error) {
    console.error('Error clearing watch later list:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const clearAllWatched = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userID } = req.body;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    await pool.query(
      "DELETE FROM user_movies_yn085 WHERE user_id = $1 AND status = 'watched'",
      [userIDHash],
    );
    res.status(200).json({ message: 'All Watched movies cleared' });
  } catch (error) {
    console.error('Error clearing watched list:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
