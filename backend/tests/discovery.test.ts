import axios from 'axios';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app';
import {
  FakeTitle,
  pool,
  publicPost,
  resetDatabase,
  serveTmdb,
  tmdbCalls,
} from './helpers';

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
    serveTmdb([
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

  it('leaves out titles TMDB cannot return', async () => {
    serveTmdb([{ id: 11, title: 'New Hit' }], { failing: /^\/movie\/10$/ });
    await addActivity(10, 1, 2);
    await addActivity(11, 1, 1);

    const response = await request(app).get('/api/trending');

    expect(response.status).toBe(200);
    expect(response.body.movies.map((movie: any) => movie.id)).toEqual([11]);
  });
});

describe('POST /api/wheel/candidates', () => {
  const TITLES: FakeTitle[] = [
    { id: 1, title: 'Comedy 90s', genre: 'Comedy', year: '1994' },
    { id: 2, title: 'Comedy Now', genre: 'Comedy, Romance', year: '2015' },
    { id: 3, title: 'Thriller', genre: 'Thriller', year: '1996' },
    { id: 4, title: 'Comedy Show', genre: 'Comedy', media_type: 'tv', year: '1998' },
  ];

  beforeEach(() => serveTmdb(TITLES));

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

  it('matches genres by substring, per media type', async () => {
    serveTmdb([{ id: 5, title: 'Action Show', genre: 'Action & Adventure', media_type: 'tv' }]);

    expect(await candidateIds({ genres: ['Action'] })).toEqual([5]);

    expect(tmdbCalls(/^\/discover\/movie$/)[0].params.with_genres).toBe('28');
    expect(tmdbCalls(/^\/discover\/tv$/)[0].params.with_genres).toBe('10759');
  });

  it('skips a media type that has none of the requested genres', async () => {
    expect(await candidateIds({ genres: ['Thriller'] })).toEqual([3]);
    expect(tmdbCalls(/^\/discover\/tv$/)).toEqual([]);
  });

  it('only queries the requested media type', async () => {
    await candidateIds({ type: 'movie' });
    expect(tmdbCalls(/^\/discover\/tv$/)).toEqual([]);
    expect(tmdbCalls(/^\/genre\/tv\/list$/)).toEqual([]);
  });

  it('sends the year range and popularity floor for each media type', async () => {
    await candidateIds({ fromYear: 1990, toYear: 1999 });

    expect(tmdbCalls(/^\/discover\/movie$/)[0].params).toMatchObject({
      'primary_release_date.gte': '1990-01-01',
      'primary_release_date.lte': '1999-12-31',
      'vote_count.gte': 50,
      sort_by: 'popularity.desc',
    });
    expect(tmdbCalls(/^\/discover\/tv$/)[0].params).toMatchObject({
      'first_air_date.gte': '1990-01-01',
      'first_air_date.lte': '1999-12-31',
      'vote_count.gte': 50,
    });
  });

  it('adds genre names, which discover results do not have', async () => {
    const response = await publicPost('/api/wheel/candidates', { genres: ['Thriller'] });
    expect(response.body.movies[0].genres).toEqual([{ id: 53, name: 'Thriller' }]);
    expect(response.body.movies[0]).toMatchObject({ id: 3, media_type: 'movie', title: 'Thriller' });
  });

  it('draws at most 3 random pages from the first 50', async () => {
    serveTmdb(TITLES, { totalPages: 400 });

    await candidateIds({ type: 'movie' });

    const pages = tmdbCalls(/^\/discover\/movie$/).map((call) => call.params.page);
    // Page 1 is always requested, to learn how many pages exist.
    expect(pages[0]).toBe(1);
    expect(pages.length).toBeLessThanOrEqual(4);
    expect(Math.max(...pages)).toBeLessThanOrEqual(50);
  });

  it('removes titles repeated across pages', async () => {
    serveTmdb(TITLES, { totalPages: 3 });
    expect(await candidateIds({ type: 'movie' })).toEqual([1, 2, 3]);
  });

  it('keeps what it can when one media type fails', async () => {
    serveTmdb(TITLES, { failing: /^\/discover\/tv$/ });
    expect(await candidateIds({})).toEqual([1, 2, 3]);
  });

  it('returns no matches, not an error, when no genre applies', async () => {
    const response = await publicPost('/api/wheel/candidates', { genres: ['Nonsense'] });
    expect(response.status).toBe(200);
    expect(response.body.movies).toEqual([]);
  });

  it('reports an error when TMDB is unreachable', async () => {
    serveTmdb(TITLES, { failing: /./ });
    const response = await publicPost('/api/wheel/candidates', {});
    expect(response.status).toBe(500);
  });

  it('reports an error when every discover request fails', async () => {
    serveTmdb(TITLES, { failing: /^\/discover\// });
    const response = await publicPost('/api/wheel/candidates', {});
    expect(response.status).toBe(500);
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
    throw new Error(`Unexpected TMDB call: ${path}`);
  };

  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockImplementation((async (url: string) => fakeTmdb(url)) as never);
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
  });

  it('fetches live from TMDB on every request', async () => {
    await request(app).get('/api/featured');
    const callsAfterFirst = mockGet.mock.calls.length;

    await request(app).get('/api/featured');

    expect(callsAfterFirst).toBeGreaterThan(0);
    expect(mockGet.mock.calls.length).toBe(callsAfterFirst * 2);
  });

  it('reports an error when TMDB is unreachable', async () => {
    mockGet.mockRejectedValue(new Error('offline'));
    const response = await request(app).get('/api/featured');
    expect(response.status).toBe(502);
  });
});
