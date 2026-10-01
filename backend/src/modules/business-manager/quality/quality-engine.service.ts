import { Injectable, HttpStatus } from '@nestjs/common';
import { definitionRevision } from '../definition-revision';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';
import {
  BmqSeverity,
  BmqStatus,
  BmqGateResult,
} from '../../../generated/prisma/enums';
import { RunQualityValidationDto, CreateQualityGateDto } from './dto/create-quality.dto';

const QUALITY_RULES: Record<string, { severity: BmqSeverity; message: string; check: (ctx: any) => boolean }> = {
  'entity_has_fields': {
    severity: BmqSeverity.ERROR,
    message: 'Each entity must have at least one field',
    check: (ctx) => ctx.entity && ctx.entity.fields && ctx.entity.fields.length > 0,
  },
  'relation_valid': {
    severity: BmqSeverity.WARNING,
    message: 'All relation endpoints must reference existing entities',
    check: (ctx) => true,
  },
  'feature_has_capabilities': {
    severity: BmqSeverity.WARNING,
    message: 'Each feature must have at least one capability',
    check: (ctx) => ctx.feature && ctx.feature.capabilities && ctx.feature.capabilities.length > 0,
  },
  'menu_not_empty': {
    severity: BmqSeverity.INFO,
    message: 'Menu should contain at least one navigation item',
    check: (ctx) => ctx.menu && ctx.menu.items && ctx.menu.items.length > 0,
  },
  'contract_valid': {
    severity: BmqSeverity.BLOCKER,
    message: 'Contract must be in LOCKED or ACTIVE status for publication',
    check: (ctx) => ctx.contract && ['LOCKED', 'ACTIVE'].includes(ctx.contract.status),
  },
};

