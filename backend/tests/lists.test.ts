import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { alice, authedPost, pool, resetDatabase, seedMovies } from './helpers';

const ids = (movies: { id: number; media_type: string }[]) =>
  movies.map((movie) => `${movie.media_type}-${movie.id}`).sort();

beforeEach(async () => {
  await resetDatabase();
  await seedMovies([
    { id: 1, title: 'First' },
    { id: 2, title: 'Second' },
    // Same TMDB id as First, but a different title.
    { id: 1, media_type: 'tv', title: 'First Show' },
  ]);
});

afterAll(() => pool.end());

describe('create-user', () => {
  it('creates the user on first login and is idempotent afterwards', async () => {
    const first = await authedPost('/api/user/create-user', alice);
    const second = await authedPost('/api/user/create-user', alice);

    expect(first.status).toBe(201);
    expect(first.data.created).toBe(true);
    expect(second.status).toBe(200);
    expect(second.data.created).toBe(false);
  });

  it('stores profile updates encrypted and returns them decrypted', async () => {
    await authedPost('/api/user/create-user', alice);
    const { data } = await authedPost('/api/user/update-user', alice, {
      firstName: 'Alice',
      lastName: 'Liddell',
    });

    expect(data.user).toMatchObject({ firstName: 'Alice', lastName: 'Liddell' });

    const raw = await pool.query('SELECT first_name FROM users_yn085');
    expect(raw.rows[0].first_name.toString()).not.toContain('Alice');
  });
});

describe('favourites', () => {
  beforeEach(() => authedPost('/api/user/create-user', alice));

  it('adds, lists, deletes and clears favourites', async () => {
    const added = await authedPost('/api/favourite/add', alice, {
      id: 1,
      media_type: 'movie',
    });
    expect(added.status).toBe(200);
    expect(added.data.movie).toMatchObject({ id: 1, media_type: 'movie', title: 'First' });

    await authedPost('/api/favourite/add', alice, { id: 2, media_type: 'movie' });
    let list = await authedPost('/api/favourite/list', alice);
    expect(ids(list.data.movies)).toEqual(['movie-1', 'movie-2']);

    await authedPost('/api/favourite/delete', alice, { id: 1, media_type: 'movie' });
    list = await authedPost('/api/favourite/list', alice);
    expect(ids(list.data.movies)).toEqual(['movie-2']);

    await authedPost('/api/favourite/clear', alice);
    list = await authedPost('/api/favourite/list', alice);
    expect(list.data.movies).toEqual([]);
  });

  it('keeps a movie and a TV show with the same TMDB id apart', async () => {
    await authedPost('/api/favourite/add', alice, { id: 1, media_type: 'movie' });
    await authedPost('/api/favourite/add', alice, { id: 1, media_type: 'tv' });
    let list = await authedPost('/api/favourite/list', alice);
    expect(ids(list.data.movies)).toEqual(['movie-1', 'tv-1']);
    expect(list.data.movies.find((movie: any) => movie.media_type === 'tv').name).toBe('First Show');

    await authedPost('/api/favourite/delete', alice, { id: 1, media_type: 'tv' });
    list = await authedPost('/api/favourite/list', alice);
    expect(ids(list.data.movies)).toEqual(['movie-1']);
  });

  it('requires a TMDB id and media type', async () => {
    for (const body of [{}, { id: 1 }, { id: 1, media_type: 'series' }, { id: 'abc', media_type: 'movie' }]) {
      const { status } = await authedPost('/api/favourite/add', alice, body);
      expect(status).toBe(400);
    }
  });
});

describe('watch later and watched', () => {
  beforeEach(() => authedPost('/api/user/create-user', alice));

  it('moves a movie from watch later to watched', async () => {
    await authedPost('/api/watch-later/add', alice, { id: 1, media_type: 'movie' });
    let later = await authedPost('/api/watch-later/list', alice);
    expect(ids(later.data.movies)).toEqual(['movie-1']);

    await authedPost('/api/watched/add', alice, { id: 1, media_type: 'movie' });
    later = await authedPost('/api/watch-later/list', alice);
    const watched = await authedPost('/api/watched/list', alice);

    expect(later.data.movies).toEqual([]);
    expect(ids(watched.data.movies)).toEqual(['movie-1']);
  });

  it('clears each list independently', async () => {
    await authedPost('/api/watch-later/add', alice, { id: 1, media_type: 'movie' });
    await authedPost('/api/watched/add', alice, { id: 2, media_type: 'movie' });

    await authedPost('/api/watch-later/clear', alice);

    const later = await authedPost('/api/watch-later/list', alice);
    const watched = await authedPost('/api/watched/list', alice);
    expect(later.data.movies).toEqual([]);
    expect(ids(watched.data.movies)).toEqual(['movie-2']);
  });

  it('removes a movie with watch/delete', async () => {
    await authedPost('/api/watched/add', alice, { id: 1, media_type: 'movie' });
    await authedPost('/api/watch/delete', alice, { id: 1, media_type: 'movie' });

    const watched = await authedPost('/api/watched/list', alice);
    expect(watched.data.movies).toEqual([]);
  });
});
