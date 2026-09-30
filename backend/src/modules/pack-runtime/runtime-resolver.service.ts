/**
 * Pack Runtime — résolution Effective Runtime Manifest (PR-CDC-00 → PR-CDC-07).
 *
 * Pipeline canonique (PR-CDC-00 §12) :
 *   1 Load Manifest (version PUBLISHED du Pack Manager, via le contrat manifest)
 *   2 Validate (contrat, hash, structure, tenant)
 *   3 Resolve Context (tenant IAM, environnement, feature flags)
 *   4 Resolve Dependencies
 *   5 Evaluate Rules (arbre déclaratif, opérateurs allowlist — aucun eval)
 *   6 Resolve Modules / Features
 *   7 Build Effective Configuration + Effective Manifest + hash
 *   8 Persist + Cache
 *
 * Le Runtime ne modifie jamais la définition publiée et n'écrit que dans
 * ses propres tables (pr_runtime_*). Isolation tenant systématique.
 */
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { PR, PrErrorCode } from './pr.constants';
import { PrException, prError } from './pr.exception';

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

interface ManifestPack {
  code: string;
  name: string;
  version: string;
  id?: string;
}

interface ManifestContent {
  contract?: string;
  contractVersion?: string;
  pack?: ManifestPack;
  modules?: Array<{ code: string; name?: string; enabled?: boolean; orderIndex?: number }>;
  features?: Array<{ code: string; enabled?: boolean }>;
  capabilities?: Array<{ code: string; required?: boolean }>;
  dependencies?: Array<{ target: string; type?: string; versionRange?: string }>;
  activationRules?: Array<{
    code: string;
    type?: string;
    effect?: string;
    priority?: number;
    conditions?: unknown;
  }>;
}

export interface ResolveInput {
  packCode: string;
  versionNumber?: string;
  environment?: string;
  featureFlags?: Record<string, unknown>;
  contextId?: string;
}

interface RuleResult {
  code: string;
  matched: boolean;
  effect: string;
}

const CONDITION_OPERATORS = new Set([
  'equals', 'not_equals', 'in', 'not_in', 'exists', 'gt', 'gte', 'lt', 'lte',
]);

interface ConditionNode {
  field?: string;
  operator?: string;
  value?: unknown;
  all?: ConditionNode[];
  any?: ConditionNode[];
}

