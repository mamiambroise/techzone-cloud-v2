import type { DatabaseTarget, SeedEnvironment } from './types.js';

export function assertSafeDatabaseTarget(environment: SeedEnvironment, target: DatabaseTarget) {
  const text = `${target.host}/${target.database}`.toLowerCase();
  if (/(^|[_-])(prod|production)([_-]|$)/.test(text)) throw new Error('REFUSED: production seeding is forbidden');
  if ((environment === 'test' || environment === 'e2e') && !/(^|[_-])(test|e2e)([_-]|$)/.test(target.database.toLowerCase())) {
    throw new Error(`REFUSED: ${environment} must target a database named test/e2e, got ${target.database}`);
  }
  if (environment === 'staging' && !/(stag|stage)/.test(target.database.toLowerCase())) {
    throw new Error(`REFUSED: staging must target an explicitly staging database, got ${target.database}`);
  }
}

export function printTarget(environment: SeedEnvironment, target: DatabaseTarget, mode: string) {
  console.log(`Environment : ${environment}\nHost : ${target.host}\nPort : ${target.port}\nDatabase : ${target.database}\nSchema : ${target.schema}\nMode : ${mode}`);
}
