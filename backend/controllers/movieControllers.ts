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

export const fetchMovieById = async (imdbID: String) => {
  try {
    if (!imdbID) throw new Error('IMDb ID is required');

    const query = `${API_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`;
    const response = await axios.get(query);

    if (response.data.Response === 'True') {
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
