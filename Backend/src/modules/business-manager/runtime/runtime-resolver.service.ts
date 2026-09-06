import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type {
  ApplicationContextProvider,
  CapabilityProvider,
  EffectiveRuntimeManifest,
  EntitlementProvider,
  IamContextProvider,
  PackManifest,
  RuntimeContext,
  RuntimeIssue,
} from './contracts/runtime.contracts';

export const RUNTIME_PROVIDERS = {
  application: 'RUNTIME_APPLICATION_CONTEXT_PROVIDER',
  iam: 'RUNTIME_IAM_CONTEXT_PROVIDER',
  entitlement: 'RUNTIME_ENTITLEMENT_PROVIDER',
  capability: 'RUNTIME_CAPABILITY_PROVIDER',
} as const;

export interface ResolutionRecord {
  id: string;
  traceId: string;
  manifest: EffectiveRuntimeManifest;
  diagnostics: RuntimeIssue[];
  createdAt: string;
  sourceManifest: PackManifest;
  context: RuntimeContext;
}

export class RuntimeContractException extends BadRequestException {
  constructor(code: string, message: string, details: Record<string, unknown> = {}) {
    super({ error: { code, message, traceId: randomUUID(), details } });
  }
}

@Injectable()
export class RuntimeResolverService {
  private readonly resolutions = new Map<string, ResolutionRecord>();
  private readonly cache = new Map<string, EffectiveRuntimeManifest>();

  constructor(
    @Inject(RUNTIME_PROVIDERS.application) private readonly applicationProvider: ApplicationContextProvider,
    @Inject(RUNTIME_PROVIDERS.iam) private readonly iamProvider: IamContextProvider,
    @Inject(RUNTIME_PROVIDERS.entitlement) private readonly entitlementProvider: EntitlementProvider,
    @Inject(RUNTIME_PROVIDERS.capability) private readonly capabilityProvider: CapabilityProvider,
  ) {}

  async resolve(manifest: PackManifest, context: RuntimeContext) {
    this.validateContext(context);
    this.validateManifest(manifest);
    const cacheKey = this.cacheKey(manifest, context);
    const cached = this.cache.get(cacheKey);
    if (cached) return this.saveResolution(cached, manifest, context);

    const [application, iam, entitlements, capabilities] = await Promise.all([
      this.applicationProvider.resolve(context),
      this.iamProvider.resolve(context),
      this.entitlementProvider.resolve(context),
      this.capabilityProvider.resolve(context),
    ]);
    const resolvedContext = { ...context, ...application, ...iam };
    const issues: RuntimeIssue[] = [];
    if (resolvedContext.tenantId !== context.tenantId) {
      issues.push({ code: 'RUNTIME_TENANT_MISMATCH', message: 'The resolved tenant does not match the request tenant.' });
    }
    const availableCapabilities = [...new Set(capabilities.capabilities)].sort();
    const availableEntitlements = new Set(entitlements.entitlements);
    const requiredCapabilities = Object.values(manifest.capabilities).flat().sort();
    for (const dependency of manifest.dependencies.filter((item) => item.type === 'REQUIRED')) {
      if (!availableCapabilities.includes(dependency.code) && !manifest.modules.some((item) => item.code === dependency.code)) {
        issues.push({ code: 'RUNTIME_DEPENDENCY_MISSING', message: `Required dependency '${dependency.code}' is unavailable.`, details: { dependency: dependency.code } });
      }
    }
    for (const capability of requiredCapabilities) {
      if (!availableCapabilities.includes(capability)) {
        issues.push({ code: 'RUNTIME_CAPABILITY_MISSING', message: `Required capability '${capability}' is unavailable.`, details: { capability } });
      }
    }
    const modules = manifest.modules.map((module) => {
      const active = module.active !== false && !issues.some((issue) => issue.code === 'RUNTIME_DEPENDENCY_MISSING' && issue.details?.dependency === module.code);
      return { code: module.code, active, reason: active ? 'AVAILABLE' : 'DEPENDENCY_MISSING' };
    });
    const features = manifest.features.map((feature) => {
      const rule = manifest.rules.find((item) => item.featureCode === feature.code);
      const ruleMatches = !rule || this.matchesRule(rule.when, resolvedContext);
      const entitlementOk = !feature.entitlement || availableEntitlements.has(feature.entitlement);
      const capabilityOk = !feature.capability || availableCapabilities.includes(feature.capability);
      const moduleOk = !feature.moduleCode || modules.some((item) => item.code === feature.moduleCode && item.active);
      const active = feature.active !== false && ruleMatches && entitlementOk && capabilityOk && moduleOk;
      const reason = !ruleMatches ? 'RULE_NOT_MATCHED' : !entitlementOk ? 'ENTITLEMENT_MISSING' : !capabilityOk ? 'CAPABILITY_MISSING' : !moduleOk ? 'MODULE_INACTIVE' : 'RESOLVED';
      if (feature.required && !active) issues.push({ code: 'RUNTIME_RESOLUTION_BLOCKED', message: `Required feature '${feature.code}' is inactive.`, details: { feature: feature.code, reason } });
      return { code: feature.code, active, reason };
    });
    const status = issues.length ? 'BLOCKED' : 'RESOLVED';
    const effective: EffectiveRuntimeManifest = {
      contract: 'techzone.effective-runtime-manifest',
      contractVersion: '1.0',
      sourceManifest: { packCode: manifest.pack.code, packVersion: manifest.pack.version, manifestHash: manifest.manifestHash },
      context: { tenantId: context.tenantId, applicationId: context.applicationId, environment: context.environment },
      modules,
      features,
      capabilities: { available: availableCapabilities, required: requiredCapabilities },
      resolution: { status, issues },
      effectiveManifestHash: '',
    };
    effective.effectiveManifestHash = this.hash(effective);
    this.cache.set(cacheKey, effective);
    return this.saveResolution(effective, manifest, context);
  }

