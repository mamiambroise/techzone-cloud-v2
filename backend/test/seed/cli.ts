import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { PrismaService } from '../../src/prisma/prisma.service.js';
import { cleanupGlobalSeed } from './cleanup.js';
import { assertSafeDatabaseTarget, printTarget } from './database-guard.js';
import { parseSeedOptions, resolveDatabaseTarget, selectEnvironment } from './env-selector.js';
import { executeSeed, resolveModules } from './engine.js';
import { SEED_ENVIRONMENTS, SEED_MODULES, SEED_PROFILES, type SeedOptions } from './types.js';

async function confirm(options: SeedOptions) {
  if (options.environment === 'test' || options.environment === 'e2e' || options.yes) return true;
  const rl = createInterface({ input: stdin, output: stdout });
  try { return (await rl.question('Confirmation requise pour cet environnement (yes/no) : ')).trim().toLowerCase() === 'yes'; } finally { rl.close(); }
}

export async function runSeedCli(argv = process.argv.slice(2)) {
  if (argv.includes('--list')) {
    console.log(`Environments: ${SEED_ENVIRONMENTS.join(', ')}\nProfiles: ${SEED_PROFILES.join(', ')}\nModules: ${SEED_MODULES.join(', ')}`);
    return;
  }
  const cleanup = argv.includes('--cleanup');
  const parsed = parseSeedOptions(argv);
  const environment = parsed.environment ?? await selectEnvironment();
  const options: SeedOptions = { ...parsed, environment };
  const target = resolveDatabaseTarget(environment, options.allowDatabaseUrl);
  assertSafeDatabaseTarget(environment, target);
  printTarget(environment, target, options.dryRun ? 'DRY_RUN' : cleanup ? 'CLEANUP' : 'SEED');
  if (!(await confirm(options))) throw new Error('Seed cancelled: confirmation was not granted');
  if (options.dryRun) {
    console.log(JSON.stringify({ cleanup, modules: cleanup ? [] : resolveModules(options), writes: false }, null, 2));
    return;
  }
  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = target.url;
  const prisma = new PrismaService();
  await prisma.onModuleInit();
  try {
    if (cleanup) console.log(await cleanupGlobalSeed(prisma, false));
    else for (const result of await executeSeed(prisma, options)) console.log(`${result.module}: ${result.status} — ${result.detail}`);
  } finally {
    await prisma.onModuleDestroy();
    process.env.DATABASE_URL = previous;
  }
}

void runSeedCli().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
