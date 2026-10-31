import { execSync } from 'child_process';
import { TEST_DATABASE_URL } from './testEnv';

// Bring the test database up to the latest schema once per run.
export default function setup() {
  execSync('npx node-pg-migrate up -m migrations --envPath /dev/null', {
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'pipe',
  });
}
