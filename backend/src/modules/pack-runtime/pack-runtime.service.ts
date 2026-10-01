import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { IamPrincipal } from '../../iam/principal.decorator';
import { Prisma } from '../../generated/prisma/client';
import { PackManagerService } from '../pack-manager/pack-manager.service';
import { contractHash, dependencyIssues, matches, publicJson, RecordValue } from '../pack-manager/pack-contract';
import { RuntimeBridgeService } from '../business-manager/runtime/runtime-bridge.service';
import { RuntimeCacheService } from './runtime-cache.service';

@Injectable()
export class PackRuntimeService {
  constructor(private readonly db: PrismaService, private readonly packs: PackManagerService, private readonly bridge: RuntimeBridgeService, private readonly cache: RuntimeCacheService) {}
  private tenant(actor: IamPrincipal) { if (!actor.tenantId || actor.tenantId === 'legacy') throw new BadRequestException('TENANT_CONTEXT_REQUIRED'); return actor.tenantId; }
  private text(input: RecordValue, key: string) { if (typeof input[key] !== 'string' || !input[key].trim()) throw new BadRequestException(key.toUpperCase() + '_REQUIRED'); return input[key].trim(); }
  publishedManifest(code: string, version: string, actor: IamPrincipal) { return this.packs.publishedManifest(code,version,actor); }
  private audit(actor: IamPrincipal, action: string, id: string, metadata: RecordValue = {}) { return this.db.auditEvent.create({ data: { tenantId: this.tenant(actor), actorId: actor.userId, traceId: randomUUID(), action, targetType: 'RUNTIME', targetId: id, result: 'SUCCESS', metadata } }); }

