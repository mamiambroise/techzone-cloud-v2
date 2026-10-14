export const SEED_ENVIRONMENTS = ['test', 'e2e', 'dev', 'demo', 'staging'] as const;
export const SEED_PROFILES = ['minimal', 'security', 'standard', 'full', 'demo'] as const;
export const SEED_MODULES = [
  'common', 'iam', 'tenant', 'environment', 'deployment', 'business-manager',
  'registry', 'pack-manager', 'pack-runtime', 'data', 'ui-builder', 'automation',
  'integration-hub', 'api-manager', 'billing', 'administration', 'observability',
] as const;

export type SeedEnvironment = (typeof SEED_ENVIRONMENTS)[number];
export type SeedProfile = (typeof SEED_PROFILES)[number];
export type SeedModule = (typeof SEED_MODULES)[number];

export type SeedOptions = {
  environment: SeedEnvironment;
  profile: SeedProfile;
  modules: SeedModule[];
  dryRun: boolean;
  yes: boolean;
  allowDatabaseUrl: boolean;
};

export type DatabaseTarget = {
  variable: string;
  url: string;
  host: string;
  port: string;
  database: string;
  schema: string;
};
