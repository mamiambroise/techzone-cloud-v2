import 'dotenv/config';
import { jest } from '@jest/globals';

/**
 * Database-backed specs must never inherit DATABASE_URL from a developer or
 * deployed environment.  The IAM E2E runner already enforces this contract;
 * keeping it here makes the ordinary Jest entrypoint equally safe.
 */
const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
const activeDatabaseUrl = process.env.DATABASE_URL?.trim();
const isIsolatedE2eRunner = process.env.TECHZONE_E2E_ISOLATED_RUNNER === '1';

if (testDatabaseUrl) {
  const parsedTestUrl = new URL(testDatabaseUrl);
  const databaseName = parsedTestUrl.pathname.replace(/^\//, '');

  if (
    !/test|e2e/i.test(databaseName) ||
    // The dedicated E2E runner has already verified that the configured
    // application and test targets differ, then deliberately replaces its
    // child process DATABASE_URL with the isolated target. Any other Jest
    // invocation that aliases the two URLs remains blocked.
    (isIsolatedE2eRunner
      ? activeDatabaseUrl !== testDatabaseUrl
      : testDatabaseUrl === activeDatabaseUrl)
  ) {
    throw new Error(
      'TEST_DATABASE_URL must target a test or e2e database and may only match DATABASE_URL through the isolated E2E runner.',
    );
  }

  process.env.DATABASE_URL = testDatabaseUrl;
} else {
  // Preserve pure unit-test execution while making any accidental Prisma use
  // fail closed instead of reaching the configured development database.
  process.env.DATABASE_URL =
    'postgresql://test:test@127.0.0.1:1/techzone_test?schema=business_manager';
}

Object.assign(globalThis, { jest });
