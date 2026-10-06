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
import {
  runBusinessDefinitionValidation,
  SEVERITY_WEIGHT,
  type BmValidationInput,
  type BmValidationIssue,
} from './business-definition-validation';

/** Sévérité Prisma <-> sévérité du moteur de validation. */
const SEVERITY_TO_BMQ: Record<BmValidationIssue['severity'], BmqSeverity> = {
  BLOCKER: BmqSeverity.BLOCKER,
  ERROR: BmqSeverity.ERROR,
  WARNING: BmqSeverity.WARNING,
  INFO: BmqSeverity.INFO,
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

/**
   * Charge l'état complet de la Business Definition d'une version.
   * Toute la validation s'appuie uniquement sur cet instantané : aucune règle
   * ne requête la base, ce qui les rend testables et le score reproductible.
   */
  private async loadDefinition(applicationVersionId: string, tenantId: string | null): Promise<BmValidationInput> {
    const scope = { tenantId: tenantId ?? undefined };

    const [entities, relations, features, menus, contracts, configurations, versionFeatures, versionCapabilities] =
      await Promise.all([
        this.prisma.bmEntity.findMany({
          where: { applicationVersionId, ...scope },
          include: { fields: true, constraints: true },
        }),
        this.prisma.bmRelation.findMany({ where: { applicationVersionId, ...scope } }),
        this.prisma.bmFeature.findMany({
          where: { applicationVersionId, ...scope },
          include: { capabilities: { include: { dependencies: true } } },
        }),
        this.prisma.bmMenu.findMany({
          where: { applicationVersionId, ...scope },
          include: { items: true },
        }),
        this.prisma.bmBusinessContract.findMany({ where: { applicationVersionId, ...scope } }),
        this.prisma.configuration.findMany({
          where: { scope: 'APPLICATION_VERSION', scopeId: applicationVersionId, ...scope },
        }),
        this.prisma.bmVersionFeature.findMany({ where: { applicationVersionId, ...scope } }),
        this.prisma.bmVersionCapability.findMany({ where: { applicationVersionId, ...scope } }),
      ]);

    return {
      entities: entities.map((entity) => ({
        id: entity.id,
        code: entity.code,
        name: entity.name,
        description: entity.description,
        status: entity.status,
        fields: entity.fields.map((field) => ({
          id: field.id,
          code: field.code,
          label: field.label,
          description: field.description,
          type: field.type,
          required: field.required,
          unique: field.unique,
          entityId: entity.id,
        })),
        constraints: entity.constraints.map((constraint) => ({
          id: constraint.id,
          code: constraint.code,
          constraintType: constraint.constraintType,
          fieldId: constraint.fieldId,
        })),
      })),
      relations: relations.map((relation) => ({
        id: relation.id,
        code: relation.code,
        relationType: relation.relationType,
        sourceEntityId: relation.sourceEntityId,
        targetEntityId: relation.targetEntityId,
        required: relation.required,
      })),
      features: features.map((feature) => ({
        id: feature.id,
        code: feature.code,
        name: feature.name,
        description: feature.description,
        status: feature.status,
        capabilities: feature.capabilities.map((capability) => ({
          id: capability.id,
          code: capability.code,
          name: capability.name,
          description: capability.description,
          requiredEntities: capability.requiredEntities,
          dependencies: capability.dependencies.map((dependency) => ({
            targetCapabilityCode: dependency.targetCapabilityCode,
            dependencyType: dependency.dependencyType,
          })),
        })),
      })),
      menus: menus.map((menu) => ({
        id: menu.id,
        code: menu.code,
        name: menu.name,
        status: menu.status,
        items: menu.items.map((item) => ({
          id: item.id,
          code: item.code,
          label: item.label,
          itemType: item.itemType,
          parentItemId: item.parentItemId,
          requiredCapabilities: item.requiredCapabilities,
        })),
      })),
      contracts: contracts.map((contract) => ({ id: contract.id, code: contract.code, status: contract.status })),
      configurations: configurations.map((configuration) => ({
        id: configuration.id,
        key: configuration.key,
        status: configuration.status,
        required: configuration.required,
      })),
      versionFeatures: versionFeatures.map((activation) => activation.featureCode),
      versionCapabilities: versionCapabilities.map((activation) => ({
        featureCode: activation.featureCode,
        capabilityCode: activation.capabilityCode,
      })),
    };
  }

  /**
   * Lance la validation complète de la Business Definition d'une version.
   *
   * Les règles vivent dans `business-definition-validation.ts` : elles
   * détectent notamment les relations cassées, les permissions métier en
   * doublon, les références de navigation invalides, les dépendances
   * inexistantes et les descriptions manquantes. Chaque problème est persisté
   * avec son `details` (resourceType / resourceId / resourceCode / path) pour
   * permettre à l'UI d'ouvrir directement l'élément concerné.
   */
  async runValidation(applicationVersionId: string, dto: RunQualityValidationDto, tenantId: string | null) {
    const version = await this.ensureApplicationVersionExists(applicationVersionId, tenantId);
    const inputHash = tenantId ? await definitionRevision(this.prisma, applicationVersionId, tenantId) : null;

    // Un code dérivé du contenu (et non de l'horloge) garde la validation
    // reproductible : deux exécutions sur une définition inchangée produisent
    // le même code, ce qui rend les seeds et les tests déterministes.
    const runToken = inputHash ? inputHash.slice(-12) : String(applicationVersionId).slice(-12);
    const runCode = `validation-${version.status.toLowerCase()}-${runToken}`;

    const definition = await this.loadDefinition(applicationVersionId, tenantId);
    const issues = runBusinessDefinitionValidation(definition);

    const errors = issues.filter((issue) => issue.severity === 'BLOCKER' || issue.severity === 'ERROR');
    const warnings = issues.filter((issue) => issue.severity === 'WARNING');
    const infos = issues.filter((issue) => issue.severity === 'INFO');

    const weightedIssues = issues.reduce((total, issue) => total + SEVERITY_WEIGHT[issue.severity], 0);
    const score = Math.max(0, Math.round(100 - (weightedIssues / Math.max(issues.length, 1)) * 12));

    const gateResult =
      issues.some((issue) => issue.severity === 'BLOCKER')
        ? BmqGateResult.BLOCKED
        : errors.length > 0
          ? BmqGateResult.FAIL
          : warnings.length > 0
            ? BmqGateResult.WARNING
            : BmqGateResult.PASS;

    const status =
      errors.length > 0 ? BmqStatus.FAILED : warnings.length > 0 ? BmqStatus.WARNING : BmqStatus.PASSED;

    const metrics = {
      entities: definition.entities.length,
      fields: definition.entities.reduce((total, entity) => total + entity.fields.length, 0),
      relations: definition.relations.length,
      constraints: definition.entities.reduce((total, entity) => total + entity.constraints.length, 0),
      features: definition.features.length,
      capabilities: definition.features.reduce(
        (total, feature) => total + feature.capabilities.length,
        0,
      ),
      menus: definition.menus.length,
      navigationItems: definition.menus.reduce((total, menu) => total + menu.items.length, 0),
      configurations: definition.configurations.length,
      contracts: definition.contracts.length,
    };

    // La campagne et le rapport sont upsertés sur `code` : relancer la
    // validation ne duplique pas l'historique et reste idempotent.
    const [campaign] = await Promise.all([
      this.prisma.bmqValidationCampaign.upsert({
        where: {
          applicationVersionId_code: { applicationVersionId, code: runCode },
        },
        update: {
          status: BmqStatus.RUNNING,
          startedAt: new Date(),
          completedAt: null,
        },
        create: {
          applicationVersionId,
          code: runCode,
          name: `Validation de ${version.version}`,
          profileCode: dto.profileCodes?.[0],
          status: BmqStatus.RUNNING,
          startedAt: new Date(),
          trigger: dto.trigger || 'manual',
          tenantId: tenantId ?? undefined,
        },
      }),
    ]);

    const run = await this.prisma.bmqValidationRun.upsert({
      where: { campaignId_code: { campaignId: campaign.id, code: 'business-definition' } },
      update: { status: status, result: { issueCount: issues.length, gateResult }, completedAt: new Date() },
      create: {
        campaignId: campaign.id,
        code: 'business-definition',
        name: 'Business Definition Validation',
        status,
        validatorCode: 'business-definition',
        result: { issueCount: issues.length, gateResult },
        completedAt: new Date(),
        tenantId: tenantId ?? undefined,
      },
    });

    // Les problèmes d'une exécution précédente sur le même rapport sont
    // remplacés : le rapport reflète toujours l'état actuel de la version.
    await this.prisma.bmqQualityIssue.deleteMany({ where: { runId: run.id } });

    const report = await this.prisma.bmqQualityReport.upsert({
      where: {
        tenantId_applicationVersionId_code: {
          tenantId: tenantId ?? '',
          applicationVersionId,
          code: runCode,
        },
      },
      update: {
        inputHash,
        status,
        score,
        gateResult,
        startedAt: campaign.startedAt,
        completedAt: new Date(),
      },
      create: {
        inputHash,
        applicationId: version.applicationId,
        applicationVersionId,
        code: runCode,
        name: `Validation de ${version.version}`,
        description: `Validation de la définition métier de la version ${version.version}`,
        scope: 'VERSION',
        status,
        score,
        gateResult,
        startedAt: campaign.startedAt,
        completedAt: new Date(),
        tenantId: tenantId ?? undefined,
      },
    });

    await this.prisma.bmqQualityIssue.deleteMany({ where: { reportId: report.id } });
    await this.prisma.bmqQualityMetric.deleteMany({ where: { reportId: report.id } });

    if (issues.length > 0) {
      await this.prisma.bmqQualityIssue.createMany({
        data: issues.map((issue) => ({
          reportId: report.id,
          runId: run.id,
          ruleCode: issue.code,
          severity: SEVERITY_TO_BMQ[issue.severity],
          code: issue.code,
          message: issue.message,
          source: issue.source,
          // resourceType / resourceId / resourceCode / path : ce que l'UI
          // utilise pour ouvrir directement l'élément fautif.
          details: {
            resourceType: issue.resourceType ?? null,
            resourceId: issue.resourceId ?? null,
            resourceCode: issue.resourceCode ?? null,
            path: issue.path ?? null,
          },
          tenantId: tenantId ?? undefined,
        })),
      });
    }

    await this.prisma.bmqQualityMetric.createMany({
      data: Object.entries(metrics).map(([key, value]) => ({
        reportId: report.id,
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        numericValue: value,
        value: String(value),
        unit: '',
        tenantId: tenantId ?? undefined,
      })),
    });

    await this.prisma.bmqValidationCampaign.update({
      where: { id: campaign.id },
      data: { status, completedAt: new Date() },
    });

    return {
      campaignId: campaign.id,
      reportId: report.id,
      runId: run.id,
      applicationVersionId,
      code: runCode,
      status,
      gateResult,
      score,
      inputHash,
      summary: {
        totalIssues: issues.length,
        blockers: issues.filter((issue) => issue.severity === 'BLOCKER').length,
        errors: errors.length,
        warnings: warnings.length,
        infos: infos.length,
        ...metrics,
      },
      issues,
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