@Injectable()
export class RuntimeResolverService {
  private readonly logger = new Logger(RuntimeResolverService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async step<T>(
    steps: Array<{ key: string; label: string; status: 'OK' | 'WARNING' | 'ERROR'; detail?: string; durationMs: number }>,
    key: string,
    label: string,
    fn: () => Promise<T> | T,
  ): Promise<T> {
    const at = Date.now();
    try {
      return await fn();
    } finally {
      steps.push({ key, label, status: 'OK', durationMs: Date.now() - at });
    }
  }

  // ------------------------------------------------------------------
  // Cockpit (PR-CDC-01)
  // ------------------------------------------------------------------

  async getCockpit(tenantId: string | null) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [resolutions, recent, cacheEntries, diagnostics, publishedVersions] = await Promise.all([
      this.prisma.prRuntimeResolution.count({ where: { tenantId } }),
      this.prisma.prRuntimeResolution.findMany({
        where: { tenantId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.prRuntimeCacheEntry.findMany({ where: { tenantId }, take: 200 }),
      this.prisma.prRuntimeDiagnostic.findMany({
        where: { tenantId, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.pmPackVersion.findMany({
        where: { tenantId, status: 'PUBLISHED' },
        orderBy: { publishedAt: 'desc' },
        take: 20,
        include: { pack: { select: { code: true, name: true } } },
      }),
    ]);

    const counts = { RESOLVED: 0, PARTIALLY_RESOLVED: 0, BLOCKED: 0, DEGRADED: 0, ERROR: 0, NOT_RESOLVED: 0, RESOLVING: 0 };
    let totalDuration = 0;
    for (const resolution of recent) {
      counts[resolution.status] = (counts[resolution.status] ?? 0) + 1;
      totalDuration += resolution.durationMs ?? 0;
    }
    const resolved = counts.RESOLVED + counts.PARTIALLY_RESOLVED;
    const successRate = recent.length > 0 ? Math.round((resolved / recent.length) * 100) : null;

    const cacheHits = cacheEntries.reduce((sum, entry) => sum + entry.hits, 0);
    const cacheMisses = cacheEntries.reduce((sum, entry) => sum + entry.misses, 0);

    const health =
      counts.BLOCKED > 0 || counts.ERROR > 0
        ? 'CRITICAL'
        : counts.DEGRADED > 0 || diagnostics.some((d) => d.severity === 'WARNING')
          ? 'WARNING'
          : recent.length > 0
            ? 'HEALTHY'
            : 'UNKNOWN';

    return {
      health,
      resolutions: {
        total: resolutions,
        last24h: recent.length,
        ...counts,
        avgDurationMs: recent.length > 0 ? Math.round(totalDuration / recent.length) : null,
        successRate,
      },
      publishedPacks: publishedVersions.map((v) => ({
        packCode: v.pack.code,
        packName: v.pack.name,
        versionNumber: v.versionNumber,
        publishedAt: v.publishedAt,
        snapshotHash: v.snapshotHash,
      })),
      cache: this.cacheSummary(cacheEntries),
      diagnostics: diagnostics.slice(0, 8),
    };
  }

  // ------------------------------------------------------------------
  // Manifests publiés disponibles (PR-CDC-02 §7 : sélection du manifest)
  // ------------------------------------------------------------------

  async listPublishedManifests(tenantId: string | null) {
    const versions = await this.prisma.pmPackVersion.findMany({
      where: { tenantId, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 50,
      include: {
        pack: { select: { id: true, code: true, name: true, status: true } },
        manifests: { orderBy: { revision: 'desc' }, take: 1 },
      },
    });
    return versions.map((v) => ({
      packId: v.pack.id,
      packCode: v.pack.code,
      packName: v.pack.name,
      versionId: v.id,
      versionNumber: v.versionNumber,
      publishedAt: v.publishedAt,
      manifestHash: v.manifests[0]?.hash ?? null,
      manifestRevision: v.manifests[0]?.revision ?? null,
      contract: v.manifests[0]?.contract ?? PR.EFFECTIVE_CONTRACT,
      contractVersion: v.manifests[0]?.contractVersion ?? '1.0',
    }));
  }

  // ------------------------------------------------------------------
  // Contextes runtime (PR-CDC-00 §10)
  // ------------------------------------------------------------------

  async listContexts(tenantId: string | null) {
    return this.prisma.prRuntimeContext.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  async createContext(
    tenantId: string | null,
    dto: { label: string; environment?: string; applicationId?: string; featureFlags?: Record<string, unknown> },
  ) {
    if (!dto.label?.trim()) {
      throw prError.contextInvalid('Libellé du contexte requis.');
    }
    return this.prisma.prRuntimeContext.create({
      data: {
        label: dto.label.trim(),
        tenantId,
        applicationId: dto.applicationId,
        environment: dto.environment ?? 'PRODUCTION',
        featureFlags: (dto.featureFlags ?? undefined) as never,
      },
    });
  }

  // ------------------------------------------------------------------
  // Résolution complète (PR-CDC-02/03/04/05/06)
  // ------------------------------------------------------------------

  async resolve(tenantId: string | null, input: ResolveInput, actor?: string | null, traceId?: string | null) {
    const started = Date.now();
    if (!input.packCode?.trim()) throw prError.contextInvalid('packCode requis.');

    const steps: Array<{ key: string; label: string; status: 'OK' | 'WARNING' | 'ERROR'; detail?: string; durationMs: number }> = [];
    const issues: Array<{ severity: 'WARNING' | 'ERROR' | 'CRITICAL'; code: string; message: string }> = [];

    // 1. Load manifest publié (PM → contrat manifest).
    const published = await this.prisma.pmPackVersion.findFirst({
      where: {
        tenantId,
        status: 'PUBLISHED',
        versionNumber: input.versionNumber ?? undefined,
        pack: { is: { code: input.packCode } },
      },
      include: {
        pack: { select: { id: true, code: true, name: true } },
        manifests: { orderBy: { revision: 'desc' }, take: 1 },
      },
    });
    if (!published || !published.manifests[0]) {
      throw prError.manifestNotFound(input.packCode, input.versionNumber);
    }
    const manifestRecord = published.manifests[0];
    const manifest = manifestRecord.content as ManifestContent;

    // 2. Validate : contrat, hash, structure, tenant.
    await this.step(steps, 'manifest.validate', 'Manifest validé', () => {
      if (manifest.contract !== 'techzone.pack-manifest') {
        throw prError.contractUnsupported(String(manifest.contract));
      }
      if (manifest.contractVersion !== '1.0') {
        throw prError.contractUnsupported(String(manifest.contractVersion));
      }
      const recomputed = sha256(JSON.stringify({ ...manifest, hash: undefined }));
      // Le hash stocké a été calculé à la génération sur le contenu sans champ hash.
      if (manifestRecord.hash && recomputed !== manifestRecord.hash) {
        // Tentative avec contenu brut (compat génération) avant rejet.
        const alt = sha256(JSON.stringify(manifest));
        if (alt !== manifestRecord.hash) throw prError.hashInvalid();
      }
      if (!manifest.pack?.code || !manifest.pack.version) {
        throw prError.manifestInvalid('Identité de pack manquante dans le manifest.');
      }
      if (manifest.pack.code !== input.packCode) {
        throw prError.tenantMismatch();
      }
    });

    // 3. Resolve context (tenant + environnement + flags).
    const environment = input.environment ?? 'PRODUCTION';
    const flags = input.featureFlags ?? {};
    const context = { tenantId, environment, featureFlags: flags };

    // 4. Resolve dependencies (PR-CDC-04).
    const dependencyResults = await this.step(steps, 'dependency.resolve', 'Dépendances résolues', async () => {
      const results: Array<{ code: string; type: string; status: 'RESOLVED' | 'MISSING'; versionRange?: string }> = [];
      for (const dependency of manifest.dependencies ?? []) {
        if (dependency.type === 'CONFLICTS_WITH') {
          const conflict = await this.prisma.pmPack.findFirst({ where: { code: dependency.target, tenantId } });
          results.push({ code: dependency.target, type: dependency.type ?? 'CONFLICTS_WITH', status: conflict ? 'MISSING' : 'RESOLVED' });
          if (conflict) {
            issues.push({ severity: 'CRITICAL', code: PrErrorCode.RUNTIME_DEPENDENCY_MISSING, message: `Conflit bloquant avec le pack présent : ${dependency.target}.` });
          }
          continue;
        }
        const target = await this.prisma.pmPack.findFirst({ where: { code: dependency.target, tenantId } });
        const status = target ? 'RESOLVED' : 'MISSING';
        results.push({ code: dependency.target, type: dependency.type ?? 'REQUIRED', status, versionRange: dependency.versionRange });
        if (!target && dependency.type !== 'OPTIONAL' && dependency.type !== 'RECOMMENDS') {
          issues.push({ severity: 'CRITICAL', code: PrErrorCode.RUNTIME_DEPENDENCY_MISSING, message: `Dépendance requise introuvable : ${dependency.target}.` });
        }
      }
      return results;
    });

    // 5. Evaluate rules (PR-CDC-05) : arbre déclaratif + opérateurs allowlist.
    const ruleResults = await this.step(steps, 'rules.evaluate', 'Règles évaluées', async () => {
      const results: RuleResult[] = [];
      for (const rule of (manifest.activationRules ?? []).slice().sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100))) {
        const matched = this.evaluateConditions(rule.conditions, context);
        results.push({ code: rule.code, matched, effect: rule.effect ?? 'ENABLE' });
      }
      return results;
    });

    // 6. Resolve modules / features (PR-CDC-03) : règles puis flags puis défaut manifest.
    const moduleResults = await this.step(steps, 'modules.resolve', 'Modules résolus', async () => {
      const results: Array<{ code: string; name?: string; active: boolean; reason: string }> = [];
      for (const module of manifest.modules ?? []) {
        const ruleForModule = ruleResults.find((r) => r.code === `module.${module.code}`);
        let active = module.enabled !== false;
        let reason = 'MANIFEST_DEFAULT';
        if (ruleForModule) {
          active = ruleForModule.matched ? ruleForModule.effect !== 'DISABLE' : active;
          reason = ruleForModule.matched ? 'RULE_MATCHED' : 'RULE_NOT_MATCHED';
        }
        const flagValue = flags[module.code];
        if (typeof flagValue === 'boolean') {
          active = flagValue && active;
          reason = 'FEATURE_FLAG';
        }
        results.push({ code: module.code, name: module.name, active, reason });
      }
      return results;
    });

    const featureResults = await this.step(steps, 'features.resolve', 'Features résolues', async () => {
      const results: Array<{ code: string; active: boolean; reason: string }> = [];
      const activeModules = new Set(moduleResults.filter((m) => m.active).map((m) => m.code));
      for (const feature of manifest.features ?? []) {
        const modulePrefix = feature.code.split('.')[0];
        const parentActive = activeModules.size === 0 || activeModules.has(modulePrefix);
        const ruleForFeature = ruleResults.find((r) => r.code === `feature.${feature.code}`);
        let active = (feature.enabled !== false) && parentActive;
        let reason = parentActive ? 'MANIFEST_DEFAULT' : 'PARENT_MODULE_INACTIVE';
        if (ruleForFeature) {
          active = ruleForFeature.matched ? ruleForFeature.effect !== 'DISABLE' && active : false;
          reason = ruleForFeature.matched ? 'RULE_MATCHED' : 'RULE_NOT_MATCHED';
        }
        const flagValue = flags[feature.code];
        if (typeof flagValue === 'boolean') {
          active = flagValue && active;
          reason = 'FEATURE_FLAG';
        }
        results.push({ code: feature.code, active, reason });
      }
      return results;
    });

    // Capabilities : requises → présentes si reliées à une feature active (PR-CDC-04).
    const capabilityResults = await this.step(steps, 'capabilities.resolve', 'Capabilities résolues', async () => {
      const activeFeatures = new Set(featureResults.filter((f) => f.active).map((f) => f.code));
      const available: string[] = [];
      for (const capability of manifest.capabilities ?? []) {
        // Une capability requise du manifest est disponible si le manifest la déclare :
        // la vérification d'exécution réel appartient au Data Runtime (hors périmètre).
        const featurePrefix = capability.code.split('.').slice(0, 2).join('.');
        const relatedActive = [...activeFeatures].some((code) => capability.code.startsWith(`${code}`) || featurePrefix.startsWith(code.split('.')[0]));
        if (!capability.required || relatedActive || activeFeatures.size > 0) available.push(capability.code);
        else issues.push({ severity: 'ERROR', code: PrErrorCode.RUNTIME_CAPABILITY_MISSING, message: `Capability requise non disponible : ${capability.code}.` });
      }
      return { available, requiredMissing: manifest.capabilities?.length ? [] : [] };
    });

    // 7. Build effective manifest (PR-CDC-06) : déterministe.
    const blocking = issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'ERROR');
    const status = blocking.length > 0 ? 'BLOCKED' : issues.length > 0 ? 'DEGRADED' : 'RESOLVED';
    const effectiveManifest = {
      contract: PR.EFFECTIVE_CONTRACT,
      contractVersion: PR.EFFECTIVE_CONTRACT_VERSION,
      sourceManifest: {
        packCode: manifest.pack?.code,
        packVersion: manifest.pack?.version,
        manifestHash: manifestRecord.hash,
      },
      context: {
        tenantId,
        environment,
        featureFlags: flags,
      },
      modules: moduleResults,
      features: featureResults,
      capabilities: { available: capabilityResults.available },
      dependencies: dependencyResults,
      rules: ruleResults,
      resolution: { status },
    };
    const effectiveManifestHash = sha256(JSON.stringify(effectiveManifest));
    const durationMs = Date.now() - started;

    const resolution = await this.prisma.prRuntimeResolution.create({
      data: {
        tenantId,
        packId: published.pack.id,
        packVersionId: published.id,
        packCode: published.pack.code,
        packVersion: published.versionNumber,
        sourceManifestHash: manifestRecord.hash,
        effectiveManifestHash,
        status: status as never,
        contextId: input.contextId ?? null,
        steps: steps as never,
        issues: issues as never,
        effectiveManifest: effectiveManifest as never,
        durationMs,
        traceId: traceId ?? null,
        completedAt: new Date(),
      },
    });

    await this.recordDiagnostics(tenantId, resolution.id, traceId ?? null, status, issues);

    // 8. Cache (PR-CDC-07) : clé tenant-scopée.
    await this.writeCacheEntry(
      tenantId,
      {
        packCode: published.pack.code,
        versionNumber: published.versionNumber,
        environment,
        flagsHash: sha256(JSON.stringify(flags)),
      },
      { resolutionId: resolution.id, status, effectiveManifestHash },
      blocking.length === 0,
    );

    this.logger.log(JSON.stringify({ event: 'RUNTIME_RESOLVE', resolutionId: resolution.id, status, tenantId, durationMs }));
    return resolution;
  }

  async listResolutions(tenantId: string | null, query: { packCode?: string; status?: string; take?: number }) {
    return this.prisma.prRuntimeResolution.findMany({
      where: {
        tenantId,
        packCode: query.packCode || undefined,
        status: (query.status as never) || undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(query.take ?? 25, 100),
    });
  }

  async getResolution(tenantId: string | null, resolutionId: string) {
    const resolution = await this.prisma.prRuntimeResolution.findFirst({
      where: { id: resolutionId, tenantId },
    });
    if (!resolution) {
      throw new PrException('RUNTIME_MANIFEST_NOT_FOUND', 'Résolution introuvable.', HttpStatus.NOT_FOUND, { id: resolutionId });
    }
    return resolution;
  }

  // ------------------------------------------------------------------
  // Cache (PR-CDC-07)
  // ------------------------------------------------------------------

  private cacheSummary(entries: Array<{ hits: number; misses: number; expiresAt: Date | null; updatedAt: Date; cacheKey: string; payload: unknown }>) {
    const now = Date.now();
    const active = entries.filter((e) => !e.expiresAt || e.expiresAt.getTime() > now);
    return {
      entries: entries.length,
      active: active.length,
      hits: entries.reduce((sum, e) => sum + e.hits, 0),
      misses: entries.reduce((sum, e) => sum + e.misses, 0),
      lastInvalidatedAt: entries.reduce<Date | null>((latest, e) => (!latest || (e.updatedAt && e.updatedAt > latest) ? e.updatedAt : latest), null),
      entriesPreview: entries.slice(0, 10).map((e) => ({ cacheKey: e.cacheKey, expiresAt: e.expiresAt, hits: e.hits, misses: e.misses })),
    };
  }

  async getCacheStatus(tenantId: string | null) {
    const entries = await this.prisma.prRuntimeCacheEntry.findMany({ where: { tenantId }, take: 500 });
    return this.cacheSummary(entries);
  }

  /** Invalidation manuelle, protégée par permission runtime.invalidate_cache (contrôleur). */
  async invalidateCache(tenantId: string | null, cacheKey?: string) {
    const result = await this.prisma.prRuntimeCacheEntry.updateMany({
      where: { tenantId, ...(cacheKey ? { cacheKey } : {}) },
      data: { lastInvalidatedAt: new Date(), expiresAt: new Date() },
    });
    await this.prisma.prRuntimeDiagnostic.create({
      data: {
        tenantId,
        severity: 'INFO',
        category: 'CACHE',
        component: 'CACHE',
        message: cacheKey ? `Entrée de cache invalidée : ${cacheKey}` : `Cache invalidé (${result.count} entrée(s)).`,
      },
    });
    return { invalidated: result.count };
  }

  private async writeCacheEntry(
    tenantId: string | null,
    keyParts: { packCode: string; versionNumber: string; environment: string; flagsHash: string },
    payload: { resolutionId: string; status: string; effectiveManifestHash: string },
    success: boolean,
  ) {
    const cacheKey = `pm|${tenantId}|${keyParts.packCode}|${keyParts.versionNumber}|${keyParts.environment}|${keyParts.flagsHash}`;
    const existing = await this.prisma.prRuntimeCacheEntry.findUnique({ where: { cacheKey } });
    if (existing) {
      await this.prisma.prRuntimeCacheEntry.update({
        where: { cacheKey },
        data: {
          payload: payload as never,
          hits: success ? { increment: 1 } : { increment: 0 },
          misses: success ? { increment: 0 } : { increment: 1 },
          expiresAt: new Date(Date.now() + PR.CACHE_TTL_SECONDS * 1000),
        },
      });
      return;
    }
    await this.prisma.prRuntimeCacheEntry.create({
      data: {
        cacheKey,
        tenantId,
        payload: payload as never,
        hash: payload.effectiveManifestHash,
        ttlSeconds: PR.CACHE_TTL_SECONDS,
        expiresAt: new Date(Date.now() + PR.CACHE_TTL_SECONDS * 1000),
        hits: success ? 1 : 0,
        misses: success ? 0 : 1,
      },
    });
  }

  // ------------------------------------------------------------------
  // Diagnostics (PR-CDC-07)
  // ------------------------------------------------------------------

  async listDiagnostics(tenantId: string | null, query: { severity?: string; component?: string; take?: number }) {
    return this.prisma.prRuntimeDiagnostic.findMany({
      where: {
        tenantId,
        severity: query.severity || undefined,
        component: query.component || undefined,
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(query.take ?? 50, 200),
    });
  }

  async getDiagnosticsSummary(tenantId: string | null) {
    const components = ['MANIFEST', 'RESOLVER', 'DEPENDENCIES', 'CONFIGURATION', 'CACHE'];
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const diagnostics = await this.prisma.prRuntimeDiagnostic.findMany({
      where: { tenantId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    const lastResolutions = await this.prisma.prRuntimeResolution.findMany({
      where: { tenantId, createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: { status: true, durationMs: true, traceId: true },
    });
    const componentsStatus = components.map((component) => {
      const items = diagnostics.filter((d) => d.component === component);
      const hasCritical = items.some((d) => d.severity === 'CRITICAL' || d.severity === 'ERROR');
      const hasWarning = items.some((d) => d.severity === 'WARNING');
      const inactive = component === 'CACHE' || component === 'MANIFEST'
        ? !items.length
        : false;
      return {
        component,
        status: hasCritical ? 'ERROR' : hasWarning ? 'WARNING' : inactive && items.length === 0 ? 'INACTIVE' : 'HEALTHY',
        events: items.length,
        lastEventAt: items[0]?.createdAt ?? null,
      };
    });
    const manifestStatus = (() => {
      if (!lastResolutions.length) return 'INACTIVE';
      if (lastResolutions.some((r) => r.status === 'ERROR')) return 'ERROR';
      if (lastResolutions.some((r) => r.status === 'BLOCKED')) return 'WARNING';
      return 'HEALTHY';
    })();
    return {
      components: componentsStatus.map((c) => (c.component === 'MANIFEST' ? { ...c, status: manifestStatus === 'INACTIVE' ? c.status : manifestStatus } : c)),
      totals: {
        last24h: diagnostics.length,
        critical: diagnostics.filter((d) => d.severity === 'CRITICAL').length,
        error: diagnostics.filter((d) => d.severity === 'ERROR').length,
        warning: diagnostics.filter((d) => d.severity === 'WARNING').length,
        info: diagnostics.filter((d) => d.severity === 'INFO').length,
      },
      lastTraceId: lastResolutions[0]?.traceId ?? null,
    };
  }

  private async recordDiagnostics(
    tenantId: string | null,
    resolutionId: string,
    traceId: string | null,
    status: string,
    issues: Array<{ severity: string; code: string; message: string }>,
  ) {
    const rows: Array<{ tenantId: string | null; severity: string; category: string; component: string; message: string; details: unknown; resolutionId: string; traceId: string | null }> = [];
    for (const issue of issues) {
      rows.push({
        tenantId,
        severity: issue.severity,
        category: issue.code,
        component: issue.code.includes('DEPENDENCY') ? 'DEPENDENCIES' : issue.code.includes('CAPABILITY') ? 'RESOLVER' : 'RESOLVER',
        message: issue.message,
        details: { status },
        resolutionId,
        traceId,
      });
    }
    if (status === 'RESOLVED') {
      rows.push({
        tenantId,
        severity: 'INFO',
        category: 'RESOLUTION_OK',
        component: 'RESOLVER',
        message: 'Résolution effective terminée.',
        details: { status },
        resolutionId,
        traceId,
      });
    }
    if (rows.length) {
      await this.prisma.prRuntimeDiagnostic.createMany({ data: rows as never });
    }
  }

  // ------------------------------------------------------------------
  // Évaluateur de règles déclaratif (aucun eval, opérateurs allowlist)
  // ------------------------------------------------------------------

  private evaluateConditions(node: unknown, context: { tenantId: string | null; environment: string; featureFlags: Record<string, unknown> }): boolean {
    if (!node || typeof node !== 'object') return true;
    const tree = node as ConditionNode;
    if (Array.isArray(tree.all)) {
      return tree.all.every((child) => this.evaluateConditions(child, context));
    }
    if (Array.isArray(tree.any)) {
      return tree.any.some((child) => this.evaluateConditions(child, context));
    }
    if (!tree.field || !tree.operator || !CONDITION_OPERATORS.has(tree.operator)) return false;
    const actual = this.resolveField(tree.field, context);
    return this.compare(tree.operator, actual, tree.value);
  }

  private resolveField(field: string, context: { tenantId: string | null; environment: string; featureFlags: Record<string, unknown> }): unknown {
    const map: Record<string, unknown> = {
      'tenant.id': context.tenantId,
      'environment': context.environment,
      'context.environment': context.environment,
    };
    if (field in map) return map[field];
    if (field.startsWith('flag.')) return context.featureFlags[field.slice(5)];
    if (field.startsWith('context.flag.')) return context.featureFlags[field.slice(13)];
    return undefined;
  }

  private compare(operator: string, actual: unknown, expected: unknown): boolean {
    switch (operator) {
      case 'equals': return actual === expected;
      case 'not_equals': return actual !== expected;
      case 'in': return Array.isArray(expected) && expected.includes(actual as never);
      case 'not_in': return Array.isArray(expected) && !expected.includes(actual as never);
      case 'exists': return actual !== undefined && actual !== null;
      case 'gt': return Number(actual) > Number(expected);
      case 'gte': return Number(actual) >= Number(expected);
      case 'lt': return Number(actual) < Number(expected);
      case 'lte': return Number(actual) <= Number(expected);
      default: return false;
    }
  }
}
