import { generateKeyPairSync } from 'crypto';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { vi } from 'vitest';
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

export type FakeTitle = {
  id: number;
  media_type?: MediaType;
  title: string;
  year?: string;
  genre?: string;
  director?: string;
  actors?: string;
  overview?: string;
  keywords?: { id: number; name: string }[];
};

// A small part of TMDB's real genre lists.
export const TMDB_GENRES: Record<MediaType, { id: number; name: string }[]> = {
  movie: [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 18, name: 'Drama' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Science Fiction' },
    { id: 53, name: 'Thriller' },
  ],
  tv: [
    { id: 10759, name: 'Action & Adventure' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 18, name: 'Drama' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
  ],
};

const notFound = () =>
  Object.assign(new Error('Request failed with status code 404'), {
    isAxiosError: true,
    response: { status: 404 },
  });

const mediaTypeOf = (title: FakeTitle) => title.media_type ?? 'movie';
const genreNames = (title: FakeTitle) => (title.genre ?? 'Drama').split(', ');
const yearOf = (title: FakeTitle) => title.year ?? '2000';
const dateOf = (title: FakeTitle) => `${yearOf(title).slice(0, 4)}-01-01`;

const listResult = (title: FakeTitle) => {
  const mediaType = mediaTypeOf(title);
  return {
    id: title.id,
    ...(mediaType === 'movie'
      ? { title: title.title, release_date: dateOf(title) }
      : { name: title.title, first_air_date: dateOf(title) }),
    overview: title.overview ?? `${title.title} plot`,
    genre_ids: TMDB_GENRES[mediaType]
      .filter(({ name }) => genreNames(title).includes(name))
      .map(({ id }) => id),
  };
};

const detailsResponse = (title: FakeTitle) => {
  const directors = (title.director ?? '').split(', ').filter(Boolean);
  const cast = (title.actors ?? '').split(', ').filter(Boolean).map((name) => ({ name }));
  const { genre_ids: _genreIds, ...rest } = listResult(title);
  return {
    ...rest,
    genres: TMDB_GENRES[mediaTypeOf(title)].filter(({ name }) => genreNames(title).includes(name)),
    ...(mediaTypeOf(title) === 'movie'
      ? { credits: { cast, crew: directors.map((name) => ({ name, job: 'Director' })) } }
      : { aggregate_credits: { cast }, created_by: directors.map((name) => ({ name })) }),
  };
};

// Applies the same filters TMDB would, so tests see what a query really selects.
const matchesDiscover = (title: FakeTitle, mediaType: MediaType, params: any) => {
  const date = dateOf(title);
  const prefix = mediaType === 'movie' ? 'primary_release_date' : 'first_air_date';
  const ids = (value: string) => value.split('|').map(Number);
  return (
    mediaTypeOf(title) === mediaType &&
    (!params.with_genres ||
      listResult(title).genre_ids.some((id) => ids(params.with_genres).includes(id))) &&
    (!params.with_keywords ||
      (title.keywords ?? []).some(({ id }) => ids(params.with_keywords).includes(id))) &&
    (!params[`${prefix}.gte`] || date >= params[`${prefix}.gte`]) &&
    (!params[`${prefix}.lte`] || date <= params[`${prefix}.lte`])
  );
};

export const mockTmdbGet = vi.mocked(axios.get);

// Answers TMDB requests from the given titles. Paths matching `failing` reject.
export const serveTmdb = (
  titles: FakeTitle[],
  { failing, totalPages = 1 }: { failing?: RegExp; totalPages?: number } = {},
) => {
  mockTmdbGet.mockReset();
  mockTmdbGet.mockImplementation((async (url: string, config: any) => {
    const path = url.replace(`${process.env.TMDB_URL}/3`, '');
    const params = config?.params ?? {};
    if (failing?.test(path)) throw new Error(`TMDB is failing: ${path}`);

    const genreList = path.match(/^\/genre\/(movie|tv)\/list$/);
    if (genreList) return { data: { genres: TMDB_GENRES[genreList[1] as MediaType] } };

    if (path === '/search/keyword') {
      const keywords = titles.flatMap((title) => title.keywords ?? []);
      return {
        data: {
          results: keywords.filter(({ name }) => name.includes(String(params.query))),
        },
      };
    }

    const discover = path.match(/^\/discover\/(movie|tv)$/);
    if (discover) {
      const mediaType = discover[1] as MediaType;
      return {
        data: {
          total_pages: totalPages,
          results: titles
            .filter((title) => matchesDiscover(title, mediaType, params))
            .map(listResult),
        },
      };
    }

    const details = path.match(/^\/(movie|tv)\/(\d+)$/);
    if (details) {
      const title = titles.find(
        (candidate) =>
          mediaTypeOf(candidate) === details[1] && candidate.id === Number(details[2]),
      );
      if (!title) throw notFound();
      return { data: detailsResponse(title) };
    }

    throw new Error(`Unexpected TMDB call: ${path}`);
  }) as never);
};

// The TMDB requests made so far whose path matches, with their params.
export const tmdbCalls = (path: RegExp) =>
  mockTmdbGet.mock.calls
    .map(([url, config]) => ({
      path: String(url).replace(`${process.env.TMDB_URL}/3`, ''),
      params: (config?.params ?? {}) as Record<string, any>,
    }))
    .filter((call) => path.test(call.path));

export const resetDatabase = () =>
  pool.query('TRUNCATE users_yn085, favourites_yn085, user_movies_yn085');

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
