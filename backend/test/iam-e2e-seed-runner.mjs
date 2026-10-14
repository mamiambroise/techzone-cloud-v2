import 'dotenv/config';
import { spawn } from 'node:child_process';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local', override: false, quiet: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();
const applicationDatabaseUrl = process.env.DATABASE_URL?.trim();
if (!testDatabaseUrl || testDatabaseUrl === applicationDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL must be configured and distinct from DATABASE_URL.');
}
const databaseName = new URL(testDatabaseUrl).pathname.replace(/^\/+/, '');
if (!/(?:^|[_-])(test|e2e)(?:$|[_-])/i.test(databaseName)) {
  throw new Error('Refusing to seed a database that is not explicitly a test database.');
}

const child = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', './test/iam-cross-tenant.seed.ts'], {
  cwd: process.cwd(),
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
child.once('error', (error) => { throw error; });
child.once('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
