import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import app from '../app';
import { embedQuery } from '../services/embeddings';
import {
  addToList,
  alice,
  authedPost,
  axis,
  blend,
  pool,
  publicPost,
  resetDatabase,
  seedMovies,
  setEmbedding,
} from './helpers';

const mockEmbedQuery = vi.mocked(embedQuery);
// TMDB ids of the seeded movies.
const HEIST = 101;
const CAPER = 102;
const SPACE = 103;
const PLAIN = 104;
const SAVED = 105;

const ids = (movies: { id: number }[]) => movies.map((movie) => movie.id);

beforeEach(async () => {
  await resetDatabase();
  await seedMovies([
    { id: HEIST, title: "Ocean's Eleven", genre: 'Crime, Thriller', director: 'Steven Soderbergh' },
    { id: CAPER, title: 'The Italian Job', genre: 'Action, Crime', director: 'F. Gary Gray' },
    { id: SPACE, title: 'The Martian', genre: 'Adventure, Sci-Fi', director: 'Ridley Scott' },
    { id: PLAIN, title: 'Not Embedded Yet', genre: 'Crime' },
  ]);
  // Axis 0 = "heist", axis 1 = "space".
  await setEmbedding(HEIST, axis(0));
  await setEmbedding(CAPER, blend(0, 1, 0.8));
  await setEmbedding(SPACE, axis(1));
});

afterEach(() => {
  mockEmbedQuery.mockReset();
  mockEmbedQuery.mockRejectedValue(new Error('Model disabled in tests'));
  vi.restoreAllMocks();
});

afterAll(() => pool.end());

describe('POST /api/wheel/candidates with a mood', () => {
  it('returns the closest movies by meaning, best match first', async () => {
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

  it('still applies the regular filters', async () => {
    mockEmbedQuery.mockResolvedValue(axis(0));

    const response = await publicPost('/api/wheel/candidates', {
      mood: 'heist',
      genres: ['Sci-Fi'],
    });

    expect(ids(response.body.movies)).toEqual([SPACE]);
  });

  it('caps the mood at 200 characters', async () => {
    mockEmbedQuery.mockResolvedValue(axis(0));
    await publicPost('/api/wheel/candidates', { mood: 'x'.repeat(500) });
    expect(mockEmbedQuery).toHaveBeenCalledWith('x'.repeat(200));
  });

  it('falls back to random candidates when the model is unavailable', async () => {
    const response = await publicPost('/api/wheel/candidates', { mood: 'heist' });

    expect(response.status).toBe(200);
    expect(response.body.moodApplied).toBe(false);
    // Includes the movie without an embedding, which mood search skips.
    expect(ids(response.body.movies).sort()).toEqual([HEIST, CAPER, SPACE, PLAIN]);
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
    await seedMovies([
      { id: SAVED, title: 'Traffic', genre: 'Crime, Drama', director: 'Steven Soderbergh' },
    ]);
    await addToList(alice, 'favourite', SAVED);
    await addToList(alice, 'watched', SPACE);

    const { status, data } = await authedPost('/api/wheel/smart', alice, { count: 10 });

    expect(status).toBe(200);
    expect(ids(data.movies)).not.toContain(SPACE);
    const heist = data.movies.find((movie: any) => movie.id === HEIST);
    expect(heist.reasons).toEqual(['Because you saved 1 film by Steven Soderbergh']);
  });

  it('favours titles that match the profile', async () => {
    await seedMovies([
      { id: SAVED, title: 'Traffic', genre: 'Crime', director: 'Steven Soderbergh' },
    ]);
    await addToList(alice, 'favourite', SAVED);
    // Candidates: HEIST scores 1 + 3x2 (director) + 3 (Crime) = 10 and
    // SPACE scores 1. A draw at the midpoint (5.5 of 11) lands on HEIST
    // whichever order the database returns them in.
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const { data } = await authedPost('/api/wheel/smart', alice, {
      count: 1,
      genres: ['Thriller', 'Sci-Fi'],
    });

    expect(ids(data.movies)).toEqual([HEIST]);
  });

  it('combines a mood with taste, mood reason first', async () => {
    mockEmbedQuery.mockResolvedValue(axis(0));
    await seedMovies([
      { id: SAVED, title: 'Traffic', genre: 'Crime', director: 'Steven Soderbergh' },
    ]);
    await addToList(alice, 'favourite', SAVED);

    const { data } = await authedPost('/api/wheel/smart', alice, {
      count: 3,
      mood: 'heist',
      exclude: [{ id: SAVED, media_type: 'movie' }],
    });

    expect(data.moodApplied).toBe(true);
    // Movies without embeddings are not mood candidates.
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
});
