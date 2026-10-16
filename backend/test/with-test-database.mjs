import 'dotenv/config';
import { spawnSync } from 'node:child_process';

const allowedCommands = new Map([
  ['validate', ['validate']],
  ['generate', ['generate']],
  ['migrate status', ['migrate', 'status']],
  ['migrate deploy', ['migrate', 'deploy']],
]);

const command = process.argv.slice(2).join(' ');
const prismaArgs = allowedCommands.get(command);
if (!prismaArgs) {
  throw new Error('Only validate, generate, and migrate deploy are allowed.');
}

const databaseUrl = process.env.DATABASE_URL;
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!databaseUrl || !testDatabaseUrl) {
  throw new Error('DATABASE_URL and TEST_DATABASE_URL must be configured in backend/.env.');
}

const testUrl = new URL(testDatabaseUrl);
const testDatabaseName = testUrl.pathname.replace(/^\//, '');
if (testDatabaseUrl === databaseUrl || !/test|e2e/i.test(testDatabaseName)) {
  throw new Error('TEST_DATABASE_URL must be distinct from DATABASE_URL and target a test database.');
}

const result = spawnSync('npx', ['prisma', ...prismaArgs], {
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
