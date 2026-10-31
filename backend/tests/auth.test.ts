import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../app';
import {
  alice,
  authedPost,
  bob,
  idTokenFor,
  pool,
  resetDatabase,
  seedMovies,
  signWith,
  untrustedPrivateKey,
} from './helpers';

beforeEach(async () => {
  await resetDatabase();
  await seedMovies([{ id: 1, title: 'Alice Pick' }]);
  await authedPost('/api/user/create-user', alice);
  await authedPost('/api/user/create-user', bob);
});

afterAll(() => pool.end());

describe('token verification', () => {
  it('rejects requests without a bearer token', async () => {
    const response = await request(app).post('/api/favourite/list').send({});
    expect(response.status).toBe(401);
  });

  it('rejects access tokens signed by an untrusted key', async () => {
    const forged = signWith(
      { sub: alice.sub, aud: process.env.OAUTH_AUDIENCE },
      untrustedPrivateKey,
    );
    const { status } = await authedPost('/api/favourite/list', alice, {}, {
      accessToken: forged,
    });
    expect(status).toBe(401);
  });

  it("rejects an ID token that belongs to a different user", async () => {
    const { status } = await authedPost('/api/favourite/list', bob, {}, {
      idToken: idTokenFor(alice),
    });
    expect(status).toBe(401);
  });

  it('rejects requests without an ID token', async () => {
    const { status } = await authedPost('/api/favourite/list', alice, {}, {
      idToken: '',
    });
    expect(status).toBe(401);
  });
});

// Regression tests: the API used to trust a userID sent in the request body.
describe('user identity comes from the token, not the body', () => {
  it("ignores a body userID when listing another user's favourites", async () => {
    await authedPost('/api/favourite/add', alice, { id: 1, media_type: 'movie' });

    const { status, data } = await authedPost('/api/favourite/list', bob, {
      userID: alice.email,
    });

    expect(status).toBe(200);
    expect(data.movies).toEqual([]);
  });

  it("cannot delete or clear another user's favourites", async () => {
    await authedPost('/api/favourite/add', alice, { id: 1, media_type: 'movie' });

    await authedPost('/api/favourite/delete', bob, {
      userID: alice.email,
      id: 1,
      media_type: 'movie',
    });
    await authedPost('/api/favourite/clear', bob, { userID: alice.email });

    const { data } = await authedPost('/api/favourite/list', alice);
    expect(data.movies.map((movie: any) => movie.id)).toEqual([1]);
  });

  it("cannot read another user's profile", async () => {
    await authedPost('/api/user/update-user', alice, {
      firstName: 'Alice',
      lastName: 'Liddell',
    });

    const { data } = await authedPost('/api/user/get-user', bob, {
      userID: alice.email,
    });

    expect(data.user.firstName).toBeNull();
  });
});
