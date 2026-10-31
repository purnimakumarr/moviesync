import { generateKeyPairSync } from 'crypto';
import { vi } from 'vitest';
import { TEST_DATABASE_URL } from './testEnv';

// Everything here runs before the app modules are imported, which read
// these values at load time.
const payloadKeys = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
});
const jwtKeys = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
});

Object.assign(process.env, {
  DATABASE_URL: TEST_DATABASE_URL,
  OAUTH_ISSUER: 'https://issuer.test/',
  OAUTH_AUDIENCE: 'https://api.moviesync.test',
  OAUTH_CLIENT_ID: 'test-client-id',
  OAUTH_JWKS_URI: 'https://issuer.test/.well-known/jwks.json',
  // One key pair stands in for both the frontend and backend pairs.
  RSA_PUBLIC_KEY_FE: payloadKeys.publicKey,
  RSA_PRIVATE_KEY_BE: payloadKeys.privateKey,
  TEST_JWT_PRIVATE_KEY: jwtKeys.privateKey,
  TEST_JWT_PUBLIC_KEY: jwtKeys.publicKey,
  TMDB_URL: 'https://tmdb.test',
  TMDB_API_KEY: 'test',
  ENCRYPTION_KEY: 'test-encryption-key',
});

// Serve the test signing key instead of fetching the provider's JWKS.
vi.mock('jwks-rsa', () => ({
  JwksClient: class {
    getSigningKey(
      _kid: string,
      callback: (err: Error | null, key?: { publicKey: string }) => void,
    ) {
      callback(null, { publicKey: process.env.TEST_JWT_PUBLIC_KEY as string });
    }
  },
}));

// No test should reach TMDB; movies are seeded into movie_cache instead.
vi.mock('axios', () => {
  const offline = () =>
    Promise.reject(new Error('Network access is disabled in tests'));
  return {
    default: {
      get: vi.fn(offline),
      post: vi.fn(offline),
      isAxiosError: (error: any) => Boolean(error?.isAxiosError),
    },
  };
});

// The real model is a 33 MB download; tests choose the query vector instead.
// By default it fails, exercising the "model unavailable" fallback.
vi.mock('../services/embeddings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/embeddings')>();
  return {
    ...actual,
    embedQuery: vi.fn(() => Promise.reject(new Error('Model disabled in tests'))),
    embedMovies: vi.fn(() => Promise.reject(new Error('Model disabled in tests'))),
  };
});
