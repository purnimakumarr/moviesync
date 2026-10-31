import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setup.ts'],
    // Test files share one database, so run them one at a time.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['controllers/**', 'middleware/**', 'routes/**', 'services/**'],
    },
  },
});
