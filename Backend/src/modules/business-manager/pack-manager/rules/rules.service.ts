import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AuditService } from '../../audit/audit.service';
import { PackCapability } from '../../entities/pack-capability.entity';
import { PackFeature } from '../../entities/pack-feature.entity';
import { PackModule } from '../../entities/pack-module.entity';
import { PackOutboxEvent } from '../../entities/pack-outbox-event.entity';
import { PackRule } from '../../entities/pack-rule.entity';
import { PackVersion } from '../../entities/pack-version.entity';
import { RuleCondition } from '../../entities/rule-condition.entity';
import { RuleTestCase } from '../../entities/rule-test-case.entity';
import { ConditionNodeType, LogicalOperator, PackManifestStatus, PackValidationStatus, PackVersionStatus, RuleEffect, RuleStatus, RuleTargetType, RuleValidationStatus } from '../../../../common/enums';
import { CreateRuleDto, CreateRuleTestCaseDto, RuleQueryDto, SimulateRuleDto, UpdateRuleDto } from './rule.dto';
import { canonicalRule, evaluateExpression, FIELD_REGISTRY, RuleExpression, ruleHash, validateExpression } from './rule-engine.utils';

@Injectable()
export class RulesService {
  private readonly rules: Repository<PackRule>;
  private readonly conditions: Repository<RuleCondition>;
  private readonly tests: Repository<RuleTestCase>;
  private readonly versions: Repository<PackVersion>;
  private readonly modules: Repository<PackModule>;
  private readonly features: Repository<PackFeature>;
  private readonly capabilities: Repository<PackCapability>;

  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly audit: AuditService) {
    this.rules = dataSource.getRepository(PackRule); this.conditions = dataSource.getRepository(RuleCondition); this.tests = dataSource.getRepository(RuleTestCase); this.versions = dataSource.getRepository(PackVersion); this.modules = dataSource.getRepository(PackModule); this.features = dataSource.getRepository(PackFeature); this.capabilities = dataSource.getRepository(PackCapability);
  }

  async list(tenantId: string, versionId: string, query: RuleQueryDto = new RuleQueryDto()) {
    await this.version(tenantId, versionId);
    const qb = this.rules.createQueryBuilder('rule').where('rule.tenantId = :tenantId AND rule.packVersionId = :versionId AND rule.status != :archived', { tenantId, versionId, archived: RuleStatus.ARCHIVED });
    if (query.ruleType) qb.andWhere('rule.ruleType = :ruleType', { ruleType: query.ruleType });
    if (query.targetType) qb.andWhere('rule.targetType = :targetType', { targetType: query.targetType });
    if (query.status) qb.andWhere('rule.status = :status', { status: query.status });
    if (query.enabled !== undefined) qb.andWhere('rule.enabled = :enabled', { enabled: query.enabled });
    if (query.search) qb.andWhere('(rule.code ILIKE :search OR rule.name ILIKE :search OR rule.targetId ILIKE :search)', { search: `%${query.search}%` });
    return qb.orderBy('rule.priority', 'DESC').addOrderBy('rule.code', 'ASC').getMany();
  }

  async get(tenantId: string, id: string) { const rule = await this.rules.findOne({ where: { id, tenantId } }); if (!rule) throw new NotFoundException('PACK_RULE_NOT_FOUND'); return rule; }

  async create(tenantId: string, versionId: string, actorId: string, dto: CreateRuleDto) {
    const version = await this.mutableVersion(tenantId, versionId);
    this.validateCode(dto.code);
    await this.assertTarget(tenantId, version, dto.targetType, dto.targetId);
    const duplicate = await this.rules.findOne({ where: { tenantId, packVersionId: versionId, code: dto.code } });
    if (duplicate) throw new ConflictException('PACK_RULE_CODE_ALREADY_EXISTS');
    const expression = (dto.expression ?? { all: [] }) as RuleExpression;
    const errors = validateExpression(expression);
    if (errors.length) throw new ConflictException(errors[0]);
    const rule = await this.rules.save(this.rules.create({ ...dto, tenantId, packVersionId: versionId, priority: dto.priority ?? 50, expression: expression as Record<string, unknown>, ruleHash: ruleHash({ ...dto, expression }), metadata: dto.metadata ?? {}, status: RuleStatus.DRAFT, enabled: false, validationStatus: RuleValidationStatus.VALID, createdBy: actorId }));
    await this.projectConditions(rule, expression);
    await this.invalidate(version, tenantId, actorId, 'pack.rule.created', rule.id);
    return rule;
  }

  async update(tenantId: string, id: string, actorId: string, dto: UpdateRuleDto) {
    const rule = await this.get(tenantId, id); const version = await this.mutableVersion(tenantId, rule.packVersionId);
    if (dto.rowVersion !== undefined && dto.rowVersion !== rule.rowVersion) throw new ConflictException('PACK_RULE_CONFLICT');
    if (dto.targetType || dto.targetId) await this.assertTarget(tenantId, version, dto.targetType ?? rule.targetType, dto.targetId ?? rule.targetId);
    const expression = (dto.expression ?? rule.expression) as RuleExpression; const errors = validateExpression(expression); if (errors.length) throw new ConflictException(errors[0]);
    const { rowVersion: _rowVersion, ...content } = dto;
    Object.assign(rule, content, { expression, ruleHash: ruleHash({ ...rule, ...content, expression }), validationStatus: RuleValidationStatus.OUTDATED, rowVersion: rule.rowVersion + 1, updatedBy: actorId });
    const saved = await this.rules.save(rule); await this.conditions.delete({ ruleId: id }); await this.projectConditions(saved, expression); await this.invalidate(version, tenantId, actorId, 'pack.rule.updated', id); return saved;
  }

  async setEnabled(tenantId: string, id: string, actorId: string, enabled: boolean) { const rule = await this.get(tenantId, id); const version = await this.mutableVersion(tenantId, rule.packVersionId); rule.enabled = enabled; rule.status = enabled ? RuleStatus.ACTIVE : RuleStatus.DISABLED; rule.rowVersion += 1; rule.updatedBy = actorId; const saved = await this.rules.save(rule); await this.invalidate(version, tenantId, actorId, enabled ? 'pack.rule.enabled' : 'pack.rule.disabled', id); return saved; }

  async archive(tenantId: string, id: string, actorId: string) { const rule = await this.get(tenantId, id); const version = await this.mutableVersion(tenantId, rule.packVersionId); rule.status = RuleStatus.ARCHIVED; rule.enabled = false; rule.archivedAt = new Date(); rule.rowVersion += 1; rule.updatedBy = actorId; const saved = await this.rules.save(rule); await this.invalidate(version, tenantId, actorId, 'pack.rule.archived', id); return saved; }

  async validate(tenantId: string, id: string, actorId?: string) {
    const rule = await this.get(tenantId, id); const version = await this.version(tenantId, rule.packVersionId); const errors = validateExpression(rule.expression as RuleExpression); const warnings: string[] = [];
    try { await this.assertTarget(tenantId, version, rule.targetType, rule.targetId); } catch { errors.push('PACK_RULE_INVALID_TARGET'); }
    const siblings = await this.rules.find({ where: { tenantId, packVersionId: rule.packVersionId, targetType: rule.targetType, targetId: rule.targetId, priority: rule.priority, enabled: true, status: RuleStatus.ACTIVE } });
    if (siblings.some((item) => item.id !== rule.id && this.isOpposite(item.effect, rule.effect) && JSON.stringify(canonicalRule(item.expression)) === JSON.stringify(canonicalRule(rule.expression)))) errors.push('PACK_RULE_CONFLICT');
    if (!errors.length && !rule.enabled) warnings.push('PACK_RULE_DISABLED');
    rule.validationStatus = errors.length ? RuleValidationStatus.INVALID : RuleValidationStatus.VALID; rule.ruleHash = ruleHash({ code: rule.code, expression: rule.expression, effect: rule.effect, targetType: rule.targetType, targetId: rule.targetId, priority: rule.priority }); rule.rowVersion += 1; const saved = await this.rules.save(rule);
    if (actorId) await this.event(tenantId, actorId, 'pack.rule.validated', id, { errors, warnings });
    return { status: errors.length ? 'INVALID' : warnings.length ? 'WARNING' : 'VALID', errors, warnings, rule: saved, fields: FIELD_REGISTRY };
  }

  async simulate(tenantId: string, id: string, dto: SimulateRuleDto, actorId?: string) {
    const rule = await this.get(tenantId, id); const errors = validateExpression(rule.expression as RuleExpression); if (errors.length) throw new ConflictException('PACK_RULE_SIMULATION_INVALID');
    const result = evaluateExpression(rule.expression as RuleExpression, dto.context ?? {}); const report = { matched: result.matched, effect: result.matched ? rule.effect : undefined, target: { type: rule.targetType, ref: rule.targetId }, ruleCode: rule.code, ruleVersion: rule.expressionVersion, trace: result.trace };
    if (actorId) await this.event(tenantId, actorId, 'pack.rule.simulated', id, { matched: report.matched, effect: report.effect });
    return report;
  }

  async listTests(tenantId: string, id: string) { await this.get(tenantId, id); return this.tests.find({ where: { ruleId: id }, order: { createdAt: 'ASC' } }); }
  async createTest(tenantId: string, id: string, dto: CreateRuleTestCaseDto) { await this.get(tenantId, id); return this.tests.save(this.tests.create({ ruleId: id, name: dto.name, inputContext: dto.context, expectedMatch: dto.expectedMatch, expectedEffect: dto.expectedEffect })); }
  async runTests(tenantId: string, id: string, actorId?: string) { const rule = await this.get(tenantId, id); const cases = await this.listTests(tenantId, id); const results = []; for (const test of cases) { const result = evaluateExpression(rule.expression as RuleExpression, test.inputContext); const passed = result.matched === test.expectedMatch && (!test.expectedEffect || !result.matched || rule.effect === test.expectedEffect); test.lastRunAt = new Date(); test.lastResult = { passed, matched: result.matched, trace: result.trace }; await this.tests.save(test); results.push({ id: test.id, name: test.name, passed, matched: result.matched }); } if (actorId) await this.event(tenantId, actorId, 'pack.rule.tested', id, { total: results.length, passed: results.filter((item) => item.passed).length }); return { total: results.length, passed: results.filter((item) => item.passed).length, failed: results.filter((item) => !item.passed).length, results }; }
  async impact(tenantId: string, id: string) { const rule = await this.get(tenantId, id); const rules = await this.rules.find({ where: { tenantId, packVersionId: rule.packVersionId, targetType: rule.targetType, targetId: rule.targetId } }); return { ruleId: id, blocking: rules.filter((item) => item.enabled && item.id !== id && this.isOpposite(item.effect, rule.effect)).map((item) => item.id), warnings: rules.filter((item) => item.id !== id).map((item) => item.id), infos: [], summary: { relatedRules: rules.length - 1 } }; }

  private async assertTarget(tenantId: string, version: PackVersion, targetType: RuleTargetType, targetId: string) { if (!targetId.trim()) throw new NotFoundException('PACK_RULE_INVALID_TARGET'); if (targetType === RuleTargetType.PACK && targetId === version.packId) return; const repository = targetType === RuleTargetType.MODULE ? this.modules : targetType === RuleTargetType.FEATURE ? this.features : targetType === RuleTargetType.CAPABILITY ? this.capabilities : undefined; if (!repository) return; const where = targetType === RuleTargetType.CAPABILITY ? { id: targetId, tenantId } : { id: targetId, tenantId, packVersionId: version.id }; if (!(await repository.findOne({ where } as never))) throw new NotFoundException('PACK_RULE_INVALID_TARGET'); }
  private validateCode(code: string) { if (!/^[a-z0-9]+(?:[._-][a-z0-9]+)+$/.test(code)) throw new ConflictException('PACK_RULE_CODE_INVALID'); }
  private isOpposite(left: RuleEffect, right: RuleEffect) { return (left === RuleEffect.ENABLE && right === RuleEffect.DISABLE) || (left === RuleEffect.DISABLE && right === RuleEffect.ENABLE) || (left === RuleEffect.ALLOW && right === RuleEffect.DENY) || (left === RuleEffect.DENY && right === RuleEffect.ALLOW) || (left === RuleEffect.SHOW && right === RuleEffect.HIDE) || (left === RuleEffect.HIDE && right === RuleEffect.SHOW); }
  private async projectConditions(rule: PackRule, expression: RuleExpression, parentConditionId?: string, displayOrder = 0): Promise<void> { const isGroup = !!expression.all || !!expression.any; const node = await this.conditions.save(this.conditions.create({ ruleId: rule.id, parentConditionId, nodeType: isGroup ? ConditionNodeType.GROUP : expression.not ? ConditionNodeType.NOT : ConditionNodeType.PREDICATE, logicalOperator: expression.all ? LogicalOperator.AND : expression.any ? LogicalOperator.OR : undefined, fieldRef: expression.field, operator: expression.operator, value: expression.value, valueType: expression.valueType, displayOrder })); const children = expression.all ?? expression.any; if (children) for (const [index, child] of children.entries()) await this.projectConditions(rule, child, node.id, index); if (expression.not) await this.projectConditions(rule, expression.not, node.id, 0); }
  private async version(tenantId: string, id: string) { const version = await this.versions.findOne({ where: { id, tenantId } }); if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND'); return version; }
  private async mutableVersion(tenantId: string, id: string) { const version = await this.version(tenantId, id); if ([PackVersionStatus.PUBLISHED, PackVersionStatus.SUPERSEDED, PackVersionStatus.DEPRECATED, PackVersionStatus.ARCHIVED].includes(version.status)) throw new ConflictException('PACK_VERSION_IMMUTABLE'); return version; }
  private async invalidate(version: PackVersion, tenantId: string, actorId: string, eventType: string, aggregateId: string) { const rules = await this.rules.find({ where: { tenantId, packVersionId: version.id, status: RuleStatus.ACTIVE }, order: { priority: 'DESC' } }); await this.versions.update({ id: version.id, tenantId }, { activationRules: rules.map((rule) => ({ contract: 'pack-rule', version: rule.expressionVersion, code: rule.code, type: rule.ruleType, target: { type: rule.targetType, ref: rule.targetId }, effect: rule.effect, priority: rule.priority, when: rule.expression, ruleHash: rule.ruleHash })), validationStatus: PackValidationStatus.OUTDATED, manifestStatus: PackManifestStatus.OUTDATED, snapshot: undefined, snapshotHash: undefined, manifest: undefined, manifestHash: undefined, version: version.version + 1, updatedBy: actorId }); await this.event(tenantId, actorId, eventType, aggregateId, { packVersionId: version.id }); }
  private async event(tenantId: string, actorId: string, eventType: string, aggregateId: string, payload: Record<string, unknown>) { await this.audit.log({ actorId, eventType, action: eventType.split('.').pop()?.toUpperCase() ?? 'UPDATE', targetType: 'PackRule', targetId: aggregateId, after: payload, metadata: { tenantId } }); await this.dataSource.getRepository(PackOutboxEvent).save({ tenantId, eventType, aggregateType: 'PackRule', aggregateId, payload }); }
}
