import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app';
import { embedMovies, embedQuery } from '../services/embeddings';
import {
  addToList,
  alice,
  authedPost,
  axis,
  blend,
  FakeTitle,
  mockTmdbGet,
  pool,
  publicPost,
  resetDatabase,
  serveTmdb,
  tmdbCalls,
} from './helpers';

const mockEmbedQuery = vi.mocked(embedQuery);
const mockEmbedMovies = vi.mocked(embedMovies);
// TMDB ids of the fake titles.
const HEIST = 101;
const CAPER = 102;
const SPACE = 103;
const PLAIN = 104;
const SAVED = 105;

const HEIST_KEYWORD = { id: 9001, name: 'heist' };

const TITLES: FakeTitle[] = [
  {
    id: HEIST,
    title: "Ocean's Eleven",
    genre: 'Crime, Thriller',
    director: 'Steven Soderbergh',
    keywords: [HEIST_KEYWORD],
  },
  { id: CAPER, title: 'The Italian Job', genre: 'Action, Crime', director: 'F. Gary Gray' },
  { id: SPACE, title: 'The Martian', genre: 'Adventure, Science Fiction', director: 'Ridley Scott' },
  { id: PLAIN, title: 'No Plot Yet', genre: 'Crime', overview: '' },
  { id: SAVED, title: 'Traffic', genre: 'Crime, Drama', director: 'Steven Soderbergh' },
];

// Axis 0 = "heist", axis 1 = "space".
const VECTORS: Record<string, number[]> = {
  "Ocean's Eleven": axis(0),
  'The Italian Job': blend(0, 1, 0.8),
  'The Martian': axis(1),
  Traffic: blend(0, 1, 0.6),
};

const ids = (movies: { id: number }[]) => movies.map((movie) => movie.id);
const modelDisabled = () => Promise.reject(new Error('Model disabled in tests'));

beforeEach(async () => {
  await resetDatabase();
  serveTmdb(TITLES);
  mockEmbedMovies.mockImplementation(async (movies) =>
    movies.map((movie) => VECTORS[movie.title as string]),
  );
});

afterEach(() => {
  mockEmbedQuery.mockReset();
  mockEmbedQuery.mockImplementation(modelDisabled);
  mockEmbedMovies.mockReset();
  mockEmbedMovies.mockImplementation(modelDisabled);
  vi.restoreAllMocks();
});

afterAll(() => pool.end());

