// Shared by globalSetup (separate process) and setup (test workers).
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  'postgresql://localhost:5432/moviesync_test';