  async resolve(input: RecordValue, actor: IamPrincipal) {
    const tenantId = this.tenant(actor);
    if (input.tenantId && input.tenantId !== tenantId) throw new BadRequestException('TENANT_CONTEXT_MISMATCH');
    // Security-sensitive context cannot be supplied or overridden by the browser.
    if (input.context && Object.keys(input.context).length) throw new BadRequestException('RUNTIME_CONTEXT_IS_SERVER_OWNED');
    const applicationId = this.text(input,'applicationId'), businessVersionId = this.text(input,'businessVersionId');
    const environment = this.text(input,'environment'), packCode = this.text(input,'packCode'), packVersion = this.text(input,'packVersion');
    const [source, business, publications] = await Promise.all([
      this.packs.publishedManifest(packCode,packVersion,actor),
      this.bridge.applicationContext(applicationId,businessVersionId,environment,tenantId),
      this.packs.publishedVersions(actor),
    ]);
    const context = { tenant: { id: tenantId }, application: business.application, environment: business.environment, permissions: [...actor.permissions].sort(), capabilities: business.features.flatMap(f => f.capabilities).sort() };
    const identity = { tenantId, actorId: actor.userId, permissions: context.permissions, businessRevision: business.revision, readiness: business.readiness, sourceHash: source.hash, publications, applicationId, businessVersionId, environment, packCode, packVersion };
    const key = this.cache.key(tenantId,'resolution',identity);
    const cached = input.forceRevision ? undefined : this.cache.get<RecordValue>(key);
    if (cached) return { ...cached, cache: 'HIT' };
    return this.cache.singleFlight(key, async () => {
      const traceId = randomUUID();
      const definition = source.definition as RecordValue;
      publicJson(definition);
      const issues = await this.packs.publicationDependencies(definition,actor);
      if (business.readiness !== 'READY') issues.push({ code: business.reasonCode, severity: 'ERROR', message: 'Valider la version Business Manager avant la résolution.', path: 'businessVersionId' });
      const modules = definition.modules.map((m: RecordValue) => ({ ...m, state: m.enabled ? 'ACTIVE' : 'INACTIVE', reasonCode: m.enabled ? 'DECLARED_ENABLED' : 'DECLARED_DISABLED' }));
      const features = definition.features.map((f: RecordValue) => ({ ...f, state: f.enabled && f.defaultEnabled !== false ? 'ACTIVE' : 'INACTIVE', reasonCode: f.enabled ? 'DECLARED_ENABLED' : 'DECLARED_DISABLED' }));
      const resources = [...modules,...features];
      const provided = new Set<string>(context.capabilities);
      for (const f of features.filter((f: RecordValue) => f.state === 'ACTIVE')) for (const c of f.capabilities ?? []) if (c.relationType === 'PROVIDES') provided.add(c.code);
      for (const f of features) for (const c of f.capabilities ?? []) if (c.relationType === 'REQUIRES' && c.required && !provided.has(c.code)) {
        f.state = 'BLOCKED'; f.reasonCode = 'CAPABILITY_MISSING';
        issues.push({ code: 'CAPABILITY_MISSING', severity: 'ERROR', path: f.code, message: c.code });
      }
      const decisions: RecordValue[] = [];
      const decided = new Set<string>();
      for (const rule of [...definition.rules].sort((a,b) => b.priority-a.priority || a.code.localeCompare(b.code))) {
        const matched = matches(rule.expression,context);
        const target = resources.find(r => r.id === rule.targetId || r.code === rule.targetId);
        if (matched && target && (!decided.has(target.id) || rule.effect === 'DENY')) {
          decided.add(target.id);
          if (rule.effect === 'ENABLE' && target.state !== 'BLOCKED') { target.state = 'ACTIVE'; target.reasonCode = 'RULE_ENABLED'; }
          if (['DENY','DISABLE'].includes(rule.effect)) { target.state = 'INACTIVE'; target.reasonCode = 'RULE_DENIED'; }
          if (rule.effect === 'REQUIRE' && target.state !== 'ACTIVE') { target.state = 'BLOCKED'; target.reasonCode = 'RULE_REQUIRE_UNSATISFIED'; issues.push({ code: target.reasonCode, severity: 'ERROR', path: target.code, message: rule.code }); }
        }
        decisions.push({ ruleCode: rule.code, matched, targetId: rule.targetId, effect: rule.effect, reasonCode: matched ? 'RULE_MATCHED' : 'RULE_NOT_MATCHED' });
      }
      // Parent and security constraints always win over ENABLE rules.
      for (const f of features) { const parent = modules.find((m: RecordValue) => m.id === f.moduleId); if (parent && parent.state !== 'ACTIVE') { f.state = parent.state === 'BLOCKED' ? 'BLOCKED' : 'INACTIVE'; f.reasonCode = 'MODULE_UNAVAILABLE'; } }
      const finalDefinition = { ...definition, modules: modules.map((r: RecordValue) => ({ ...r, enabled: r.state === 'ACTIVE' })), features: features.map((r: RecordValue) => ({ ...r, enabled: r.state === 'ACTIVE' })) };
      issues.push(...dependencyIssues(finalDefinition, publications).filter(i => !issues.some(existing => existing.code === i.code && existing.path === i.path)));
      const executable = issues.length === 0 && !resources.some(r => r.state === 'BLOCKED');
      const status = executable ? 'RESOLVED' : 'BLOCKED';
      const effective = { contract: 'techzone.effective-runtime-manifest', contractVersion: '1.0.0', source: { packCode, packVersion, manifestHash: source.hash, packManifestId: source.id }, scope: { tenantId, applicationId, businessVersionId, environment }, status, executable, modules, features, capabilities: [...provided].sort(), dependencies: definition.dependencies, ruleDecisions: decisions, businessConfiguration: business, configuration: business.configuration };
      const functionalHash = contractHash(effective);
      const stages = [ ['manifest.load', { manifestId: source.id }], ['manifest.validate', { hash: source.hash }], ['context.resolve', { revision: business.revision }], ['module_feature.resolve', { modules: modules.length, features: features.length }], ['capability_dependency.resolve', { issues }], ['rules.evaluate', { decisions }], ['effective_manifest.build', { functionalHash, executable }] ] as const;
      const result = await this.db.$transaction(async tx => {
        const resolution = await tx.runtimeResolution.create({ data: { tenantId, applicationId, environment, packId: definition.pack.id, packVersionId: source.packVersionId, requestHash: contractHash({ identity, nonce: randomUUID() }), status, context: context as Prisma.InputJsonValue, diagnostics: issues as Prisma.InputJsonValue, createdBy: actor.userId, completedAt: new Date() } });
        await tx.runtimeResolutionStep.createMany({ data: stages.map(([code,details],i) => ({ resolutionId: resolution.id, code, status: 'COMPLETED', displayOrder: i, details: details as Prisma.InputJsonValue, outputHash: contractHash(details), completedAt: new Date() })) });
        const manifest = await tx.runtimeEffectiveManifest.create({ data: { tenantId, resolutionId: resolution.id, applicationId, environment, manifestHash: functionalHash, functionalHash, status: executable ? 'VALID' : 'BLOCKED', executable, content: effective as Prisma.InputJsonValue } });
        if (issues.length) await tx.runtimeDiagnostic.createMany({ data: issues.map(issue => ({ tenantId, resolutionId: resolution.id, severity: 'ERROR', category: 'RESOLUTION', code: String(issue.code), message: String(issue.message), details: issue as Prisma.InputJsonValue, traceId })) });
        await tx.auditEvent.create({ data: { tenantId, actorId: actor.userId, traceId, action: 'runtime.resolved', targetType: 'RUNTIME_RESOLUTION', targetId: resolution.id, result: status, metadata: { functionalHash } } });
        return { resolutionId: resolution.id, effectiveManifestId: manifest.id, status, traceId };
      });
      this.cache.set(key,result,{ tenantId, applicationId, packCode, provider: 'PACK_MANIFEST_STORE' },source.hash);
      return { ...result, cache: 'MISS' };
    });
  }
  async resolution(id: string, actor: IamPrincipal) { const item = await this.db.runtimeResolution.findFirst({ where: { id, tenantId: this.tenant(actor) }, include: { steps: { orderBy: { displayOrder: 'asc' } }, effectiveManifest: true } }); if (!item) throw new NotFoundException('RUNTIME_RESOLUTION_NOT_FOUND'); return item; }
  resolutions(actor: IamPrincipal) { return this.db.runtimeResolution.findMany({ where: { tenantId: this.tenant(actor) }, orderBy: { startedAt: 'desc' }, take: 100, include: { effectiveManifest: true } }); }
  async effective(id: string, actor: IamPrincipal) { const r = await this.resolution(id,actor); if (!r.effectiveManifest) throw new NotFoundException('EFFECTIVE_MANIFEST_NOT_FOUND'); return r.effectiveManifest; }
  async effectiveById(id: string, actor: IamPrincipal) { const item = await this.db.runtimeEffectiveManifest.findFirst({ where: { id, tenantId: this.tenant(actor) } }); if (!item) throw new NotFoundException('EFFECTIVE_MANIFEST_NOT_FOUND'); return item; }
  async current(applicationId: string, packCode: string, actor: IamPrincipal) { const items = await this.db.runtimeEffectiveManifest.findMany({ where: { tenantId: this.tenant(actor), applicationId, executable: true }, orderBy: { createdAt: 'desc' }, take: 100 }); const item = items.find(i => (i.content as RecordValue).source?.packCode === packCode); if (!item) throw new NotFoundException('EFFECTIVE_MANIFEST_NOT_FOUND'); return item; }
  async diagnostics(id: string, actor: IamPrincipal) { await this.resolution(id,actor); return this.db.runtimeDiagnostic.findMany({ where: { tenantId: this.tenant(actor), resolutionId: id } }); }
  async diagnostic(id: string, actor: IamPrincipal) { const item = await this.db.runtimeDiagnostic.findFirst({ where: { id, tenantId: this.tenant(actor) } }); if (!item) throw new NotFoundException('DIAGNOSTIC_NOT_FOUND'); return item; }
  async exportDiagnostics(id: string, actor: IamPrincipal) { return { resolutionId: id, diagnostics: await this.diagnostics(id,actor) }; }
  cacheStatus(actor: IamPrincipal) { return this.cache.status(this.tenant(actor)); }
  cacheEntries(actor: IamPrincipal) { return this.cache.list(this.tenant(actor)); }
  async invalidateCache(input: RecordValue, actor: IamPrincipal) { if (!['TENANT','PACK','APPLICATION','ENTRY'].includes(input.scope)) throw new BadRequestException('CACHE_SCOPE_INVALID'); const invalidated = this.cache.invalidate(this.tenant(actor),input.scope,input); await this.audit(actor,'runtime.cache.invalidated',this.tenant(actor),{ scope: input.scope, invalidated }); return { invalidated }; }
  async providersHealth(actor: IamPrincipal) { this.tenant(actor); const start = Date.now(); try { await this.db.$queryRaw`SELECT 1`; return { providers: [{ code: 'LOCAL_CONTRACT_STORE', state: 'UP', latencyMs: Date.now()-start }] }; } catch { return { providers: [{ code: 'LOCAL_CONTRACT_STORE', state: 'DOWN' }] }; } }
  async probeProvider(provider: string, actor: IamPrincipal) { const item = (await this.providersHealth(actor)).providers.find(p => p.code === provider); if (!item) throw new NotFoundException('PROVIDER_NOT_FOUND'); return item; }
  resilienceStatus(actor: IamPrincipal) { this.tenant(actor); return { mode: 'LOCAL_PROCESS', singleFlight: true, staleIfError: false, retries: { enabled: false, reason: 'LOCAL_TRANSACTIONAL_PROVIDERS' }, remoteProviders: false }; }
  async reresolve(id: string, actor: IamPrincipal) { const previous = await this.effective(id,actor); const c = previous.content as RecordValue; return this.resolve({ applicationId: c.scope.applicationId, businessVersionId: c.scope.businessVersionId, environment: c.scope.environment, packCode: c.source.packCode, packVersion: c.source.packVersion, forceRevision: true },actor); }
  async dashboard(actor: IamPrincipal) { const tenantId = this.tenant(actor); const [total,resolved,blocked,recent] = await Promise.all([this.db.runtimeResolution.count({ where: { tenantId } }),this.db.runtimeResolution.count({ where: { tenantId,status: 'RESOLVED' } }),this.db.runtimeResolution.count({ where: { tenantId,status: 'BLOCKED' } }),this.resolutions(actor)]); return { counters: { total,resolved,blocked }, recent: recent.slice(0,20) }; }
}
