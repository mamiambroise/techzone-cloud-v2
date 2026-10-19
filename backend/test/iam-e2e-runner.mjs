import 'dotenv/config';
import { spawn } from 'node:child_process';
import { config as loadEnv } from 'dotenv';

// Le profil local porte les secrets JWT/MFA mais ne doit jamais remplacer la
// cible DB : DATABASE_URL est explicitement forcée vers TEST_DATABASE_URL plus
// bas, pour le seul processus Jest.
loadEnv({ path: '.env.local', override: false, quiet: true });

function fail(message) {
  process.stderr.write(`IAM E2E blocked: ${message}\n`);
  process.stderr.write('Set TEST_DATABASE_URL to an isolated PostgreSQL database whose name contains "test" or "e2e".\n');
  process.exit(2);
}

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
const applicationDatabaseUrl = process.env.DATABASE_URL?.trim();

if (!testDatabaseUrl) fail('TEST_DATABASE_URL is not configured; DATABASE_URL is never used as a fallback.');
if (testDatabaseUrl === applicationDatabaseUrl && !process.env.CI) {
  fail('TEST_DATABASE_URL must differ from DATABASE_URL outside an explicitly isolated CI environment.');
}

let databaseName;
try {
  databaseName = decodeURIComponent(new URL(testDatabaseUrl).pathname).replace(/^\/+/, '');
} catch {
  fail('TEST_DATABASE_URL is not a valid PostgreSQL URL.');
}

if (!/(?:^|[_-])(test|e2e)(?:$|[_-])/i.test(databaseName)) {
  fail(`database "${databaseName || 'unknown'}" is not clearly a test database.`);
}

const child = spawn(
  process.execPath,
  [
    '--experimental-vm-modules',
    './node_modules/jest/bin/jest.js',
    '--config',
    './test/jest-e2e.json',
    ...process.argv.slice(2),
  ],
  {
    cwd: process.cwd(),
    // Keep every module loaded by Jest on the isolated database from process
    // startup. The setup file accepts this alias only for this dedicated,
    // prevalidated runner.
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      TECHZONE_E2E_ISOLATED_RUNNER: '1',
    },
    stdio: 'inherit',
  },
);

child.once('error', (error) => {
  process.stderr.write(`IAM E2E failed to start: ${error.message}\n`);
  process.exit(1);
});
child.once('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
