import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';
import type { IamPrincipal } from '../../iam/principal.decorator';
import { Prisma } from '../../generated/prisma/client';
import { PackManagerService } from '../pack-manager/pack-manager.service';
import { contractHash, dependencyIssues, matches, publicJson, RecordValue } from '../pack-manager/pack-contract';
import { RuntimeBridgeService } from '../business-manager/runtime/runtime-bridge.service';
import { RuntimeCacheService } from './runtime-cache.service';
import { RegistryService } from '../../registry/registry.service';
import { RuntimeExecutionService } from './runtime-execution.service';
import type { RuntimeProof } from './runtime-execution.service';

@Injectable()
export class PackRuntimeService {
  constructor(
    private readonly db: PrismaService,
    private readonly packs: PackManagerService,
    private readonly bridge: RuntimeBridgeService,
    private readonly cache: RuntimeCacheService,
    private readonly execution?: RuntimeExecutionService,
    private readonly registry?: RegistryService,
  ) {}
  private tenant(actor: IamPrincipal) { if (!actor.tenantId || actor.tenantId === 'legacy') throw new BadRequestException('TENANT_CONTEXT_REQUIRED'); return actor.tenantId; }
  private text(input: RecordValue, key: string) { if (typeof input[key] !== 'string' || !input[key].trim()) throw new BadRequestException(key.toUpperCase() + '_REQUIRED'); return input[key].trim(); }
  publishedManifest(code: string, version: string, actor: IamPrincipal) { return this.packs.publishedManifest(code,version,actor); }
  private audit(actor: IamPrincipal, action: string, id: string, metadata: RecordValue = {}) { return this.db.auditEvent.create({ data: { tenantId: this.tenant(actor), actorId: actor.userId, traceId: randomUUID(), action, targetType: 'RUNTIME', targetId: id, result: 'SUCCESS', metadata } }); }

  assertExecutableResolution(proof: RuntimeProof, actor?: IamPrincipal) {
    if (actor && actor.tenantId !== proof.tenantId) throw new BadRequestException('TENANT_CONTEXT_MISMATCH');
    return this.runtimeExecution().assertExecutable(proof);
  }

  private runtimeExecution(): RuntimeExecutionService {
    if (!this.execution) throw new InternalServerErrorException('RUNTIME_EXECUTION_UNAVAILABLE');
    return this.execution;
  }

