import { generateKeyPairSync } from 'crypto';
import { defineConfig, devices } from '@playwright/test';

const PORT = 4174;

// Throwaway key pair so signed-in pages can encrypt request bodies; the mocked
// API never decrypts them.
const payloadKeys = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
});

// Responsive smoke tests against a production build. The API is mocked in the
// tests, so these placeholder values only need to exist.
const buildEnv = {
  VITE_RSA_PUBLIC_KEY_BE: payloadKeys.publicKey,
  VITE_RSA_PRIVATE_KEY_FE: payloadKeys.privateKey,
  VITE_BACKEND_URL_PROD: `http://localhost:${PORT}/mock-api`,
  VITE_FRONTEND_URL_PROD: `http://localhost:${PORT}`,
  VITE_OAUTH_AUTHORITY: 'https://auth.example.test',
  VITE_OAUTH_AUDIENCE: 'https://api.example.test',
  VITE_OAUTH_CLIENT_ID: 'e2e-client',
  VITE_OAUTH_LOGOUT_URL: 'https://auth.example.test/v2/logout',
};

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: `npx vite build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    env: buildEnv,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