  getResolution(id: string) {
    const resolution = this.resolutions.get(id);
    if (!resolution) throw new NotFoundException('RUNTIME_RESOLUTION_NOT_FOUND');
    return resolution;
  }

  listResolutions() { return [...this.resolutions.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt)); }

  async retryResolution(id: string) {
    const resolution = this.getResolution(id);
    return this.resolve(resolution.sourceManifest, resolution.context);
  }

  compareResolutions(leftId: string, rightId: string) {
    const left = this.getResolution(leftId);
    const right = this.getResolution(rightId);
    if (left.context.tenantId !== right.context.tenantId) throw new BadRequestException('RUNTIME_COMPARE_NOT_ALLOWED');
    return {
      left: { resolutionId: left.id, traceId: left.traceId, manifestHash: left.manifest.effectiveManifestHash },
      right: { resolutionId: right.id, traceId: right.traceId, manifestHash: right.manifest.effectiveManifestHash },
      modules: this.compareItems(left.manifest.modules, right.manifest.modules),
      features: this.compareItems(left.manifest.features, right.manifest.features),
      capabilities: this.compareItems(left.manifest.capabilities.available, right.manifest.capabilities.available),
    };
  }

  cacheStats() { return { entries: this.cache.size, health: 'UP', hitRate: null, staleEntries: 0, invalidations: 0 }; }

  invalidateCache() {
    const count = this.cache.size;
    this.cache.clear();
    return { invalidated: count };
  }

  private saveResolution(manifest: EffectiveRuntimeManifest, sourceManifest: PackManifest, context: RuntimeContext) {
    const id = randomUUID();
    const record = { id, traceId: randomUUID(), manifest, diagnostics: manifest.resolution.issues, createdAt: new Date().toISOString(), sourceManifest, context };
    this.resolutions.set(id, record);
    return { resolutionId: id, traceId: record.traceId, ...manifest };
  }

  private compareItems(left: unknown, right: unknown) {
    const leftItems = Array.isArray(left) ? left : Object.keys(left as Record<string, unknown>);
    const rightItems = Array.isArray(right) ? right : Object.keys(right as Record<string, unknown>);
    const key = (item: unknown) => typeof item === 'string' ? item : JSON.stringify(item);
    const leftKeys = new Set(leftItems.map(key));
    const rightKeys = new Set(rightItems.map(key));
    return { added: [...rightKeys].filter((item) => !leftKeys.has(item)), removed: [...leftKeys].filter((item) => !rightKeys.has(item)), unchanged: [...leftKeys].filter((item) => rightKeys.has(item)) };
  }

  private validateContext(context: RuntimeContext) {
    if (!context?.tenantId || !context.applicationId || !context.environment) throw new RuntimeContractException('RUNTIME_CONTEXT_INVALID', 'tenantId, applicationId and environment are required.');
  }

  private validateManifest(manifest: PackManifest) {
    if (manifest?.contract !== 'techzone.pack-manifest' || !manifest.contractVersion || !manifest.pack?.code || !manifest.pack.version) throw new RuntimeContractException('RUNTIME_MANIFEST_INVALID', 'The Pack Manifest structure is invalid.');
    const expectedHash = this.hash({ ...manifest, manifestHash: undefined });
    if (manifest.manifestHash !== expectedHash) throw new RuntimeContractException('RUNTIME_MANIFEST_HASH_INVALID', 'The Pack Manifest hash is invalid.');
  }

  private cacheKey(manifest: PackManifest, context: RuntimeContext) {
    return this.hash({ manifestHash: manifest.manifestHash, tenantId: context.tenantId, applicationId: context.applicationId, environment: context.environment, contextRevision: context.contextRevision, entitlementRevision: context.entitlementRevision, capabilityRevision: context.capabilityRevision });
  }

  private matchesRule(when: Record<string, unknown> | undefined, context: RuntimeContext) {
    return !when || Object.entries(when).every(([key, expected]) => (context as unknown as Record<string, unknown>)[key] === expected);
  }

  private hash(value: unknown) {
    return `sha256:${createHash('sha256').update(JSON.stringify(this.sortObject(value))).digest('hex')}`;
  }

  private sortObject(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sortObject(item));
    if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).sort().reduce((result, key) => ({ ...result, [key]: this.sortObject((value as Record<string, unknown>)[key]) }), {});
    return value;
  }
}