import axios from 'axios';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app';
import { resetFeaturedCache } from '../controllers/movieControllers';
import { pool, publicPost, resetDatabase, seedMovies } from './helpers';

beforeEach(resetDatabase);
afterAll(() => pool.end());

const addActivity = async (id: number, daysAgo: number, count = 1) => {
  for (let i = 0; i < count; i += 1) {
    const userID = `user-${id}-${daysAgo}-${i}`;
    await pool.query('INSERT INTO users_yn085 (user_id) VALUES ($1)', [userID]);
    await pool.query(
      `INSERT INTO favourites_yn085 (user_id, tmdb_id, media_type, created_at)
       VALUES ($1, $2, 'movie', NOW() - make_interval(days => $3))`,
      [userID, id, daysAgo],
    );
  }
};

describe('GET /api/trending', () => {
  it('ranks recent activity above older activity', async () => {
    await seedMovies([
      { id: 10, title: 'Old Hit' },
      { id: 11, title: 'New Hit' },
      { id: 12, title: 'Never Saved' },
    ]);
    // Two saves 60 days ago score 1 each; one save today scores 3.
    await addActivity(10, 60, 2);
    await addActivity(11, 1, 1);

    const response = await request(app).get('/api/trending');

    expect(response.status).toBe(200);
    expect(response.body.movies.map((movie: any) => movie.title)).toEqual([
      'New Hit',
      'Old Hit',
    ]);
    expect(response.body.movies[0]).toMatchObject({ id: 11, media_type: 'movie', tag: 'Trending' });
    expect(response.body.movies[1].activityCount).toBe(2);
  });
});

describe('POST /api/wheel/candidates', () => {
  beforeEach(() =>
    seedMovies([
      { id: 1, title: 'Comedy 90s', genre: 'Comedy', year: '1994' },
      { id: 2, title: 'Comedy Now', genre: 'Comedy, Romance', year: '2015' },
      { id: 3, title: 'Thriller', genre: 'Thriller', year: '1996' },
      { id: 4, title: 'Comedy Show', genre: 'Comedy', media_type: 'tv', year: '1998' },
    ]),
  );

  const candidateIds = async (body: object) => {
    const response = await publicPost('/api/wheel/candidates', body);
    expect(response.status).toBe(200);
    return response.body.movies.map((movie: any) => movie.id).sort();
  };

  it('filters by genre, case-insensitively', async () => {
    expect(await candidateIds({ genres: ['comedy'] })).toEqual([1, 2, 4]);
  });

  it('filters by content type', async () => {
    expect(await candidateIds({ genres: ['Comedy'], type: 'tv' })).toEqual([4]);
  });

  it('filters by year range using the start year of a series', async () => {
    expect(await candidateIds({ fromYear: 1990, toYear: 1999 })).toEqual([1, 3, 4]);
  });

  it('excludes the given titles, matching id and media type', async () => {
    expect(
      await candidateIds({
        exclude: [
          { id: 1, media_type: 'movie' },
          { id: 2, media_type: 'movie' },
          // No TV show has id 3, so the movie stays.
          { id: 3, media_type: 'tv' },
        ],
      }),
    ).toEqual([3, 4]);
  });

  it('clamps the limit to at least one result', async () => {
    expect(await candidateIds({ limit: 0 })).toHaveLength(4);
    expect(await candidateIds({ limit: -5 })).toHaveLength(1);
  });
});

describe('GET /api/featured', () => {
  const mockGet = vi.mocked(axios.get);
  const item = (id: number, extra: object = {}) => ({ id, title: `Title ${id}`, poster_path: `/${id}.jpg`, ...extra });

  // Trending mixes movies, shows and people; discover returns plain movies.
  const fakeTmdb = async (url: string) => {
    const path = url.replace('https://tmdb.test/3', '');
    if (path === '/trending/all/week') {
      return {
        data: {
          results: [
            item(1, { media_type: 'movie' }),
            item(2, { media_type: 'tv' }),
            item(3, { media_type: 'person' }),
          ],
        },
      };
    }
    if (path === '/discover/movie') {
      // Every section gets movie 1 (already trending) and 21–32.
      return { data: { results: [item(1), ...Array.from({ length: 12 }, (_, i) => item(21 + i))] } };
    }
    const details = path.match(/^\/(movie|tv)\/(\d+)$/);
    if (details) return { data: { ...item(Number(details[2])), genres: [{ name: 'Drama' }] } };
    throw new Error(`Unexpected TMDB call: ${path}`);
  };

  beforeEach(() => {
    resetFeaturedCache();
    mockGet.mockReset();
    mockGet.mockImplementation((async (url: string) => fakeTmdb(url)) as never);
  });

  const waitForCache = (count: number) =>
    vi.waitFor(async () => {
      const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM movie_cache');
      expect(rows[0].n).toBe(count);
    });

  it('returns tagged TMDB titles, each title in one section only', async () => {
    const response = await request(app).get('/api/featured');

    expect(response.status).toBe(200);
    const { movies } = response.body;
    const byTag = (tag: string) => movies.filter((movie: any) => movie.tag === tag);

    // People are left out of trending.
    expect(byTag('Trending').map((movie: any) => `${movie.media_type}-${movie.id}`)).toEqual(['movie-1', 'tv-2']);
    // Movie 1 is already trending; the first genre section takes the next 10.
    expect(byTag('Romcoms').map((movie: any) => movie.id)).toEqual(Array.from({ length: 10 }, (_, i) => 21 + i));
    expect(byTag('Romcoms')[0]).toMatchObject({ media_type: 'movie', poster_path: '/21.jpg' });
    // Later sections only get what is left.
    expect(byTag('Horror Sensations').map((movie: any) => movie.id)).toEqual([31, 32]);
    expect(byTag('Hidden Gems')).toEqual([]);

    // Featured titles seed movie_cache for the spin wheel.
    await waitForCache(movies.length);
  });

  it('serves repeat requests from memory', async () => {
    const first = await request(app).get('/api/featured');
    await waitForCache(first.body.movies.length);
    const callsAfterFirst = mockGet.mock.calls.length;

    const second = await request(app).get('/api/featured');

    expect(second.body.movies).toEqual(first.body.movies);
    expect(mockGet.mock.calls.length).toBe(callsAfterFirst);
  });

  it('reports an error when TMDB is unreachable', async () => {
    mockGet.mockRejectedValue(new Error('offline'));
    const response = await request(app).get('/api/featured');
    expect(response.status).toBe(502);
  });
});
