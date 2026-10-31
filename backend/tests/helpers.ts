import { generateKeyPairSync } from 'crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import pool from '../db';
import {
  decryptAESKey,
  decryptData,
  encryptAESKey,
  encryptData,
  generateAESKey,
} from '../security/encryption';

export type TestUser = { sub: string; email: string };

export const alice: TestUser = { sub: 'auth0|alice', email: 'alice@example.com' };
export const bob: TestUser = { sub: 'auth0|bob', email: 'bob@example.com' };

const sign = (claims: object, privateKey: string) =>
  jwt.sign(claims, privateKey, {
    algorithm: 'RS256',
    keyid: 'test-key',
    issuer: process.env.OAUTH_ISSUER,
    expiresIn: '5m',
  });

export const accessTokenFor = (user: TestUser) =>
  sign(
    { sub: user.sub, aud: process.env.OAUTH_AUDIENCE },
    process.env.TEST_JWT_PRIVATE_KEY as string,
  );

export const idTokenFor = (user: TestUser) =>
  sign(
    { sub: user.sub, email: user.email, aud: process.env.OAUTH_CLIENT_ID },
    process.env.TEST_JWT_PRIVATE_KEY as string,
  );

// A key pair the API does not trust, for forged-token tests.
export const untrustedPrivateKey = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
}).privateKey;

export const signWith = sign;

type AuthOptions = { accessToken?: string; idToken?: string };

// Sends a request the way the frontend's axiosPrivate does: bearer token,
// ID token header, and an encrypted body. Encrypted responses are decrypted.
export const authedPost = async (
  path: string,
  user: TestUser,
  body: object = {},
  options: AuthOptions = {},
) => {
  const aesKey = generateAESKey();
  const response = await request(app)
    .post(path)
    .set('Authorization', `Bearer ${options.accessToken ?? accessTokenFor(user)}`)
    .set('x-id-token', options.idToken ?? idTokenFor(user))
    .set('encrypted-key', encryptAESKey(aesKey))
    .send(encryptData(body, aesKey));

  const responseKey = response.headers['encrypted-key'];
  const data = responseKey
    ? decryptData(response.body, decryptAESKey(responseKey))
    : response.body;

  return { status: response.status, data: data as any };
};

export const publicPost = (path: string, body: object = {}) =>
  request(app).post(path).send(body);

export type MediaType = 'movie' | 'tv';

export type CachedMovie = {
  id: number;
  media_type?: MediaType;
  title: string;
  year?: string;
  genre?: string;
  director?: string;
  actors?: string;
};

// Stores a minimal TMDB details object plus the text columns built from it.
export const seedMovies = async (movies: CachedMovie[]) => {
  for (const movie of movies) {
    const mediaType = movie.media_type ?? 'movie';
    const year = movie.year ?? '2000';
    const genre = movie.genre ?? 'Drama';
    const date = `${year.slice(0, 4)}-01-01`;
    const details = {
      id: movie.id,
      ...(mediaType === 'movie'
        ? { title: movie.title, release_date: date }
        : { name: movie.title, first_air_date: date }),
      genres: genre.split(', ').map((name) => ({ name })),
    };
    await pool.query(
      `INSERT INTO movie_cache (tmdb_id, media_type, details, title, year, genre, type, director, actors)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        movie.id,
        mediaType,
        details,
        movie.title,
        year,
        genre,
        mediaType,
        movie.director ?? '',
        movie.actors ?? '',
      ],
    );
  }
};

export const resetDatabase = () =>
  pool.query(
    'TRUNCATE users_yn085, favourites_yn085, user_movies_yn085, movie_cache',
  );

export { pool };

export const EMBEDDING_DIMENSIONS = 384;

// Unit vector along one axis; cosine similarity between axes is 0.
export const axis = (index: number) =>
  Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => (i === index ? 1 : 0));

// Normalized blend of two axes, e.g. "mostly 0, a bit of 1".
export const blend = (a: number, b: number, weightA: number) => {
  const weightB = Math.sqrt(1 - weightA * weightA);
  return axis(a).map((value, i) => value * weightA + axis(b)[i] * weightB);
};

export const setEmbedding = (id: number, vector: number[]) =>
  pool.query('UPDATE movie_cache SET embedding = $1 WHERE tmdb_id = $2', [
    `[${vector.join(',')}]`,
    id,
  ]);

export const addToList = async (
  user: TestUser,
  list: 'favourite' | 'watched' | 'watch_later',
  id: number,
  media_type: MediaType = 'movie',
) => {
  const path =
    list === 'favourite'
      ? '/api/favourite/add'
      : list === 'watched'
        ? '/api/watched/add'
        : '/api/watch-later/add';
  const { status } = await authedPost(path, user, { id, media_type });
  if (status !== 200) throw new Error(`Adding ${media_type} ${id} to ${list} failed`);
};