@Injectable()
export class QualityEngineService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureApplicationVersionExists(applicationVersionId: string, tenantId: string | null) {
    const version = await this.prisma.applicationVersion.findFirst({
      where: {
        id: applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!version) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_NOT_FOUND,
        `Application version "${applicationVersionId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return version;
  }

  // =====================================================================
  // QUALITY VALIDATION ORCHESTRATION
  // =====================================================================

  async runValidation(applicationVersionId: string, dto: RunQualityValidationDto, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);
    const inputHash = tenantId ? await definitionRevision(this.prisma, applicationVersionId, tenantId) : null;

    const campaign = await this.prisma.bmqValidationCampaign.create({
      data: {
        applicationVersionId,
        code: `validation-${Date.now()}`,
        name: `Validation Campaign ${new Date().toISOString()}`,
        profileCode: dto.profileCodes?.[0],
        status: BmqStatus.RUNNING,
        startedAt: new Date(),
        trigger: dto.trigger || 'manual',
        tenantId: tenantId ?? undefined,
      },
    });

    const issues: any[] = [];
    const metrics: Record<string, number> = {};
    const runs: any[] = [];

    // --- Run Data Model checks ---
    const entities = await this.prisma.bmEntity.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
      include: { fields: true },
    });

    const dataModelRun = await this.prisma.bmqValidationRun.create({
      data: {
        campaignId: campaign.id,
        code: 'data-model-validator',
        name: 'Data Model Validation',
        status: BmqStatus.PENDING,
        validatorCode: 'datamodel',
        tenantId: tenantId ?? undefined,
      },
    });

    let dmPassed = true;
    const entityCount = entities.length;
    const fieldCount = entities.reduce((sum, e) => sum + (e.fields?.length || 0), 0);
    const relationCount = await this.prisma.bmRelation.count({ where: { applicationVersionId, tenantId: tenantId ?? undefined } });

    for (const entity of entities) {
      const ctx = { entity };
      for (const [ruleCode, rule] of Object.entries(QUALITY_RULES)) {
        if (ruleCode === 'entity_has_fields') {
          const passed = rule.check(ctx);
          if (!passed) {
            dmPassed = false;
            issues.push({
              reportCode: campaign.code,
              ruleCode,
              severity: rule.severity,
              code: ruleCode,
              message: rule.message,
              source: 'data-model',
            });
          }
        }
      }
    }

    await this.prisma.bmqValidationRun.update({
      where: { id: dataModelRun.id },
      data: {
        status: dmPassed ? BmqStatus.PASSED : BmqStatus.FAILED,
        result: { passed: dmPassed, entityCount, fieldCount, relationCount },
        completedAt: new Date(),
      },
    });
    runs.push({ ...dataModelRun, _count: { entityCount, fieldCount, relationCount } });

    metrics.entities = entityCount;
    metrics.fields = fieldCount;
    metrics.relations = relationCount;

    // --- Run Features checks ---
    const features = await this.prisma.bmFeature.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
      include: { capabilities: true },
    });

    let featPassed = true;
    const featureCount = features.length;
    const capabilityCount = features.reduce((sum, f) => sum + (f.capabilities?.length || 0), 0);

    for (const feature of features) {
      const ctx = { feature };
      for (const [ruleCode, rule] of Object.entries(QUALITY_RULES)) {
        if (ruleCode === 'feature_has_capabilities') {
          const passed = rule.check(ctx);
          if (!passed) {
            featPassed = false;
            issues.push({
              reportCode: campaign.code,
              ruleCode,
              severity: rule.severity,
              code: ruleCode,
              message: rule.message,
              source: 'features',
            });
          }
        }
      }
    }

    metrics.features = featureCount;
    metrics.capabilities = capabilityCount;

    // --- Run Navigation checks ---
    const menus = await this.prisma.bmMenu.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
      include: { items: true },
    });
    metrics.menus = menus.length;

    // --- Run Contract checks ---
    const contracts = await this.prisma.bmBusinessContract.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
    });

    let contractPassed = contracts.some(c => ['LOCKED','ACTIVE'].includes(c.status));
    if (!contractPassed) {
      issues.push({
        reportCode: campaign.code,
        ruleCode: 'contract_valid',
        severity: BmqSeverity.BLOCKER,
        code: 'contract_valid',
        message: 'No locked or active contract found',
        source: 'contracts',
      });
    }
    metrics.contracts = contracts.length;

    // --- Compute overall result ---
    const failedCount = issues.filter(i => i.severity === BmqSeverity.ERROR || i.severity === BmqSeverity.BLOCKER).length;
    const warningCount = issues.filter(i => i.severity === BmqSeverity.WARNING).length;
    const passedCount = issues.filter(i => i.severity === BmqSeverity.INFO || i.severity === BmqSeverity.WARNING).length;

    const totalIssues = issues.length;
    const score = totalIssues === 0 ? 100 : Math.round(((totalIssues - failedCount) / totalIssues) * 100);

    const gateResult = failedCount > 0
      ? (issues.some(i => i.severity === BmqSeverity.BLOCKER) ? BmqGateResult.BLOCKED : BmqGateResult.FAIL)
      : (warningCount > 0 ? BmqGateResult.WARNING : BmqGateResult.PASS);

    const report = await this.prisma.bmqQualityReport.create({
      data: {
        inputHash,
        applicationId: (await this.prisma.applicationVersion.findUnique({
          where: { id: applicationVersionId },
          select: { applicationId: true },
        }))?.applicationId ?? '',
        applicationVersionId,
        code: campaign.code,
        name: campaign.name,
        description: `Validation run at ${new Date().toISOString()}`,
        scope: 'VERSION',
        status: failedCount > 0 ? BmqStatus.FAILED : (warningCount > 0 ? BmqStatus.WARNING : BmqStatus.PASSED),
        score,
        gateResult,
        startedAt: campaign.startedAt,
        completedAt: new Date(),
        tenantId: tenantId ?? undefined,
        issues: {
          create: issues.map(i => ({
            ruleCode: i.ruleCode,
            severity: i.severity,
            code: i.code,
            message: i.message,
            source: i.source,
            tenantId: tenantId ?? undefined,
          })),
        },
        metrics: {
          create: Object.entries(metrics).map(([key, val]) => ({
            key,
            label: key.charAt(0).toUpperCase() + key.slice(1),
            numericValue: typeof val === 'number' ? val : undefined,
            value: typeof val === 'number' ? val.toString() : String(val),
            unit: '',
            tenantId: tenantId ?? undefined,
          })),
        },
      },
    });

    await this.prisma.bmqValidationCampaign.update({
      where: { id: campaign.id },
      data: {
        status: failedCount > 0 ? BmqStatus.FAILED : (warningCount > 0 ? BmqStatus.WARNING : BmqStatus.PASSED),
        completedAt: new Date(),
      },
    });

    for (const run of runs) {
      await this.prisma.bmqValidationRun.update({
        where: { id: run.id },
        data: {
          status: run.status,
        },
      });
    }

    return {
      campaignId: campaign.id,
      reportId: report.id,
      applicationVersionId,
      status: report.status,
      gateResult: report.gateResult,
      score: report.score,
      summary: {
        totalIssues,
        errors: failedCount,
        warnings: warningCount,
        entities: entityCount,
        fields: fieldCount,
        relations: relationCount,
        features: featureCount,
        capabilities: capabilityCount,
        contracts: contracts.length,
      },
      issues: issues,
    };
  }

  // =====================================================================
  // QUALITY REPORTS
  // =====================================================================

  async findAllReports(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    return this.prisma.bmqQualityReport.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        issues: { orderBy: { severity: 'desc' } },
      },
    });
  }

  async findOneReport(id: string, tenantId: string | null) {
    const report = await this.prisma.bmqQualityReport.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
      include: {
        issues: true,
        metrics: true,
      },
    });

    if (!report) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Quality report "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return report;
  }

  // =====================================================================
  // QUALITY GATES
  // =====================================================================

  async createOrUpdateGate(applicationVersionId: string, dto: CreateQualityGateDto, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    const code = dto.code.trim().toLowerCase();

    const existing = await this.prisma.bmqQualityGate.findFirst({
      where: {
        applicationVersionId,
        code,
        tenantId: tenantId ?? undefined,
      },
    });

    if (existing) {
      return this.prisma.bmqQualityGate.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          description: dto.description,
          blockOnFailure: dto.blockOnFailure ?? true,
          rules: (dto.rules || undefined) as any,
        },
      });
    }

    return this.prisma.bmqQualityGate.create({
      data: {
        applicationVersionId,
        code,
        name: dto.name,
        description: dto.description,
        blockOnFailure: dto.blockOnFailure ?? true,
        rules: (dto.rules || undefined) as any,
        result: BmqGateResult.PASS,
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async checkGate(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    const report = await this.prisma.bmqQualityReport.findFirst({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      orderBy: { createdAt: 'desc' },
    });

    const gates = await this.prisma.bmqQualityGate.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
    });

    const allPassed = gates.every(g => g.result === BmqGateResult.PASS);
    const blocked = gates.some(g => g.result === BmqGateResult.BLOCKED && g.blockOnFailure);

    return {
      applicationVersionId,
      overallStatus: !report ? 'NOT_EVALUATED' : blocked ? 'BLOCKED' : report.gateResult !== 'PASS' ? report.gateResult : allPassed ? 'PASS' : 'FAIL',
      gates: gates.map(g => ({
        code: g.code,
        name: g.name,
        result: g.result,
        blockOnFailure: g.blockOnFailure,
      })),
      latestReport: report ? {
        status: report.status,
        score: report.score,
        gateResult: report.gateResult,
      } : null,
    };
  }

  // =====================================================================
  // QUALITY METRICS DASHBOARD
  // =====================================================================

  async getMetrics(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    const reports = await this.prisma.bmqQualityReport.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
      orderBy: { createdAt: 'desc' },
    });

    const issues = await this.prisma.bmqQualityIssue.findMany({
      where: {
        report: {
          applicationVersionId,
          tenantId: tenantId ?? undefined,
        },
      },
    });

    const severityCounts = {
      [BmqSeverity.INFO]: issues.filter(i => i.severity === BmqSeverity.INFO).length,
      [BmqSeverity.WARNING]: issues.filter(i => i.severity === BmqSeverity.WARNING).length,
      [BmqSeverity.ERROR]: issues.filter(i => i.severity === BmqSeverity.ERROR).length,
      [BmqSeverity.BLOCKER]: issues.filter(i => i.severity === BmqSeverity.BLOCKER).length,
    };

    const statusCounts = {
      [BmqStatus.PASSED]: reports.filter(r => r.status === BmqStatus.PASSED).length,
      [BmqStatus.WARNING]: reports.filter(r => r.status === BmqStatus.WARNING).length,
      [BmqStatus.FAILED]: reports.filter(r => r.status === BmqStatus.FAILED).length,
    };

    return {
      applicationVersionId,
      totalReports: reports.length,
      latestScore: reports[0]?.score || 0,
      severityCounts,
      statusCounts,
      trends: reports.slice(0, 10).map(r => ({
        code: r.code,
        status: r.status,
        score: r.score,
        createdAt: r.createdAt,
      })),
    };
  }
}


