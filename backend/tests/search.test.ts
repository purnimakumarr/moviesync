import axios from 'axios';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { searchPage } from '../services/tmdb';
import { pool, publicPost } from './helpers';

const mockGet = vi.mocked(axios.get);

// Fake TMDB search: `total` results, 20 per page, like the real API.
const tmdbSearch = (total: number) => async (url: string, config?: { params?: Record<string, unknown> }) => {
  const page = Number(config?.params?.page);
  const multi = url.endsWith('/search/multi');
  const results = Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    title: `Title ${i + 1}`,
    ...(multi ? { media_type: 'movie' } : {}),
  })).slice((page - 1) * 20, page * 20);
  return {
    data: { page, results, total_results: total, total_pages: Math.ceil(total / 20) },
  } as never;
};

const ids = (movies: { id: number }[]) => movies.map((movie) => movie.id);
const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
const requestedPaths = () =>
  mockGet.mock.calls.map(([url]) => String(url).replace('https://tmdb.test/3', ''));

beforeEach(() => {
  mockGet.mockReset();
  mockGet.mockImplementation(tmdbSearch(45) as never);
});

afterAll(() => pool.end());

describe('POST /api/search', () => {
  it('returns TMDB pages unchanged by default', async () => {
    const response = await publicPost('/api/search', { title: 'heat', page: 2 });
    expect(ids(response.body.movies)).toEqual(range(21, 40));
    expect(response.body.totalPages).toBe(3);
    expect(mockGet).toHaveBeenCalledTimes(1);
  });

  it('stitches TMDB pages together for a page size of 12', async () => {
    const page1 = await publicPost('/api/search', { title: 'heat', page: 1, pageSize: 12 });
    const page2 = await publicPost('/api/search', { title: 'heat', page: 2, pageSize: 12 });
    const page4 = await publicPost('/api/search', { title: 'heat', page: 4, pageSize: 12 });

    expect(ids(page1.body.movies)).toEqual(range(1, 12));
    expect(ids(page2.body.movies)).toEqual(range(13, 24));
    expect(ids(page4.body.movies)).toEqual(range(37, 45));
    expect(page1.body.totalPages).toBe(4);
  });

  it('does not request TMDB pages past the last result', async () => {
    mockGet.mockImplementation(tmdbSearch(15) as never);
    const response = await publicPost('/api/search', { title: 'heat', page: 2, pageSize: 12 });
    expect(ids(response.body.movies)).toEqual([13, 14, 15]);
    const requestedPages = mockGet.mock.calls.map(([, config]) => config?.params?.page);
    expect(requestedPages).toEqual([1]);
  });

  it('caps the page size', async () => {
    const response = await publicPost('/api/search', { title: 'heat', pageSize: 500 });
    expect(response.body.movies).toHaveLength(20);
  });

  it('searches movies and TV with their own year parameters', async () => {
    await publicPost('/api/search', { title: 'heat & dust', type: 'movie', year: '1995' });
    await publicPost('/api/search', { title: 'heat', type: 'tv', year: '2004' });

    expect(requestedPaths()).toEqual(['/search/movie', '/search/tv']);
    expect(mockGet.mock.calls[0][1]?.params).toMatchObject({ query: 'heat & dust', primary_release_year: '1995' });
    expect(mockGet.mock.calls[1][1]?.params).toMatchObject({ query: 'heat', first_air_date_year: '2004' });
  });

  it('adds media_type to single-type results', async () => {
    const response = await publicPost('/api/search', { title: 'heat', type: 'tv' });
    expect(response.body.movies[0]).toMatchObject({ id: 1, media_type: 'tv' });
  });

  it('uses multi search without a type, leaving out people and other years', async () => {
    mockGet.mockResolvedValue({
      data: {
        total_results: 4,
        total_pages: 1,
        results: [
          { id: 1, media_type: 'movie', title: 'Heat', release_date: '1995-12-15' },
          { id: 2, media_type: 'tv', name: 'Heat', first_air_date: '1995-03-01' },
          { id: 3, media_type: 'person', name: 'Heather' },
          { id: 4, media_type: 'movie', title: 'Heat Wave', release_date: '2009-07-01' },
        ],
      },
    } as never);

    const response = await publicPost('/api/search', { title: 'heat', type: 'None', year: '1995' });

    expect(requestedPaths()).toEqual(['/search/multi']);
    expect(mockGet.mock.calls[0][1]?.params).not.toHaveProperty('year');
    expect(response.body.movies.map((movie: any) => `${movie.media_type}-${movie.id}`)).toEqual(['movie-1', 'tv-2']);
  });

  it('leaves out "no filter" placeholders', async () => {
    await publicPost('/api/search', { title: 'heat', type: 'None', year: 'All Years' });
    const params = mockGet.mock.calls[0][1]?.params;
    expect(requestedPaths()).toEqual(['/search/multi']);
    expect(params).not.toHaveProperty('primary_release_year');
    expect(params).not.toHaveProperty('first_air_date_year');
  });

  it('reports when nothing matches', async () => {
    mockGet.mockImplementation(tmdbSearch(0) as never);
    const response = await publicPost('/api/search', { title: 'zzzz' });
    expect(response.body).toEqual({ success: false, error: 'Movie not found!' });
  });

  it('strips the API key from TMDB errors before they are logged', async () => {
    mockGet.mockImplementation((async (_url: string, config: any) => {
      throw Object.assign(new Error(`Request failed: api_key=${config.params.api_key}`), {
        isAxiosError: true,
        config: { params: { ...config.params } },
        request: { path: `/3/search/multi?api_key=${config.params.api_key}` },
      });
    }) as never);

    const error: any = await searchPage({ query: 'heat', year: '', type: '' }, 1).catch((e) => e);

    expect(error.message).not.toContain('test');
    expect(error.config.params).not.toHaveProperty('api_key');
    expect(error.request).toBeUndefined();
  });

  it('retries dropped connections but not HTTP errors', async () => {
    const reset = Object.assign(new Error('read ECONNRESET'), { isAxiosError: true, config: { params: {} } });
    mockGet.mockRejectedValueOnce(reset);
    mockGet.mockRejectedValueOnce(reset);
    const results = await searchPage({ query: 'heat', year: '', type: 'movie' }, 1);
    expect(results.results).toHaveLength(20);
    expect(mockGet).toHaveBeenCalledTimes(3);

    mockGet.mockReset();
    mockGet.mockRejectedValue(
      Object.assign(new Error('Not found'), { isAxiosError: true, config: { params: {} }, response: { status: 404 } }),
    );
    await expect(searchPage({ query: 'heat', year: '', type: 'movie' }, 1)).rejects.toThrow('Not found');
    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});
