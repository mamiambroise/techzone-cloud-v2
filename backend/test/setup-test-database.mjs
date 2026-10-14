import 'dotenv/config';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import pg from 'pg';

const { Client } = pg;
const TEST_DATABASE_NAME = 'techzone_test';
const envPath = resolve(process.cwd(), '.env');

function withoutCredentials(connectionUrl) {
  const safeUrl = new URL(connectionUrl);
  safeUrl.username = safeUrl.username ? '***' : '';
  safeUrl.password = safeUrl.password ? '***' : '';
  return safeUrl.toString();
}

function testDatabaseUrl(databaseUrl) {
  const testUrl = new URL(databaseUrl);
  testUrl.pathname = `/${TEST_DATABASE_NAME}`;
  return testUrl;
}

function maintenanceDatabaseUrl(databaseUrl) {
  const maintenanceUrl = new URL(databaseUrl);
  maintenanceUrl.pathname = '/postgres';
  maintenanceUrl.searchParams.delete('schema');
  return maintenanceUrl;
}

async function databaseExists(connectionUrl) {
  const client = new Client({ connectionString: connectionUrl.toString() });
  await client.connect();
  try {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [TEST_DATABASE_NAME],
    );
    return result.rowCount === 1;
  } finally {
    await client.end();
  }
}

async function createDatabase(connectionUrl) {
  const client = new Client({ connectionString: connectionUrl.toString() });
  await client.connect();
  try {
    // The name is a fixed constant, never provided by user input.
    await client.query(`CREATE DATABASE ${TEST_DATABASE_NAME}`);
  } finally {
    await client.end();
  }
}

async function verifyTestConnection(connectionUrl) {
  const client = new Client({ connectionString: connectionUrl.toString() });
  await client.connect();
  try {
    const result = await client.query('SELECT current_database() AS database_name');
    if (result.rows[0]?.database_name !== TEST_DATABASE_NAME) {
      throw new Error('The connection did not reach techzone_test.');
    }
  } finally {
    await client.end();
  }
}

async function writeTestDatabaseUrl(connectionUrl) {
  const envContents = await readFile(envPath, 'utf8');
  const lines = envContents.split(/\r?\n/);
  const testLine = `TEST_DATABASE_URL=${connectionUrl.toString()}`;
  const existingIndex = lines.findIndex((line) => line.startsWith('TEST_DATABASE_URL='));

  if (existingIndex >= 0) {
    lines[existingIndex] = testLine;
  } else {
    if (lines.at(-1) === '') lines.pop();
    lines.push(testLine);
  }

  await writeFile(envPath, `${lines.join('\n')}\n`, 'utf8');
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required in backend/.env.');
}

const sourceUrl = new URL(databaseUrl);
if (sourceUrl.pathname.replace(/^\//, '') === TEST_DATABASE_NAME) {
  throw new Error('DATABASE_URL must not point to techzone_test.');
}

const testUrl = testDatabaseUrl(databaseUrl);
const maintenanceUrl = maintenanceDatabaseUrl(databaseUrl);

if (await databaseExists(maintenanceUrl)) {
  console.log(`Base ${TEST_DATABASE_NAME}: existante`);
} else {
  await createDatabase(maintenanceUrl);
  console.log(`Base ${TEST_DATABASE_NAME}: créée`);
}

await verifyTestConnection(testUrl);
await writeTestDatabaseUrl(testUrl);
console.log(`Connexion ${TEST_DATABASE_NAME}: PASS (${withoutCredentials(testUrl)})`);
console.log('TEST_DATABASE_URL configurée dans backend/.env (identifiants masqués).');
