import 'dotenv/config';
import { config as loadEnv } from 'dotenv';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { SEED_ENVIRONMENTS, SEED_MODULES, SEED_PROFILES, type DatabaseTarget, type SeedEnvironment, type SeedModule, type SeedOptions, type SeedProfile } from './types.js';

loadEnv({ path: '.env.local', override: false, quiet: true });

const blocked = new Set(['prod', 'production']);

export function parseSeedOptions(argv: string[]): Omit<SeedOptions, 'environment'> & { environment?: SeedEnvironment } {
  const option = (name: string) => argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const rawEnvironment = option('env')?.toLowerCase();
  if (rawEnvironment && blocked.has(rawEnvironment)) throw new Error('REFUSED: production seeding is forbidden');
  if (rawEnvironment && !SEED_ENVIRONMENTS.includes(rawEnvironment as SeedEnvironment)) throw new Error(`Unknown seed environment: ${rawEnvironment}`);
  const rawProfile = option('profile') ?? 'standard';
  if (!SEED_PROFILES.includes(rawProfile as SeedProfile)) throw new Error(`Unknown seed profile: ${rawProfile}`);
  const requested = option('modules')?.split(',').filter(Boolean) ?? [];
  const modules = requested.length === 0 || requested.includes('all')
    ? []
    : requested.map((module) => {
        if (!SEED_MODULES.includes(module as SeedModule)) throw new Error(`Unknown seed module: ${module}`);
        return module as SeedModule;
      });
  return {
    environment: rawEnvironment as SeedEnvironment | undefined,
    profile: rawProfile as SeedProfile,
    modules,
    dryRun: argv.includes('--dry-run'),
    yes: argv.includes('--yes'),
    allowDatabaseUrl: argv.includes('--allow-database-url'),
  };
}

export async function selectEnvironment(): Promise<SeedEnvironment> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question('Choisir l\'environnement de seed :\n\n1. TEST\n2. E2E\n3. DEV\n4. DEMO\n5. STAGING\n\n> ');
    const choices: Record<string, SeedEnvironment> = { '1': 'test', '2': 'e2e', '3': 'dev', '4': 'demo', '5': 'staging' };
    if (!choices[answer.trim()]) throw new Error('Invalid environment selection');
    return choices[answer.trim()];
  } finally {
    rl.close();
  }
}

export function resolveDatabaseTarget(environment: SeedEnvironment, allowDatabaseUrl: boolean): DatabaseTarget {
  const variables: Record<SeedEnvironment, string[]> = {
    test: ['TEST_DATABASE_URL'],
    e2e: ['E2E_DATABASE_URL', 'TEST_DATABASE_URL'],
    dev: ['DEV_DATABASE_URL'],
    demo: ['DEMO_DATABASE_URL'],
    staging: ['STAGING_DATABASE_URL'],
  };
  const candidates = [...variables[environment]];
  if (environment === 'dev' && allowDatabaseUrl) candidates.push('DATABASE_URL');
  const variable = candidates.find((name) => Boolean(process.env[name]?.trim()));
  if (!variable) throw new Error(`REFUSED: ${variables[environment].join(' or ')} is required for --env=${environment}${environment === 'dev' ? ' (DATABASE_URL requires --allow-database-url)' : ''}`);
  const url = process.env[variable]!.trim();
  const parsed = new URL(url);
  return {
    variable,
    url,
    host: parsed.hostname,
    port: parsed.port || '5432',
    database: decodeURIComponent(parsed.pathname.split('/').filter(Boolean).join('/')),
    schema: parsed.searchParams.get('schema') || 'public',
  };
}
