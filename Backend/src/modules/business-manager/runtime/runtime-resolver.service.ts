import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import type {
  ApplicationContextProvider,
  CapabilityProvider,
  EffectiveRuntimeManifest,
  EntitlementProvider,
  IamContextProvider,
  PackManifest,
  PackManifestFeature,
  PackManifestModule,
  RuntimeContext,
  RuntimeIssue,
  RuntimeResolutionItem,
  RuntimeRuleDecision,
} from './contracts/runtime.contracts';
import { CapabilityDependencyResolverService } from './capability-dependency-resolver.service';

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
    private readonly capabilityDependencyResolver: CapabilityDependencyResolverService,
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
    const capabilityDependencyResolution = await this.capabilityDependencyResolver.resolve(manifest, context);
    const resolvedContext = { ...context, ...application, ...iam };
    const issues: RuntimeIssue[] = [];
    if (resolvedContext.tenantId !== context.tenantId) issues.push({ code: 'RUNTIME_TENANT_MISMATCH', message: 'The resolved tenant does not match the request tenant.' });

    const availableCapabilities = new Set(capabilityDependencyResolution.capabilities.filter((item) => ['AVAILABLE', 'DEGRADED'].includes(item.state)).map((item) => item.code));
    const availableEntitlements = new Set(entitlements.entitlements ?? []);
    const permissions = new Set(resolvedContext.permissions ?? []);
    const decisions = resolvedContext.ruleDecisions ?? [];
    const moduleMap = new Map<string, RuntimeResolutionItem & { features: number; activeFeatures: number; blockedFeatures: number }>();
    const featureMap = new Map<string, RuntimeResolutionItem & { moduleCode?: string; dependencyState: string; capabilityState: string; ruleDecisions: RuntimeRuleDecision[] }>();
    const moduleDefinitions = this.sortDefinitions(manifest.modules);
    const featureDefinitions = this.sortDefinitions(manifest.features);
    const moduleCodes = new Set(moduleDefinitions.map((item) => item.code));
    const featureCodes = new Set(featureDefinitions.map((item) => item.code));

    for (const dependency of manifest.dependencies ?? []) {
      const target = dependency.targetRef ?? dependency.code;
      if (dependency.targetType === 'FEATURE' && !featureCodes.has(target)) issues.push({ code: 'RUNTIME_FEATURE_REFERENCE_INVALID', message: `Feature '${target}' is not declared.`, details: { feature: target } });
      if (dependency.targetType === 'MODULE' && !moduleCodes.has(target)) issues.push({ code: 'RUNTIME_MODULE_REFERENCE_INVALID', message: `Module '${target}' is not declared.`, details: { module: target } });
    }

    const moduleOrder = this.topologicalOrder(moduleDefinitions, (module) => module.dependencies ?? [], moduleCodes, issues);
    for (const code of moduleOrder) {
      const module = moduleDefinitions.find((item) => item.code === code)!;
      const moduleRules = this.rulesFor('MODULE', module.code, manifest, decisions, resolvedContext);
      const requiredCapabilities = [...(manifest.capabilities[module.code] ?? []), ...(module.capabilities ?? [])];
      const missingCapability = requiredCapabilities.find((item) => !availableCapabilities.has(item));
      const missingDependency = (module.dependencies ?? []).find((item) => !moduleMap.get(item)?.active);
      const environmentAllowed = !module.environments?.length || module.environments.includes(context.environment);
      const conflict = this.hasConflict(module.code, moduleMap, manifest);
      const item = this.resolveModule(module, moduleRules, { missingCapability, missingDependency, environmentAllowed, conflict });
      moduleMap.set(module.code, { ...item, features: 0, activeFeatures: 0, blockedFeatures: 0 });
      if (missingCapability) issues.push({ code: 'RUNTIME_CAPABILITY_MISSING', message: `Required capability '${missingCapability}' is unavailable.`, details: { capability: missingCapability, module: module.code } });
      if (missingDependency) issues.push({ code: 'RUNTIME_DEPENDENCY_MISSING', message: `Required dependency '${missingDependency}' is unavailable.`, details: { dependency: missingDependency, module: module.code } });
      if (item.state === 'BLOCKED') issues.push(this.issueFor('RUNTIME_MODULE_BLOCKED', module.code, item.reasonCode, item.details));
    }

    for (const feature of featureDefinitions) {
      const module = feature.moduleCode ? moduleMap.get(feature.moduleCode) : undefined;
      const featureRules = this.rulesFor('FEATURE', feature.code, manifest, decisions, resolvedContext);
      const requiredCapabilities = [feature.capability, ...(feature.capabilities ?? [])].filter((value): value is string => Boolean(value));
      const missingCapability = requiredCapabilities.find((item) => !availableCapabilities.has(item));
      const missingOptionalCapability = (feature.optionalCapabilities ?? []).find((item) => !availableCapabilities.has(item));
      const missingDependency = (feature.dependencies ?? []).find((item) => !this.isResolvedReference(item, moduleMap, featureMap));
      const requiredPermissions = [feature.requiredPermission, ...(feature.requiredPermissions ?? [])].filter((item): item is string => Boolean(item));
      const missingPermission = requiredPermissions.find((item) => !permissions.has(item));
      const environmentAllowed = !feature.environments?.length || feature.environments.includes(context.environment);
      const entitlementOk = !feature.entitlement || availableEntitlements.has(feature.entitlement);
      const item = this.resolveFeature(feature, featureRules, { missingCapability, missingOptionalCapability, missingDependency, missingPermission, environmentAllowed, entitlementOk, moduleInactive: Boolean(feature.moduleCode && (!module || !module.active)) });
      featureMap.set(feature.code, { ...item, moduleCode: feature.moduleCode, dependencyState: missingDependency ? 'MISSING' : 'RESOLVED', capabilityState: missingCapability ? 'MISSING' : missingOptionalCapability ? 'DEGRADED' : 'RESOLVED', ruleDecisions: featureRules });
      if (feature.moduleCode && moduleMap.has(feature.moduleCode)) {
        const parent = moduleMap.get(feature.moduleCode)!;
        parent.features += 1;
        if (item.active) parent.activeFeatures += 1;
        if (item.state === 'BLOCKED') parent.blockedFeatures += 1;
      }
      if (item.state === 'BLOCKED') issues.push(this.issueFor('RUNTIME_FEATURE_BLOCKED', feature.code, item.reasonCode, item.details));
    }

    const modules = [...moduleMap.values()];
    const features = [...featureMap.values()];
    const summary = { modules: this.countStates(modules), features: this.countStates(features) };
    const status = capabilityDependencyResolution.blocking || issues.some((issue) => issue.code.includes('BLOCKED') || issue.code.includes('MISSING') || issue.code.includes('INVALID')) ? 'BLOCKED' : features.some((item) => item.state === 'DEGRADED') || capabilityDependencyResolution.summary.capabilities.degraded > 0 ? 'DEGRADED' : 'RESOLVED';
    issues.push(...capabilityDependencyResolution.issues);
    const effective: EffectiveRuntimeManifest = {
      contract: 'techzone.effective-runtime-manifest',
      contractVersion: '1.0',
      sourceManifest: { packCode: manifest.pack.code, packVersion: manifest.pack.version, manifestHash: manifest.manifestHash },
      context: { tenantId: context.tenantId, applicationId: context.applicationId, environment: context.environment },
      modules,
      features,
      capabilities: { available: [...availableCapabilities].sort(), required: [...new Set(Object.values(manifest.capabilities).flat())].sort() },
      capabilityDependencyResolution,
      resolution: { status, issues },
      summary,
      effectiveManifestHash: '',
    };
    effective.effectiveManifestHash = this.hash(effective);
    this.cache.set(cacheKey, effective);
    return this.saveResolution(effective, manifest, context);
  }

  getResolution(id: string) { const resolution = this.resolutions.get(id); if (!resolution) throw new NotFoundException('RUNTIME_RESOLUTION_NOT_FOUND'); return resolution; }
  getModules(id: string) { return this.getResolution(id).manifest.modules; }
  getFeatures(id: string) { return this.getResolution(id).manifest.features; }
  explainFeature(id: string, featureRef: string) { const feature = this.getFeatures(id).find((item) => item.code === featureRef); if (!feature) throw new NotFoundException('RUNTIME_FEATURE_NOT_FOUND'); return { featureRef, ...feature, explanation: Object.entries(feature.details).map(([key, value]) => ({ key, value })) }; }
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
  listResolutions() { return [...this.resolutions.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt)); }
  async retryResolution(id: string) { const resolution = this.getResolution(id); return this.resolve(resolution.sourceManifest, resolution.context); }
  cacheStats() { return { entries: this.cache.size, health: 'UP', hitRate: null, staleEntries: 0, invalidations: 0 }; }
  invalidateCache() { const count = this.cache.size; this.cache.clear(); return { invalidated: count }; }

  private resolveModule(definition: PackManifestModule, rules: RuntimeRuleDecision[], checks: { missingCapability?: string; missingDependency?: string; environmentAllowed: boolean; conflict: boolean }): RuntimeResolutionItem {
    if (checks.missingDependency) return this.item(definition.code, 'BLOCKED', 'DEPENDENCY_MISSING', { dependency: checks.missingDependency });
    if (checks.missingCapability) return this.item(definition.code, 'BLOCKED', 'CAPABILITY_MISSING', { capability: checks.missingCapability });
    if (!checks.environmentAllowed) return this.item(definition.code, 'UNAVAILABLE', 'ENVIRONMENT_NOT_ALLOWED', { environments: definition.environments });
    if (checks.conflict) return this.item(definition.code, 'BLOCKED', 'CONFLICT', {});
    if (rules.some((rule) => ['DISABLE', 'DENY', 'HIDE'].includes(rule.effect) && rule.matched)) return this.item(definition.code, 'INACTIVE', 'RULE_MATCHED', { rules });
    if (!this.declaredEnabled(definition)) return this.item(definition.code, 'INACTIVE', 'DECLARED_DISABLED', {});
    return this.item(definition.code, 'ACTIVE', rules.some((rule) => rule.matched) ? 'RULE_MATCHED' : 'DECLARED_ENABLED', { rules });
  }

  private resolveFeature(definition: PackManifestFeature, rules: RuntimeRuleDecision[], checks: { missingCapability?: string; missingOptionalCapability?: string; missingDependency?: string; missingPermission?: string; environmentAllowed: boolean; entitlementOk: boolean; moduleInactive: boolean }) {
    if (checks.moduleInactive) return this.item(definition.code, 'BLOCKED', 'MODULE_INACTIVE', { module: definition.moduleCode });
    if (checks.missingDependency) return this.item(definition.code, 'BLOCKED', 'DEPENDENCY_MISSING', { dependency: checks.missingDependency });
    if (checks.missingCapability) return this.item(definition.code, 'BLOCKED', 'CAPABILITY_MISSING', { capability: checks.missingCapability });
    if (checks.missingPermission) return this.item(definition.code, definition.visibility === 'PUBLIC' ? 'INACTIVE' : 'HIDDEN', 'PERMISSION_MISSING', { permission: checks.missingPermission });
    if (!checks.environmentAllowed) return this.item(definition.code, 'UNAVAILABLE', 'ENVIRONMENT_NOT_ALLOWED', { environments: definition.environments });
    if (!checks.entitlementOk) return this.item(definition.code, 'INACTIVE', 'ENTITLEMENT_MISSING', { requiredEntitlement: definition.entitlement });
    if (rules.some((rule) => ['DISABLE', 'DENY'].includes(rule.effect) && rule.matched)) return this.item(definition.code, 'INACTIVE', 'RULE_MATCHED', { rules });
    if (definition.visibility === 'HIDDEN' || rules.some((rule) => rule.effect === 'HIDE' && rule.matched)) return this.item(definition.code, 'HIDDEN', 'RULE_MATCHED', { rules });
    if (!this.declaredEnabled(definition)) return this.item(definition.code, 'INACTIVE', 'DECLARED_DISABLED', {});
    if (checks.missingOptionalCapability) return this.item(definition.code, 'DEGRADED', 'CAPABILITY_MISSING', { capability: checks.missingOptionalCapability });
    return this.item(definition.code, 'ACTIVE', rules.some((rule) => rule.matched) ? 'RULE_MATCHED' : 'DECLARED_ENABLED', { rules });
  }

  private item(code: string, state: RuntimeResolutionItem['state'], reasonCode: RuntimeResolutionItem['reasonCode'], details: Record<string, unknown>): RuntimeResolutionItem { return { code, state, reasonCode, reason: reasonCode, active: state === 'ACTIVE', details }; }
  private declaredEnabled(definition: { active?: boolean; enabled?: boolean; defaultEnabled?: boolean }) { return definition.active ?? definition.enabled ?? definition.defaultEnabled ?? true; }
  private rulesFor(targetType: 'MODULE' | 'FEATURE', targetRef: string, manifest: PackManifest, decisions: RuntimeRuleDecision[], context: RuntimeContext) { const supplied = decisions.filter((rule) => rule.targetType === targetType && rule.targetRef === targetRef); if (supplied.length) return supplied; return manifest.rules.filter((rule) => (targetType === 'FEATURE' ? rule.featureCode === targetRef : rule.moduleCode === targetRef)).map((rule) => ({ targetType, targetRef, effect: rule.effect ?? 'ENABLE', matched: this.matchesRule(rule.when, context), ruleCode: rule.code })); }
  private isResolvedReference(code: string, modules: Map<string, RuntimeResolutionItem>, features: Map<string, RuntimeResolutionItem>) { return modules.get(code)?.active ?? features.get(code)?.active ?? false; }
  private hasConflict(code: string, modules: Map<string, RuntimeResolutionItem>, manifest: PackManifest) { return (manifest.dependencies ?? []).some((dependency) => dependency.type === 'CONFLICTS_WITH' && dependency.code === code && modules.get(dependency.targetRef ?? '')?.active); }
  private topologicalOrder(definitions: PackManifestModule[], dependencies: (definition: PackManifestModule) => string[], known: Set<string>, issues: RuntimeIssue[]) { const result: string[] = []; const visiting = new Set<string>(); const visited = new Set<string>(); const visit = (code: string) => { if (visiting.has(code)) { issues.push({ code: 'RUNTIME_DEPENDENCY_CYCLE', message: `Dependency cycle includes '${code}'.` }); return; } if (visited.has(code)) return; visiting.add(code); const definition = definitions.find((item) => item.code === code); for (const dependency of definition ? dependencies(definition) : []) if (known.has(dependency)) visit(dependency); visiting.delete(code); visited.add(code); result.push(code); }; for (const definition of definitions) visit(definition.code); return result; }
  private countStates(items: Array<{ state: string }>) { return items.reduce<Record<string, number>>((result, item) => { result[item.state.toLowerCase()] = (result[item.state.toLowerCase()] ?? 0) + 1; result.total = (result.total ?? 0) + 1; return result; }, {}); }
  private compareItems(left: unknown, right: unknown) { const leftItems = Array.isArray(left) ? left : Object.keys(left as Record<string, unknown>); const rightItems = Array.isArray(right) ? right : Object.keys(right as Record<string, unknown>); const key = (item: unknown) => typeof item === 'string' ? item : JSON.stringify(item); const leftKeys = new Set(leftItems.map(key)); const rightKeys = new Set(rightItems.map(key)); return { added: [...rightKeys].filter((item) => !leftKeys.has(item)), removed: [...leftKeys].filter((item) => !rightKeys.has(item)), unchanged: [...leftKeys].filter((item) => rightKeys.has(item)) }; }
  private issueFor(code: string, target: string, reasonCode: string, details: Record<string, unknown>) { return { code, message: `${target} resolved as ${reasonCode}.`, details: { target, reasonCode, ...details } }; }
  private validateContext(context: RuntimeContext) { if (!context?.tenantId || !context.applicationId || !context.environment) throw new RuntimeContractException('RUNTIME_CONTEXT_INVALID', 'tenantId, applicationId and environment are required.'); }
  private validateManifest(manifest: PackManifest) { if (manifest?.contract !== 'techzone.pack-manifest' || !manifest.contractVersion || !manifest.pack?.code || !manifest.pack.version) throw new RuntimeContractException('RUNTIME_MANIFEST_INVALID', 'The Pack Manifest structure is invalid.'); const expectedHash = this.hash({ ...manifest, manifestHash: undefined }); if (manifest.manifestHash !== expectedHash) throw new RuntimeContractException('RUNTIME_MANIFEST_HASH_INVALID', 'The Pack Manifest hash is invalid.'); const modules = manifest.modules ?? []; const features = manifest.features ?? []; if (new Set(modules.map((item) => item.code)).size !== modules.length) throw new RuntimeContractException('RUNTIME_MODULE_DUPLICATE', 'Duplicate module definition.'); if (new Set(features.map((item) => item.code)).size !== features.length) throw new RuntimeContractException('RUNTIME_FEATURE_DUPLICATE', 'Duplicate feature definition.'); }
  private sortDefinitions<T extends { code: string; displayOrder?: number }>(items: T[]) { return [...items].sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0) || left.code.localeCompare(right.code)); }
  private cacheKey(manifest: PackManifest, context: RuntimeContext) { return this.hash({ manifestHash: manifest.manifestHash, tenantId: context.tenantId, applicationId: context.applicationId, environment: context.environment, contextRevision: context.contextRevision, entitlementRevision: context.entitlementRevision, capabilityRevision: context.capabilityRevision, ruleRevision: context.ruleRevision }); }
  private matchesRule(when: Record<string, unknown> | undefined, context: RuntimeContext) { return !when || Object.entries(when).every(([key, expected]) => (context as unknown as Record<string, unknown>)[key] === expected); }
  private hash(value: unknown) { return `sha256:${createHash('sha256').update(JSON.stringify(this.sortObject(value))).digest('hex')}`; }
  private sortObject(value: unknown): unknown { if (Array.isArray(value)) return value.map((item) => this.sortObject(item)); if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).sort().reduce((result, key) => ({ ...result, [key]: this.sortObject((value as Record<string, unknown>)[key]) }), {}); return value; }
  private saveResolution(manifest: EffectiveRuntimeManifest, sourceManifest: PackManifest, context: RuntimeContext) { const id = randomUUID(); const record = { id, traceId: randomUUID(), manifest, diagnostics: manifest.resolution.issues, createdAt: new Date().toISOString(), sourceManifest, context }; this.resolutions.set(id, record); return { resolutionId: id, traceId: record.traceId, ...manifest }; }
}
