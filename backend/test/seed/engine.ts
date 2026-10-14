import type { PrismaService } from '../../src/prisma/prisma.service.js';
import { MODULE_HANDLERS } from './modules.js';
import type { SeedModule, SeedOptions, SeedProfile } from './types.js';

const profileModules: Record<SeedProfile, SeedModule[]> = {
  minimal: ['common', 'iam', 'tenant', 'environment'],
  security: ['common', 'iam', 'tenant', 'environment', 'ui-builder'],
  standard: ['common', 'iam', 'tenant', 'environment', 'business-manager', 'registry', 'pack-manager', 'data', 'ui-builder', 'automation'],
  full: ['common', 'iam', 'tenant', 'environment', 'business-manager', 'registry', 'pack-manager', 'pack-runtime', 'data', 'ui-builder', 'automation', 'integration-hub', 'api-manager', 'billing', 'administration', 'observability', 'deployment'],
  demo: ['common', 'iam', 'tenant', 'environment', 'business-manager', 'registry', 'pack-manager', 'pack-runtime', 'data', 'ui-builder', 'automation', 'integration-hub', 'api-manager', 'billing', 'administration', 'observability', 'deployment'],
};

const dependencies: Partial<Record<SeedModule, SeedModule[]>> = {
  iam: ['common'], tenant: ['common'], environment: ['common'], 'business-manager': ['common'], registry: ['common'], 'pack-manager': ['common', 'business-manager'], 'pack-runtime': ['pack-manager'], data: ['business-manager'], 'ui-builder': ['business-manager'], automation: ['business-manager'], deployment: ['environment', 'business-manager'], billing: ['common'], observability: ['iam'],
};

export function resolveModules(options: SeedOptions): SeedModule[] {
  const requested = options.modules.length ? options.modules : profileModules[options.profile];
  const resolved = new Set<SeedModule>();
  const visit = (module: SeedModule) => {
    for (const dependency of dependencies[module] ?? []) visit(dependency);
    resolved.add(module);
  };
  requested.forEach(visit);
  return [...resolved];
}

export async function executeSeed(prisma: PrismaService, options: SeedOptions) {
  const modules = resolveModules(options);
  const results = [];
  for (const module of modules) results.push(await MODULE_HANDLERS[module](prisma, options.dryRun));
  return results;
}