  async resolve(input: RecordValue, actor: IamPrincipal) {
    const tenantId = this.tenant(actor);
    if (input.tenantId && input.tenantId !== tenantId) throw new BadRequestException('TENANT_CONTEXT_MISMATCH');
    // Security-sensitive context cannot be supplied or overridden by the browser.
    if (input.context && Object.keys(input.context).length) throw new BadRequestException('RUNTIME_CONTEXT_IS_SERVER_OWNED');
    const applicationId = this.text(input,'applicationId'), businessVersionId = this.text(input,'businessVersionId');
    const environment = this.text(input,'environment'), packCode = this.text(input,'packCode'), packVersion = this.text(input,'packVersion');
    const requestedApplicationVersionId = typeof input.applicationVersionId === 'string' ? input.applicationVersionId.trim() : undefined;
    const [source, business, publications] = await Promise.all([
      this.packs.publishedManifest(packCode,packVersion,actor),
      this.bridge.applicationContext(applicationId,businessVersionId,environment,tenantId),
      this.packs.publishedVersions(actor),
    ]);
    publicJson(business);
    const context = { tenant: { id: tenantId }, application: business.application, environment: business.environment, permissions: [...actor.permissions].sort(), capabilities: business.features.flatMap(f => f.capabilities).sort() };
    const identity = { tenantId, actorId: actor.userId, permissions: context.permissions, businessRevision: business.revision, readiness: business.readiness, sourceHash: source.hash, publications, applicationId, businessVersionId, environment, packCode, packVersion };
    const key = this.cache.key(tenantId,'resolution',identity);
    const cached = input.forceRevision ? undefined : this.cache.get<RecordValue>(key);
    if (cached) {
      const stored = await this.db.runtimeResolution.findFirst({ where: { id: cached.resolutionId, tenantId } });
      const expiry = (stored?.result as RecordValue | null)?.expiresAt;
      if (stored && expiry && Date.parse(expiry) > Date.now()) return { ...cached, cache: 'HIT' };
    }
    return this.cache.singleFlight(key, async () => {
      const traceId = randomUUID();
      const definition = source.definition as RecordValue;
      publicJson(definition);
      const issues = await this.packs.publicationDependencies(definition,actor);
      const registryReferences: RecordValue[] = [];
      const lockedReferences = source.registryReferences ?? [];
      const registryDependencies = (definition.dependencies ?? []).filter(
        (dependency: RecordValue) =>
          dependency &&
          typeof dependency === 'object' &&
          ['REGISTRY', 'REGISTRY_ENTRY', 'REGISTRY_REF'].includes(
            String(dependency.targetType).toUpperCase(),
          ) &&
          dependency.required !== false,
      );
      if (registryDependencies.length !== lockedReferences.length) {
        issues.push({
          code: 'REGISTRY_VERSION_LOCK_INVALID',
          severity: 'ERROR',
          message: 'Les dépendances Registry du Pack publié ne sont pas toutes verrouillées.',
          path: 'registryReferences',
        });
      }
      for (const reference of lockedReferences) {
        if (
          typeof reference.entryId !== 'string' ||
          typeof reference.key !== 'string' ||
          typeof reference.version !== 'string' ||
          !this.registry
        ) {
          issues.push({
            code: 'REGISTRY_VERSION_LOCK_INVALID',
            severity: 'ERROR',
            message: 'Le verrou Registry du Pack publié est invalide.',
            path: 'registryReferences',
          });
          continue;
        }
        const resolution = await this.registry.resolve(actor, {
          key: reference.key,
          entryId: reference.entryId,
          version: reference.version,
          published: true,
          allowDeprecated: true,
          environmentCode: environment,
        });
        if (
          !['COMPATIBLE', 'DEPRECATED'].includes(resolution.status) ||
          resolution.selectedCandidate?.id !== reference.entryId
        ) {
          issues.push({
            code: 'REGISTRY_REFERENCE_INCOMPATIBLE',
            severity: 'ERROR',
            message: `La référence Registry exacte ${reference.key}@${reference.version} n’est pas disponible.`,
            path: 'registryReferences',
          });
          continue;
        }
        registryReferences.push({
          ...reference,
          status: resolution.status,
          warnings: resolution.warnings,
        });
      }
      const ui = definition.ui as RecordValue | undefined;
      for (const provider of ['automation', 'integrations']) {
        if (definition[provider] && Object.keys(definition[provider]).length) issues.push({ code: 'RUNTIME_PROVIDER_UNSUPPORTED', severity: 'ERROR', message: `Le provider ${provider} ne possède pas encore de contrat de readiness Runtime vérifié.`, path: provider });
      }
      if (!ui?.definition) {
        issues.push({ code: 'UI_DEFINITION_MISSING', severity: 'ERROR', message: 'Le manifest publié ne contient pas de snapshot UI.', path: 'ui' });
      } else if (ui.schemaVersion !== '1.1' || ui.definition.schemaVersion !== '1.1') {
        issues.push({ code: 'UNSUPPORTED_UI_SCHEMA', severity: 'ERROR', message: 'Version de schéma UI non supportée.', path: 'ui.schemaVersion' });
      } else {
        const allowed = new Set(['Container','Section','Card','Grid','Stack','Heading','Text','Input','Textarea','Select','Checkbox','DatePicker','FormField','Form','DataTable','Badge','Alert','Image','Link','Tabs','Spinner','Button']);
        for (const page of ui.definition.pages ?? []) for (const [componentId, component] of Object.entries((page as RecordValue).components?.nodes ?? {})) {
          if (!allowed.has((component as RecordValue).type as string)) issues.push({ code: 'UNKNOWN_COMPONENT', severity: 'ERROR', message: `Composant UI non supporté: ${(component as RecordValue).type}`, path: `ui.pages.${(page as RecordValue).key}.${componentId}` });
        }
      }
      if (business.readiness !== 'READY') issues.push({ code: business.reasonCode, severity: 'ERROR', message: 'Valider la version Business Manager avant la résolution.', path: 'businessVersionId' });
      const sourceApplicationVersionId = typeof ui?.applicationVersionId === 'string' ? ui.applicationVersionId : undefined;
      const expectedApplicationVersionId = business.application.versionId || businessVersionId;
      if (source.applicationVersionId !== expectedApplicationVersionId) issues.push({ code: 'APPLICATION_VERSION_MISMATCH', severity: 'ERROR', message: 'La version du pack doit être liée à la version métier demandée.', path: 'packVersion.applicationVersionId' });
      if (requestedApplicationVersionId && expectedApplicationVersionId && requestedApplicationVersionId !== expectedApplicationVersionId) {
        issues.push({ code: 'APPLICATION_VERSION_MISMATCH', severity: 'ERROR', message: 'Version d’application incohérente avec la résolution demandée.', path: 'applicationVersionId', details: { requested: requestedApplicationVersionId, expected: expectedApplicationVersionId } });
      }
      if (!sourceApplicationVersionId || sourceApplicationVersionId !== expectedApplicationVersionId || ui?.definition?.applicationVersionId !== expectedApplicationVersionId || ui?.definition?.businessContext?.applicationVersionId !== expectedApplicationVersionId) {
        issues.push({ code: 'APPLICATION_VERSION_MISMATCH', severity: 'ERROR', message: 'Pack publié associé à une autre version d’application.', path: 'packVersion', details: { packVersion: packVersion, expected: expectedApplicationVersionId, source: sourceApplicationVersionId } });
      }
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
      const effective = { contract: 'techzone.effective-runtime-manifest', contractVersion: '1.0.0', source: { packCode, packVersion, manifestHash: source.hash, packManifestId: source.id }, scope: { tenantId, applicationId, businessVersionId, environment }, status, executable, modules, features, capabilities: [...provided].sort(), dependencies: definition.dependencies, registryReferences, ui, ruleDecisions: decisions, businessConfiguration: business, configuration: business.configuration };
      const functionalHash = contractHash(effective);
      const expiresAt = new Date(Date.now() + 30 * 60_000).toISOString();
      const stages = [ ['manifest.load', { manifestId: source.id }], ['manifest.validate', { hash: source.hash }], ['context.resolve', { revision: business.revision }], ['module_feature.resolve', { modules: modules.length, features: features.length }], ['capability_dependency.resolve', { issues }], ['rules.evaluate', { decisions }], ['effective_manifest.build', { functionalHash, executable }] ] as const;
      const result = await this.db.$transaction(async tx => {
        const resolution = await tx.runtimeResolution.create({ data: { tenantId, applicationId, environment, packId: definition.pack.id, packVersionId: source.packVersionId, requestHash: contractHash({ identity, nonce: randomUUID() }), status, result: { expiresAt }, context: context as Prisma.InputJsonValue, diagnostics: issues as Prisma.InputJsonValue, createdBy: actor.userId, completedAt: new Date() } });
        await tx.runtimeResolutionStep.createMany({ data: stages.map(([code,details],i) => ({ resolutionId: resolution.id, code, status: !executable && i === stages.length - 1 ? 'BLOCKED' : 'COMPLETED', displayOrder: i, details: details as Prisma.InputJsonValue, outputHash: contractHash(details), completedAt: new Date() })) });
        const manifest = await tx.runtimeEffectiveManifest.create({ data: { tenantId, resolutionId: resolution.id, applicationId, environment, manifestHash: functionalHash, functionalHash, status: executable ? 'VALID' : 'BLOCKED', executable, content: effective as Prisma.InputJsonValue } });
        if (issues.length) await tx.runtimeDiagnostic.createMany({ data: issues.map(issue => ({ tenantId, resolutionId: resolution.id, severity: 'ERROR', category: 'RESOLUTION', code: String(issue.code), message: String(issue.message), details: issue as Prisma.InputJsonValue, traceId })) });
        await tx.auditEvent.create({ data: { tenantId, actorId: actor.userId, traceId, action: 'runtime.resolved', targetType: 'RUNTIME_RESOLUTION', targetId: resolution.id, result: status, metadata: { functionalHash } } });
        return { resolutionId: resolution.id, effectiveManifestId: manifest.id, status, traceId, expiresAt };
      });
      const response = { ...result, executable, effectiveManifest: effective };
      this.cache.set(key,response,{ tenantId, applicationId, packCode, provider: 'PACK_MANIFEST_STORE' },source.hash);
      return { ...response, cache: 'MISS' };
    });
  }
  async resolution(id: string, actor: IamPrincipal) { const item = await this.db.runtimeResolution.findFirst({ where: { id, tenantId: this.tenant(actor) }, include: { steps: { orderBy: { displayOrder: 'asc' } }, effectiveManifest: true } }); if (!item) throw new NotFoundException('RUNTIME_RESOLUTION_NOT_FOUND'); return item; }
  async activate(id: string, actor: IamPrincipal) {
    const tenantId = this.tenant(actor);
    const item = await this.resolution(id, actor);
    const contentBefore = item.effectiveManifest?.content as RecordValue | undefined;
    if (!contentBefore?.scope?.businessVersionId) throw new ConflictException('RUNTIME_APPLICATION_VERSION_MISMATCH');
    const currentBusiness = await this.bridge.applicationContext(item.applicationId, contentBefore.scope.businessVersionId, item.environment, tenantId);
    if (currentBusiness.readiness !== 'READY' || currentBusiness.revision !== contentBefore.businessConfiguration?.revision) throw new ConflictException('RUNTIME_READINESS_FAILED');
    const result = await this.db.$transaction(async tx => {
      const scope = `${tenantId}:${item.applicationId}:${item.environment}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${scope}, 0))`;
      const resolution = await this.runtimeExecution().assertExecutable({ resolutionId: id, tenantId }, false, tx as PrismaService);
      const state = resolution.result as RecordValue;
      if (state.runtimeContext?.status === 'ACTIVE') return state.runtimeContext;
      const previous = await tx.runtimeResolution.findMany({ where: { tenantId, applicationId: item.applicationId, environment: item.environment, result: { path: ['runtimeContext','status'], equals: 'ACTIVE' } } });
      for (const old of previous) {
        const before = old.result as RecordValue;
        await tx.runtimeResolution.update({ where: { id: old.id }, data: { result: { ...before, runtimeContext: { ...before.runtimeContext, status: 'INACTIVE', readiness: 'NOT_READY', deactivatedAt: new Date().toISOString() } } } });
      }
      // Readiness validates the persisted UI, publication and DB provider; unsupported
      // external execution requirements are blocked at resolution, never marked ready.
      await tx.$queryRaw`SELECT 1`;
      const content = resolution.effectiveManifest!.content as RecordValue;
      const runtimeContext = { id: randomUUID(), resolutionId: id, tenantId, applicationId: item.applicationId, applicationVersionId: content.scope.businessVersionId, packVersionId: item.packVersionId, environment: item.environment, status: 'ACTIVE', readiness: 'READY', activatedAt: new Date().toISOString(), activatedBy: actor.userId, configurationHash: contractHash(content.configuration) };
      await tx.runtimeResolution.update({ where: { id }, data: { result: { ...state, runtimeContext } } });
      await tx.auditEvent.create({ data: { tenantId, actorId: actor.userId, traceId: randomUUID(), action: 'runtime.activated', targetType: 'RUNTIME_CONTEXT', targetId: runtimeContext.id, result: 'SUCCESS', metadata: { resolutionId: id } } });
      return runtimeContext;
    });
    this.cache.invalidate(tenantId, 'APPLICATION', { applicationId: item.applicationId });
    return result;
  }
  async deactivate(id: string, actor: IamPrincipal) {
    const tenantId = this.tenant(actor);
    const item = await this.resolution(id, actor);
    const result = await this.db.$transaction(async tx => {
      const scope = `${tenantId}:${item.applicationId}:${item.environment}`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${scope}, 0))`;
      const current = await tx.runtimeResolution.findFirstOrThrow({ where: { id, tenantId } });
      const state = current.result as RecordValue;
      if (!state?.runtimeContext) throw new NotFoundException('RUNTIME_CONTEXT_NOT_FOUND');
      const runtimeContext = { ...state.runtimeContext, status: 'INACTIVE', readiness: 'NOT_READY', deactivatedAt: new Date().toISOString() };
      await tx.runtimeResolution.update({ where: { id }, data: { result: { ...state, runtimeContext } } });
      await tx.auditEvent.create({ data: { tenantId, actorId: actor.userId, traceId: randomUUID(), action: 'runtime.deactivated', targetType: 'RUNTIME_CONTEXT', targetId: runtimeContext.id, result: 'SUCCESS' } });
      return runtimeContext;
    });
    this.cache.invalidate(tenantId, 'APPLICATION', { applicationId: item.applicationId });
    return result;
  }
  async contexts(actor: IamPrincipal) {
    return (await this.resolutions(actor)).filter(r => (r.result as RecordValue | null)?.runtimeContext).map(r => { const state = r.result as RecordValue; const expired = Date.parse(state.expiresAt) <= Date.now(); return { ...state.runtimeContext, ...(expired ? { status: 'EXPIRED', readiness: 'NOT_READY' } : {}), expiresAt: state.expiresAt }; });
  }
  async executionManifest(id: string, actor: IamPrincipal) {
    const item = await this.runtimeExecution().assertExecutable({ resolutionId: id, tenantId: this.tenant(actor) });
    const context = (item.result as RecordValue).runtimeContext;
    return { resolutionId: id, runtimeContext: context, effectiveManifest: item.effectiveManifest!.content };
  }

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
  async dashboard(actor: IamPrincipal) { const tenantId = this.tenant(actor); const [total,resolved,blocked,recent] = await Promise.all([this.db.runtimeResolution.count({ where: { tenantId } }),this.db.runtimeResolution.count({ where: { tenantId,status: 'EXECUTABLE' } }),this.db.runtimeResolution.count({ where: { tenantId,status: 'BLOCKED' } }),this.resolutions(actor)]); return { counters: { total,resolved,blocked }, recent: recent.slice(0,20) }; }
}
