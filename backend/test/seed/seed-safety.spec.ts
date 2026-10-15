import { assertSafeDatabaseTarget } from './database-guard.js';
import { parseSeedOptions, resolveDatabaseTarget } from './env-selector.js';

describe('global seed safety', () => {
  const originalTestUrl = process.env.TEST_DATABASE_URL;
  const originalDevUrl = process.env.DEV_DATABASE_URL;

  afterEach(() => {
    process.env.TEST_DATABASE_URL = originalTestUrl;
    process.env.DEV_DATABASE_URL = originalDevUrl;
  });

  it('refuses production aliases before resolving a database', () => {
    expect(() => parseSeedOptions(['--env=production'])).toThrow('REFUSED: production seeding is forbidden');
    expect(() => parseSeedOptions(['--env=prod'])).toThrow('REFUSED: production seeding is forbidden');
  });

  it('uses TEST_DATABASE_URL for test and reports only parsed target fields', () => {
    process.env.TEST_DATABASE_URL = 'postgresql://seed_user:secret@127.0.0.1:55432/techzone_test?schema=business_manager';
    const target = resolveDatabaseTarget('test', false);
    expect(target).toMatchObject({ variable: 'TEST_DATABASE_URL', host: '127.0.0.1', port: '55432', database: 'techzone_test', schema: 'business_manager' });
  });

  it('does not silently use DATABASE_URL for development', () => {
    delete process.env.DEV_DATABASE_URL;
    expect(() => resolveDatabaseTarget('dev', false)).toThrow('DEV_DATABASE_URL is required');
  });

  it('refuses a test profile pointed to a non-test database', () => {
    expect(() => assertSafeDatabaseTarget('test', {
      variable: 'TEST_DATABASE_URL', url: 'postgresql://host/app', host: 'host', port: '5432', database: 'app', schema: 'public',
    })).toThrow('must target a database named test/e2e');
  });
});