describe('POST /api/wheel/candidates with a mood', () => {
  it('returns the closest titles by meaning, best match first', async () => {
    mockEmbedQuery.mockResolvedValue(axis(0));

    const response = await publicPost('/api/wheel/candidates', {
      mood: 'feel-good heist',
      limit: 2,
    });

    expect(response.status).toBe(200);
    expect(response.body.moodApplied).toBe(true);
    expect(ids(response.body.movies)).toEqual([HEIST, CAPER]);
    expect(response.body.movies[0].similarity).toBeCloseTo(1, 5);
    expect(response.body.movies[1].similarity).toBeCloseTo(0.8, 5);
    expect(response.body.movies[0].reasons).toEqual(['Close match to "feel-good heist"']);
    expect(mockEmbedQuery).toHaveBeenCalledWith('feel-good heist');
  });

  it('skips titles with no plot', async () => {
    mockEmbedQuery.mockResolvedValue(axis(0));
    const response = await publicPost('/api/wheel/candidates', { mood: 'heist' });
    expect(ids(response.body.movies)).not.toContain(PLAIN);
  });

  it('still applies the regular filters', async () => {
    mockEmbedQuery.mockResolvedValue(axis(0));

    const response = await publicPost('/api/wheel/candidates', {
      mood: 'heist',
      genres: ['Science Fiction'],
    });

    expect(ids(response.body.movies)).toEqual([SPACE]);
  });

  it('caps the mood at 200 characters', async () => {
    mockEmbedQuery.mockResolvedValue(axis(0));
    await publicPost('/api/wheel/candidates', { mood: 'x'.repeat(500) });
    expect(mockEmbedQuery).toHaveBeenCalledWith('x'.repeat(200));
  });

  it("looks up the mood's words as TMDB keywords and queries by them", async () => {
    mockEmbedQuery.mockResolvedValue(axis(0));

    await publicPost('/api/wheel/candidates', { mood: 'a heist with the crew' });

    // Short words and stopwords are not looked up.
    expect(tmdbCalls(/^\/search\/keyword$/).map((call) => call.params.query)).toEqual([
      'heist',
      'crew',
    ]);
    expect(
      tmdbCalls(/^\/discover\/movie$/).some(
        (call) => call.params.with_keywords === String(HEIST_KEYWORD.id),
      ),
    ).toBe(true);
  });

  it('prefers keyword matches when the pool is cut to size', async () => {
    mockEmbedQuery.mockResolvedValue(axis(1));
    const many = Array.from({ length: 80 }, (_, i) => ({ id: 1000 + i, title: `Filler ${i}` }));
    serveTmdb([...TITLES, ...many]);
    mockEmbedMovies.mockImplementation(async (movies) => movies.map(() => axis(2)));

    const response = await publicPost('/api/wheel/candidates', { mood: 'heist', type: 'movie' });

    expect(response.status).toBe(200);
    const embedded = mockEmbedMovies.mock.calls[0][0];
    expect(embedded.length).toBeLessThanOrEqual(60);
    expect(embedded.map((movie) => movie.title)).toContain("Ocean's Eleven");
  });

  it('uses the random pool when no keyword matches', async () => {
    mockEmbedQuery.mockResolvedValue(axis(1));

    const response = await publicPost('/api/wheel/candidates', { mood: 'space survival' });

    expect(response.body.moodApplied).toBe(true);
    expect(ids(response.body.movies)[0]).toBe(SPACE);
    expect(tmdbCalls(/^\/discover\//).every((call) => !call.params.with_keywords)).toBe(true);
  });

  it('keeps working when the keyword lookup fails', async () => {
    mockEmbedQuery.mockResolvedValue(axis(1));
    serveTmdb(TITLES, { failing: /^\/search\/keyword$/ });

    const response = await publicPost('/api/wheel/candidates', { mood: 'space' });

    expect(response.status).toBe(200);
    expect(ids(response.body.movies)[0]).toBe(SPACE);
  });

  it('falls back to random candidates when the model is unavailable', async () => {
    const response = await publicPost('/api/wheel/candidates', { mood: 'heist' });

    expect(response.status).toBe(200);
    expect(response.body.moodApplied).toBe(false);
    // Includes the title without a plot, which mood search skips.
    expect(ids(response.body.movies).sort()).toEqual([HEIST, CAPER, SPACE, PLAIN, SAVED]);
    expect(response.body.movies[0].reasons).toBeUndefined();
    expect(tmdbCalls(/^\/search\/keyword$/)).toEqual([]);
  });

  it('ignores the mood when the candidates cannot be embedded', async () => {
    mockEmbedQuery.mockResolvedValue(axis(0));
    mockEmbedMovies.mockImplementation(modelDisabled);

    const response = await publicPost('/api/wheel/candidates', { mood: 'heist', limit: 3 });

    expect(response.status).toBe(200);
    expect(response.body.moodApplied).toBe(false);
    expect(response.body.movies).toHaveLength(3);
    expect(response.body.movies[0].reasons).toBeUndefined();
  });

  it('ignores a blank mood', async () => {
    const response = await publicPost('/api/wheel/candidates', { mood: '   ' });
    expect(mockEmbedQuery).not.toHaveBeenCalled();
    expect(response.body.moodApplied).toBe(false);
  });
});

describe('POST /api/wheel/smart', () => {
  beforeEach(async () => {
    await authedPost('/api/user/create-user', alice);
  });

  it('requires login', async () => {
    const response = await request(app).post('/api/wheel/smart').send({});
    expect(response.status).toBe(401);
  });

  it('never picks watched titles and explains picks from saved taste', async () => {
    await addToList(alice, 'favourite', SAVED);
    await addToList(alice, 'watched', SPACE);

    const { status, data } = await authedPost('/api/wheel/smart', alice, { count: 10 });

    expect(status).toBe(200);
    expect(ids(data.movies)).not.toContain(SPACE);
    const heist = data.movies.find((movie: any) => movie.id === HEIST);
    expect(heist.reasons).toEqual(['Because you saved 1 film by Steven Soderbergh']);
  });

  it('builds the taste from live details, with a title on two lists counting for both', async () => {
    await addToList(alice, 'favourite', SAVED);
    await addToList(alice, 'watched', SAVED);
    mockTmdbGet.mockClear();

    const { data } = await authedPost('/api/wheel/smart', alice, { count: 10 });

    const heist = data.movies.find((movie: any) => movie.id === HEIST);
    expect(heist.reasons).toEqual(['Because you saved 2 films by Steven Soderbergh']);
    // Watched, so never a candidate: the only request is for the profile.
    expect(tmdbCalls(/^\/movie\/105$/)).toHaveLength(1);
  });

  it('leaves a saved title out of the taste when TMDB cannot return it', async () => {
    await addToList(alice, 'favourite', SAVED);
    serveTmdb(TITLES, { failing: /^\/movie\/105$/ });

    const { status, data } = await authedPost('/api/wheel/smart', alice, { count: 10 });

    expect(status).toBe(200);
    const heist = data.movies.find((movie: any) => movie.id === HEIST);
    expect(heist.reasons).toEqual([]);
  });

  it('favours titles that match the profile', async () => {
    await addToList(alice, 'favourite', SAVED);
    // Candidates: HEIST scores 1 + 3x2 (director) + 3 (Crime) = 10 and
    // SPACE scores 1. A draw at the midpoint (5.5 of 11) lands on HEIST
    // whichever order the candidates arrive in.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const { data } = await authedPost('/api/wheel/smart', alice, {
      count: 1,
      genres: ['Thriller', 'Science Fiction'],
    });

    expect(ids(data.movies)).toEqual([HEIST]);
  });

  it('returns full details for the picks', async () => {
    const { data } = await authedPost('/api/wheel/smart', alice, { count: 1, genres: ['Thriller'] });

    expect(data.movies[0].id).toBe(HEIST);
    expect(data.movies[0].credits.crew[0]).toMatchObject({ name: 'Steven Soderbergh' });
    expect(data.movies[0].media_type).toBe('movie');
  });

  it('only requests details for a shortlist of candidates', async () => {
    serveTmdb(Array.from({ length: 60 }, (_, i) => ({ id: 2000 + i, title: `Title ${i}` })));

    const { data } = await authedPost('/api/wheel/smart', alice, { count: 3 });

    expect(data.movies).toHaveLength(3);
    expect(tmdbCalls(/^\/movie\/\d+$/)).toHaveLength(20);
  });

  it('keeps a candidate scored on genres when its details fail', async () => {
    await addToList(alice, 'favourite', SAVED);
    serveTmdb(TITLES, { failing: new RegExp(`^/movie/${HEIST}$`) });

    const { status, data } = await authedPost('/api/wheel/smart', alice, { count: 10 });

    expect(status).toBe(200);
    const heist = data.movies.find((movie: any) => movie.id === HEIST);
    expect(heist.reasons).toEqual(['Matches your top genre: Crime']);
    expect(heist.genres).toEqual([
      { id: 80, name: 'Crime' },
      { id: 53, name: 'Thriller' },
    ]);
  });

  it('combines a mood with taste, mood reason first', async () => {
    mockEmbedQuery.mockResolvedValue(axis(0));
    await addToList(alice, 'favourite', SAVED);

    const { data } = await authedPost('/api/wheel/smart', alice, {
      count: 3,
      mood: 'heist',
      exclude: [{ id: SAVED, media_type: 'movie' }],
    });

    expect(data.moodApplied).toBe(true);
    // Titles without a plot are not mood candidates.
    expect(ids(data.movies)).not.toContain(PLAIN);
    const heist = data.movies.find((movie: any) => movie.id === HEIST);
    expect(heist.reasons).toEqual([
      'Close match to "heist"',
      'Because you saved 1 film by Steven Soderbergh',
    ]);
  });

  it('limits the number of picks', async () => {
    const { data } = await authedPost('/api/wheel/smart', alice, { count: 2 });
    expect(data.movies).toHaveLength(2);
  });

  it('reports an error when TMDB is unreachable', async () => {
    serveTmdb(TITLES, { failing: /./ });
    const { status } = await authedPost('/api/wheel/smart', alice, {});
    expect(status).toBe(500);
  });
});
