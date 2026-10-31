import { Request, Response } from 'express';
import pool from '../db';
import { cacheMovie, movieFromCacheRow } from '../services/movieCache';
import {
  discover,
  getDetails,
  getTrending as getTmdbTrending,
  isMediaType,
  MediaType,
  searchPage,
  TmdbTitle,
} from '../services/tmdb';
import * as crypto from 'crypto';

// Request bodies name a title by its TMDB id and media type.
const parseTitleRef = (body: any) => {
  const id = Number(body?.id);
  return Number.isInteger(id) && id > 0 && isMediaType(body?.media_type)
    ? { id, mediaType: body.media_type as MediaType }
    : null;
};

const TITLE_REQUIRED = 'TMDB id and media type are required';

export const fetchTitle = async (
  mediaType: MediaType,
  id: number,
): Promise<TmdbTitle | { id: number; media_type: MediaType; error: string }> => {
  try {
    const cachedMovie = await pool.query(
      'SELECT * FROM movie_cache WHERE media_type = $1 AND tmdb_id = $2',
      [mediaType, id],
    );

    if (cachedMovie.rows.length > 0) {
      return movieFromCacheRow(cachedMovie.rows[0]);
    }

    const details = await getDetails(mediaType, id);
    if (!details) {
      return { id, media_type: mediaType, error: 'Movie not found!' };
    }
    await cacheMovie(details);
    return details;
  } catch (error) {
    console.error(`Error fetching details for ${mediaType} ${id}:`, error);
    return { id, media_type: mediaType, error: 'Failed to fetch data' };
  }
};

// TMDB always returns 20 results per search page.
const TMDB_PAGE_SIZE = 20;
const MAX_SEARCH_PAGE_SIZE = 20;

export const search = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, type = '', year = '', page = 1, pageSize = TMDB_PAGE_SIZE } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    // Pages of any size are served by stitching together the TMDB pages that
    // cover the requested slice of results (one or two requests).
    const size = Math.min(Math.max(Math.floor(Number(pageSize)) || TMDB_PAGE_SIZE, 1), MAX_SEARCH_PAGE_SIZE);
    const requestedPage = Math.max(Math.floor(Number(page)) || 1, 1);
    const start = (requestedPage - 1) * size;
    const firstTmdbPage = Math.floor(start / TMDB_PAGE_SIZE) + 1;
    const lastTmdbPage = Math.floor((start + size - 1) / TMDB_PAGE_SIZE) + 1;
    // The UI sends "All Years" / "None" for "no filter".
    const filters = { query: String(title), year: String(year), type: String(type) };

    const first = await searchPage(filters, firstTmdbPage);
    const totalResults = Number(first.total_results) || 0;
    if (totalResults === 0 || first.results.length === 0) {
      res.status(200).json({ success: false, error: 'Movie not found!' });
      return;
    }

    const lastAvailablePage = Number(first.total_pages) || 1;
    const extraPages = [];
    for (let p = firstTmdbPage + 1; p <= Math.min(lastTmdbPage, lastAvailablePage); p += 1) {
      extraPages.push(searchPage(filters, p));
    }
    const rest = await Promise.all(extraPages);

    const seen = new Set<string>();
    const combined = [first, ...rest]
      .flatMap((data) => data.results)
      // Results can shift between neighbouring pages as popularity changes.
      .filter((movie: TmdbTitle) => {
        const key = `${movie.media_type}-${movie.id}`;
        return !seen.has(key) && seen.add(key);
      });
    const offset = start - (firstTmdbPage - 1) * TMDB_PAGE_SIZE;

    res.status(200).json({
      success: true,
      movies: combined.slice(offset, offset + size),
      totalPages: Math.ceil(totalResults / size),
    });
  } catch (error) {
    console.error('Error in search controller:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const getById = async (req: Request, res: Response): Promise<void> => {
  try {
    const title = parseTitleRef(req.body);

    if (!title) {
      res.status(400).json({
        error: TITLE_REQUIRED,
      });
      return;
    }
    const movie = await fetchTitle(title.mediaType, title.id);

    if ('error' in movie) {
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
    const result = await pool.query(`
      WITH activity AS (
        SELECT tmdb_id, media_type, created_at FROM favourites_yn085
        UNION ALL
        SELECT tmdb_id, media_type, created_at FROM user_movies_yn085
      )
      SELECT
        mc.*,
        COUNT(*)::int AS activity_count,
        MAX(activity.created_at) AS latest_activity_at
      FROM activity
      JOIN movie_cache mc
        ON mc.media_type = activity.media_type AND mc.tmdb_id = activity.tmdb_id
      GROUP BY mc.media_type, mc.tmdb_id
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

const FEATURED_PER_SECTION = 10;
const FEATURED_TTL_MS = 6 * 60 * 60 * 1000;

const yearsAgo = (years: number) => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - years);
  return date.toISOString().slice(0, 10);
};

// Recent, reasonably well-known titles, most popular first.
const recentPopular = (withGenres: string) => ({
  with_genres: withGenres,
  sort_by: 'popularity.desc',
  'primary_release_date.gte': yearsAgo(3),
  'vote_count.gte': 50,
});

// `tag` matches the carousels on the Featured page.
const FEATURED_SECTIONS: { tag: string; fetch: () => Promise<TmdbTitle[]> }[] = [
  { tag: 'Trending', fetch: getTmdbTrending },
  { tag: 'Romcoms', fetch: () => discover('movie', recentPopular('10749,35')) },
  { tag: 'Horror Sensations', fetch: () => discover('movie', recentPopular('27')) },
  { tag: 'Sci-Fi & Fantasy Hits', fetch: () => discover('movie', recentPopular('878|14')) },
  {
    tag: 'Hidden Gems',
    fetch: () =>
      discover('movie', {
        sort_by: 'vote_average.desc',
        'vote_average.gte': 7.3,
        'vote_count.gte': 150,
        'vote_count.lte': 2000,
        'primary_release_date.gte': yearsAgo(3),
      }),
  },
];

let featuredCache: { movies: TmdbTitle[]; expiresAt: number } | null = null;

export const resetFeaturedCache = () => {
  featuredCache = null;
};

// Featured titles also seed movie_cache, which the spin wheel draws from.
const cacheNewTitles = async (movies: TmdbTitle[]) => {
  const keys = movies.map((movie) => `${movie.media_type}-${movie.id}`);
  const cached = await pool.query(
    `SELECT media_type || '-' || tmdb_id AS key FROM movie_cache
     WHERE (media_type || '-' || tmdb_id) = ANY($1::text[])`,
    [keys],
  );
  const known = new Set(cached.rows.map((row) => row.key));
  const fresh = movies.filter((movie) => !known.has(`${movie.media_type}-${movie.id}`));
  await Promise.all(
    fresh.map(async (movie) => cacheMovie(await getDetails(movie.media_type, movie.id))),
  );
};

export const getFeatured = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    if (!featuredCache || featuredCache.expiresAt < Date.now()) {
      const sections = await Promise.all(
        FEATURED_SECTIONS.map(({ fetch }) => fetch().catch(() => [])),
      );

      // A title appears only in the first section that has it.
      const seen = new Set<string>();
      const movies = sections.flatMap((results, index) => {
        const picked = results
          .filter((movie) => !seen.has(`${movie.media_type}-${movie.id}`))
          .slice(0, FEATURED_PER_SECTION);
        picked.forEach((movie) => seen.add(`${movie.media_type}-${movie.id}`));
        return picked.map((movie) => ({ ...movie, tag: FEATURED_SECTIONS[index].tag }));
      });

      if (movies.length === 0) {
        res.status(502).json({ success: false, error: 'Featured titles are unavailable' });
        return;
      }

      featuredCache = { movies, expiresAt: Date.now() + FEATURED_TTL_MS };
      cacheNewTitles(movies).catch((error) =>
        console.error('Error caching featured titles:', error),
      );
    }

    res.status(200).json({ success: true, movies: featuredCache.movies });
  } catch (error) {
    console.error('Error fetching featured movies:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const addFavourite = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const title = parseTitleRef(req.body);
  const userID = req.user?.email;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  if (!title) {
    res.status(400).json({
      error: TITLE_REQUIRED,
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    await pool.query(
      'INSERT INTO favourites_yn085 (user_id, tmdb_id, media_type) VALUES ($1, $2, $3) ON CONFLICT (user_id, media_type, tmdb_id) DO NOTHING',
      [userIDHash, title.id, title.mediaType],
    );
    const movie = await fetchTitle(title.mediaType, title.id);
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
  const userID = req.user?.email;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');
  try {
    const result = await pool.query(
      'SELECT tmdb_id, media_type FROM favourites_yn085 WHERE user_id = $1',
      [userIDHash],
    );

    if (result.rows.length === 0) {
      res.status(200).json({ movies: [] });
      return;
    }

    const movieDetails = await Promise.all(
      result.rows.map((row) => fetchTitle(row.media_type, row.tmdb_id)),
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
    const title = parseTitleRef(req.body);
    const userID = req.user?.email;

    if (!userID) {
      res.status(400).json({
        error: 'User id is required',
      });
      return;
    }

    if (!title) {
      res.status(400).json({
        error: TITLE_REQUIRED,
      });
      return;
    }

    const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

    await pool.query(
      'DELETE FROM favourites_yn085 WHERE user_id = $1 AND media_type = $2 AND tmdb_id = $3',
      [userIDHash, title.mediaType, title.id],
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
    const userID = req.user?.email;

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
  const title = parseTitleRef(req.body);
  const userID = req.user?.email;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  if (!title) {
    res.status(400).json({
      error: TITLE_REQUIRED,
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    await pool.query(
      "INSERT INTO user_movies_yn085 (user_id, tmdb_id, media_type, status) VALUES ($1, $2, $3, 'watch_later') ON CONFLICT (user_id, media_type, tmdb_id) DO UPDATE SET status = 'watch_later'",
      [userIDHash, title.id, title.mediaType],
    );
    const movie = await fetchTitle(title.mediaType, title.id);
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
  const title = parseTitleRef(req.body);
  const userID = req.user?.email;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  if (!title) {
    res.status(400).json({
      error: TITLE_REQUIRED,
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    await pool.query(
      "INSERT INTO user_movies_yn085 (user_id, tmdb_id, media_type, status) VALUES ($1, $2, $3, 'watched') ON CONFLICT (user_id, media_type, tmdb_id) DO UPDATE SET status = 'watched'",
      [userIDHash, title.id, title.mediaType],
    );
    const movie = await fetchTitle(title.mediaType, title.id);
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
  const title = parseTitleRef(req.body);
  const userID = req.user?.email;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  if (!title) {
    res.status(400).json({
      error: TITLE_REQUIRED,
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    await pool.query(
      'DELETE FROM user_movies_yn085 WHERE user_id = $1 AND media_type = $2 AND tmdb_id = $3',
      [userIDHash, title.mediaType, title.id],
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
  const userID = req.user?.email;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    const result = await pool.query(
      "SELECT tmdb_id, media_type FROM user_movies_yn085 WHERE user_id = $1 AND status = 'watched'",
      [userIDHash],
    );

    if (result.rows.length === 0) {
      res.status(200).json({ movies: [] });
      return;
    }

    const movieDetails = await Promise.all(
      result.rows.map((row) => fetchTitle(row.media_type, row.tmdb_id)),
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
  const userID = req.user?.email;

  if (!userID) {
    res.status(400).json({
      error: 'User id is required',
    });
    return;
  }

  const userIDHash = crypto.createHash('sha256').update(userID).digest('hex');

  try {
    const result = await pool.query(
      "SELECT tmdb_id, media_type FROM user_movies_yn085 WHERE user_id = $1 AND status = 'watch_later'",
      [userIDHash],
    );

    if (result.rows.length === 0) {
      res.status(200).json({ movies: [] });
      return;
    }

    const movieDetails = await Promise.all(
      result.rows.map((row) => fetchTitle(row.media_type, row.tmdb_id)),
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
  const userID = req.user?.email;

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
  const userID = req.user?.email;

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
