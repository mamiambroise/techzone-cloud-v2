/**
 * Pack Manager — service applicatif (PM-CDC-00 → PM-CDC-07).
 *
 * Domaines couverts :
 * - packs (CRUD, archivage, restauration, duplication)        — PM-CDC-02
 * - versions (création, clonage, lifecycle, immutabilité)     — PM-CDC-03
 * - modules / features / capabilities (+ relations réelles)   — PM-CDC-04/05
 * - dépendances (targets pack/module/feature/capability)      — PM-CDC-06
 * - règles déclaratives (JSON structuré, aucun eval)          — PM-CDC-07
 * - validation (checks réels) + snapshot + manifest + publish — PM-CDC-00 §18/20/14
 *
 * Isolation tenant : chaque requête reçoit `tenantId` du principal IAM
 * (jamais du navigateur) et l'injecte dans toutes les lectures/écritures.
 */
import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';

import { PrismaService } from '../../prisma/prisma.service';
import { PmException, pmError } from './pm.exception';
import { PM, PM_IMMUTABLE_VERSION_STATUSES } from './pm.constants';

/** Forme complète d'une version avec ses relations (utilisée par validation/manifest/publish). */
type VersionFull = Awaited<ReturnType<PrismaService['pmPackVersion']['findFirst']>> & {
  pack?: { id: string; code: string; name: string; status: string } | null;
  modules: Array<{ id: string; code: string; name: string; enabled: boolean; orderIndex: number }>;
  features: Array<{ id: string; code: string; enabled: boolean; capabilities: Array<{ capabilityId: string }> }>;
  capabilities: Array<{ id: string; code: string; required: boolean }>;
  dependencies: Array<{ id: string; type: string; targetType: string; targetCode: string; versionRange: string | null; targetPackId: string | null }>;
  rules: Array<{ id: string; code: string; type: string; effect: string; priority: number; conditions: unknown; moduleId: string | null }>;
};

/** Forme du contenu d'un manifest tel que sérialisé (usage outbox). */
interface ManifestContent {
  pack?: { code?: string; version?: string };
}

const VERSION_WITH_RELATIONS = {
  modules: { include: { features: { include: { feature: true } } } },
  features: { include: { capabilities: { include: { capability: true } }, moduleLinks: true } },
  capabilities: true,
  dependencies: true,
  rules: { orderBy: [{ priority: 'asc' as const }, { code: 'asc' as const }] },
} satisfies Record<string, unknown>;

function sha256(value: string): string {
  return `sha256:${createHash('sha256').update(value).digest('hex')}`;
}

/** Version SemVer stricte MAJOR.MINOR.PATCH (PM-CDC-03 §6). */
const SEMVER = /^\d+\.\d+\.\d+$/;

interface ConditionNode {
  field?: string;
  operator?: string;
  value?: unknown;
  all?: ConditionNode[];
  any?: ConditionNode[];
}

const RULE_OPERATORS = new Set([
  'equals', 'not_equals', 'in', 'not_in', 'exists', 'gt', 'gte', 'lt', 'lte',
]);

@Injectable()
export class PackManagerService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------
  // PM-CDC-02 — Packs
  // ------------------------------------------------------------------

  async listPacks(tenantId: string | null, query: { search?: string; status?: string; category?: string; includeArchived?: boolean }) {
    const where: Record<string, unknown> = { tenantId };
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (!query.includeArchived) where.archivedAt = null;
    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.pmPack.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { versions: true } },
      },
    });
  }

  async getPack(tenantId: string | null, packId: string) {
    const pack = await this.prisma.pmPack.findFirst({
      where: { id: packId, tenantId },
      include: {
        versions: { orderBy: { createdAt: 'desc' } },
        dependenciesIn: true,
      },
    });
    if (!pack) throw pmError.packNotFound(packId);
    return pack;
  }

  async createPack(tenantId: string | null, dto: { code: string; name: string; shortName?: string; description?: string; category?: string; iconKey?: string; sourceType?: string }) {
    const code = dto.code?.trim();
    if (!code || !/^[a-z0-9][a-z0-9-_.]{1,98}$/.test(code)) {
      throw new PmException('PACK_NOT_FOUND', 'Code de pack invalide (minuscules, chiffres, tirets).', HttpStatus.UNPROCESSABLE_ENTITY, { field: 'code' });
    }
    const existing = await this.prisma.pmPack.findFirst({
      where: { tenantId, code },
    });
    if (existing) throw pmError.packCodeExists(code);
    const sourceType = (['INTERNAL', 'IMPORTED', 'TEMPLATE'] as const).includes(dto.sourceType as never)
      ? (dto.sourceType as 'INTERNAL' | 'IMPORTED' | 'TEMPLATE')
      : 'INTERNAL';
    const pack = await this.prisma.pmPack.create({
      data: {
        code,
        name: dto.name?.trim() || code,
        shortName: dto.shortName,
        description: dto.description,
        category: dto.category,
        iconKey: dto.iconKey,
        sourceType,
        tenantId,
      },
    });
    await this.audit({ tenantId, packId: pack.id, action: 'pack.created', actor: null });
    return pack;
  }

  async updatePack(tenantId: string | null, packId: string, dto: { name?: string; shortName?: string; description?: string; category?: string; iconKey?: string; rowVersion?: number; status?: string }) {
    const pack = await this.ownPack(tenantId, packId);
    if (dto.rowVersion !== undefined && dto.rowVersion !== pack.rowVersion) throw pmError.versionConflict(pack.id);
    const data: Record<string, unknown> = {};
    for (const key of ['name', 'shortName', 'description', 'category', 'iconKey'] as const) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    if (dto.status && ['ACTIVE', 'SUSPENDED', 'DEPRECATED', 'ARCHIVED', 'DRAFT'].includes(dto.status)) data.status = dto.status;
    const updated = await this.prisma.pmPack.update({
      where: { id: pack.id },
      data: { ...data, rowVersion: { increment: 1 } },
    });
    await this.audit({ tenantId, packId: pack.id, action: 'pack.updated', actor: null, details: data });
    return updated;
  }

  async archivePack(tenantId: string | null, packId: string) {
    const pack = await this.ownPack(tenantId, packId);
    const archived = await this.prisma.pmPack.update({
      where: { id: pack.id },
      data: { status: 'ARCHIVED', archivedAt: new Date() },
    });
    await this.audit({ tenantId, packId: pack.id, action: 'pack.archived', actor: null });
    return archived;
  }

  async restorePack(tenantId: string | null, packId: string) {
    const pack = await this.ownPack(tenantId, packId);
    const restored = await this.prisma.pmPack.update({
      where: { id: pack.id },
      data: { status: 'ACTIVE', archivedAt: null },
    });
    await this.audit({ tenantId, packId: pack.id, action: 'pack.restored', actor: null });
    return restored;
  }

  async duplicatePack(tenantId: string | null, packId: string) {
    const pack = await this.getPack(tenantId, packId);
    const suffix = Date.now().toString(36);
    const created = await this.createPack(tenantId, {
      code: `${pack.code}-copy-${suffix}`.slice(0, 100),
      name: `${pack.name} (copie)`,
      description: pack.description ?? undefined,
      category: pack.category ?? undefined,
      iconKey: pack.iconKey ?? undefined,
    });
    return created;
  }

  // ------------------------------------------------------------------
  // PM-CDC-03 — Versions
  // ------------------------------------------------------------------

  async listVersions(tenantId: string | null, packId: string) {
    const pack = await this.ownPack(tenantId, packId);
    return this.prisma.pmPackVersion.findMany({
      where: { packId: pack.id, tenantId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { modules: true, features: true, capabilities: true, dependencies: true, rules: true } } },
    });
  }

  async getVersion(tenantId: string | null, versionId: string) {
    const version = (await this.prisma.pmPackVersion.findFirst({
      where: { id: versionId, tenantId },
      include: { pack: true, ...VERSION_WITH_RELATIONS } as never,
    })) as VersionFull | null;
    if (!version) throw pmError.versionNotFound(versionId);
    return version;
  }

  async createVersion(
    tenantId: string | null,
    packId: string,
    dto: { versionNumber: string; label?: string; description?: string; releaseNotes?: string; sourceVersionId?: string },
  ) {
    const pack = await this.ownPack(tenantId, packId);
    const versionNumber = dto.versionNumber?.trim();
    if (!SEMVER.test(versionNumber ?? '')) {
      throw new PmException('PACK_VERSION_CONFLICT', 'Numéro de version invalide : SemVer MAJOR.MINOR.PATCH requis.', HttpStatus.UNPROCESSABLE_ENTITY, { field: 'versionNumber' });
    }
    const exists = await this.prisma.pmPackVersion.findUnique({
      where: { packId_versionNumber: { packId: pack.id, versionNumber } },
    });
    if (exists) throw pmError.versionNumberTaken(versionNumber);

    const version = await this.prisma.pmPackVersion.create({
      data: {
        packId: pack.id,
        versionNumber,
        label: dto.label,
        description: dto.description,
        releaseNotes: dto.releaseNotes,
        sourceVersionId: dto.sourceVersionId,
        tenantId,
      },
    });

    // Clonage : copie des éléments d'une version source (PM-CDC-03 §12).
    if (dto.sourceVersionId) {
      const source = await this.getVersion(tenantId, dto.sourceVersionId);
      await this.cloneVersionContent(version.id, source.id, tenantId);
    }
    await this.audit({ tenantId, packId: pack.id, versionId: version.id, action: 'pack.version.created', actor: null });
    return this.getVersion(tenantId, version.id);
  }

  private async cloneVersionContent(targetVersionId: string, sourceVersionId: string, tenantId: string | null) {
    const source = await this.prisma.pmPackVersion.findFirst({
      where: { id: sourceVersionId, tenantId },
      include: {
        modules: { include: { features: { include: { feature: true } } } },
        features: { include: { capabilities: { include: { capability: true } } } },
        capabilities: true,
        dependencies: true,
        rules: true,
      },
    });
    if (!source) throw pmError.versionNotFound(sourceVersionId);

    const featureIdMap = new Map<string, string>();
    const capabilityIdMap = new Map<string, string>();
    const moduleIdMap = new Map<string, string>();

    for (const capability of source.capabilities) {
      const created = await this.prisma.pmCapability.create({
        data: {
          versionId: targetVersionId,
          code: capability.code,
          name: capability.name,
          description: capability.description,
          required: capability.required,
          metadata: capability.metadata ?? undefined,
          tenantId,
        },
      });
      capabilityIdMap.set(capability.id, created.id);
    }
    for (const feature of source.features) {
      const created = await this.prisma.pmFeature.create({
        data: {
          versionId: targetVersionId,
          code: feature.code,
          name: feature.name,
          description: feature.description,
          enabled: feature.enabled,
          metadata: feature.metadata ?? undefined,
          tenantId,
        },
      });
      featureIdMap.set(feature.id, created.id);
      for (const link of feature.capabilities) {
        const capabilityId = capabilityIdMap.get(link.capabilityId);
        if (capabilityId) {
          await this.prisma.pmFeatureCapability.create({
            data: { featureId: created.id, capabilityId, required: link.required, tenantId },
          });
        }
      }
    }
    for (const module of source.modules) {
      const created = await this.prisma.pmModule.create({
        data: {
          versionId: targetVersionId,
          code: module.code,
          name: module.name,
          description: module.description,
          enabled: module.enabled,
          orderIndex: module.orderIndex,
          config: module.config ?? undefined,
          tenantId,
        },
      });
      moduleIdMap.set(module.id, created.id);
      for (const link of module.features) {
        const featureId = featureIdMap.get(link.featureId);
        if (featureId) {
          await this.prisma.pmModuleFeature.create({ data: { moduleId: created.id, featureId, tenantId } });
        }
      }
    }
    for (const dependency of source.dependencies) {
      await this.prisma.pmDependency.create({
        data: {
          versionId: targetVersionId,
          targetType: dependency.targetType,
          targetPackId: dependency.targetPackId,
          targetCode: dependency.targetCode,
          versionRange: dependency.versionRange,
          type: dependency.type,
          metadata: dependency.metadata ?? undefined,
          tenantId,
        },
      });
    }
    for (const rule of source.rules) {
      await this.prisma.pmRule.create({
        data: {
          versionId: targetVersionId,
          code: rule.code,
          name: rule.name,
          type: rule.type,
          description: rule.description,
          conditions: rule.conditions as never,
          effect: rule.effect,
          priority: rule.priority,
          enabled: rule.enabled,
          moduleId: rule.moduleId ? moduleIdMap.get(rule.moduleId) ?? null : null,
          tenantId,
        },
      });
    }
  }

  /** Transition de statut contrôlée (PM-CDC-03 §8/9). */
  async transitionVersion(tenantId: string | null, versionId: string, target: string) {
    const version = await this.ownVersion(tenantId, versionId);
    if (PM_IMMUTABLE_VERSION_STATUSES.has(version.status)) throw pmError.versionImmutable(version.id);
    const allowed: Record<string, string[]> = {
      DRAFT: ['CONFIGURING', 'ARCHIVED'],
      CONFIGURING: ['VALIDATING', 'DRAFT', 'ARCHIVED'],
      VALIDATING: ['READY', 'CONFIGURING', 'INVALID', 'ERROR', 'ARCHIVED'],
      READY: ['PUBLISHED', 'VALIDATING', 'ARCHIVED'],
      INVALID: ['CONFIGURING', 'ARCHIVED'],
      ERROR: ['CONFIGURING', 'ARCHIVED'],
      PUBLISHED: [],
    };
    const targets = allowed[version.status] ?? [];
    if (!targets.includes(target)) {
      throw new PmException(
        'PACK_VERSION_CONFLICT',
        `Transition ${version.status} → ${target} non autorisée.`,
        HttpStatus.CONFLICT,
        { expected: targets.join(', ') || 'aucune' },
      );
    }
    if (target === 'PUBLISHED') return this.publishVersion(tenantId, versionId);
    if (target === 'READY') {
      // Passage à READY : validation fraîche et valide exigée (PM-CDC-03 §24).
      if (version.validationStatus !== 'VALID') {
        throw pmError.publicationDenied('La validation doit être VALID avant le passage à READY.');
      }
    }
    return this.prisma.pmPackVersion.update({ where: { id: version.id }, data: { status: target as never } });
  }

  // ------------------------------------------------------------------
  // PM-CDC-04/05 — Modules, Features, Capabilities
  // ------------------------------------------------------------------

  async listModules(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmModule.findMany({
      where: { versionId, tenantId },
      orderBy: { orderIndex: 'asc' },
      include: { features: { include: { feature: true } } },
    });
  }

  async createModule(tenantId: string | null, versionId: string, dto: { code: string; name: string; description?: string; orderIndex?: number; config?: unknown }) {
    await this.assertMutable(tenantId, versionId);
    try {
      const created = await this.prisma.pmModule.create({
        data: {
          versionId,
          code: dto.code?.trim(),
          name: dto.name?.trim() || dto.code,
          description: dto.description,
          orderIndex: dto.orderIndex ?? 0,
          config: (dto.config ?? undefined) as never,
          tenantId,
        },
      });
      await this.touchVersion(versionId);
      return created;
    } catch {
      throw new PmException('PACK_VERSION_CONFLICT', 'Code module déjà utilisé dans cette version.', HttpStatus.CONFLICT, { field: 'code' });
    }
  }

  async updateModule(tenantId: string | null, moduleId: string, dto: { name?: string; description?: string; enabled?: boolean; orderIndex?: number; config?: unknown }) {
    const module = await this.ownModule(tenantId, moduleId);
    await this.assertMutable(tenantId, module.versionId);
    const updated = await this.prisma.pmModule.update({ where: { id: module.id }, data: dto as never });
    await this.touchVersion(module.versionId);
    return updated;
  }

  async deleteModule(tenantId: string | null, moduleId: string) {
    const module = await this.ownModule(tenantId, moduleId);
    await this.assertMutable(tenantId, module.versionId);
    await this.prisma.pmModule.delete({ where: { id: module.id } });
    await this.touchVersion(module.versionId);
    return { deleted: true };
  }

  async listFeatures(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmFeature.findMany({
      where: { versionId, tenantId },
      orderBy: { code: 'asc' },
      include: {
        capabilities: { include: { capability: true } },
        moduleLinks: { include: { module: true } },
      },
    });
  }

  async createFeature(tenantId: string | null, versionId: string, dto: { code: string; name: string; description?: string; enabled?: boolean }) {
    await this.assertMutable(tenantId, versionId);
    try {
      const created = await this.prisma.pmFeature.create({
        data: {
          versionId,
          code: dto.code?.trim(),
          name: dto.name?.trim() || dto.code,
          description: dto.description,
          enabled: dto.enabled ?? true,
          tenantId,
        },
      });
      await this.touchVersion(versionId);
      return created;
    } catch {
      throw new PmException('PACK_VERSION_CONFLICT', 'Code feature déjà utilisé dans cette version.', HttpStatus.CONFLICT, { field: 'code' });
    }
  }

  async updateFeature(tenantId: string | null, featureId: string, dto: { name?: string; description?: string; enabled?: boolean }) {
    const feature = await this.ownFeature(tenantId, featureId);
    await this.assertMutable(tenantId, feature.versionId);
    const updated = await this.prisma.pmFeature.update({ where: { id: feature.id }, data: dto as never });
    await this.touchVersion(feature.versionId);
    return updated;
  }

  async deleteFeature(tenantId: string | null, featureId: string) {
    const feature = await this.ownFeature(tenantId, featureId);
    await this.assertMutable(tenantId, feature.versionId);
    await this.prisma.pmFeature.delete({ where: { id: feature.id } });
    await this.touchVersion(feature.versionId);
    return { deleted: true };
  }

  async listCapabilities(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmCapability.findMany({
      where: { versionId, tenantId },
      orderBy: { code: 'asc' },
      include: { featureLinks: { include: { feature: true } } },
    });
  }

  async createCapability(tenantId: string | null, versionId: string, dto: { code: string; name: string; description?: string; required?: boolean }) {
    await this.assertMutable(tenantId, versionId);
    try {
      const created = await this.prisma.pmCapability.create({
        data: {
          versionId,
          code: dto.code?.trim(),
          name: dto.name?.trim() || dto.code,
          description: dto.description,
          required: dto.required ?? false,
          tenantId,
        },
      });
      await this.touchVersion(versionId);
      return created;
    } catch {
      throw new PmException('PACK_VERSION_CONFLICT', 'Code capability déjà utilisé dans cette version.', HttpStatus.CONFLICT, { field: 'code' });
    }
  }

  async linkFeatureToModule(tenantId: string | null, versionId: string, dto: { featureId: string; moduleId: string }) {
    await this.assertMutable(tenantId, versionId);
    const feature = await this.ownFeature(tenantId, dto.featureId);
    if (feature.versionId !== versionId) throw pmError.versionNotFound(dto.featureId);
    const module = await this.ownModule(tenantId, dto.moduleId);
    if (module.versionId !== versionId) throw pmError.versionNotFound(dto.moduleId);
    const link = await this.prisma.pmModuleFeature.upsert({
      where: { moduleId_featureId: { moduleId: module.id, featureId: feature.id } },
      create: { moduleId: module.id, featureId: feature.id, tenantId },
      update: {},
    });
    await this.touchVersion(versionId);
    return link;
  }

  async unlinkFeatureFromModule(tenantId: string | null, versionId: string, linkId: string) {
    await this.assertMutable(tenantId, versionId);
    const link = await this.prisma.pmModuleFeature.findFirst({ where: { id: linkId, tenantId } });
    if (!link) throw new PmException('PACK_NOT_FOUND', 'Liaison module/feature introuvable.', HttpStatus.NOT_FOUND, { id: linkId });
    await this.prisma.pmModuleFeature.delete({ where: { id: link.id } });
    await this.touchVersion(versionId);
    return { deleted: true };
  }

  async linkCapabilityToFeature(tenantId: string | null, versionId: string, dto: { featureId: string; capabilityId: string; required?: boolean }) {
    await this.assertMutable(tenantId, versionId);
    const feature = await this.ownFeature(tenantId, dto.featureId);
    if (feature.versionId !== versionId) throw pmError.versionNotFound(dto.featureId);
    const capability = await this.ownCapability(tenantId, dto.capabilityId);
    if (capability.versionId !== versionId) throw pmError.versionNotFound(dto.capabilityId);
    const link = await this.prisma.pmFeatureCapability.upsert({
      where: { featureId_capabilityId: { featureId: feature.id, capabilityId: capability.id } },
      create: { featureId: feature.id, capabilityId: capability.id, required: dto.required ?? true, tenantId },
      update: { required: dto.required ?? true },
    });
    await this.touchVersion(versionId);
    return link;
  }

  async unlinkCapabilityFromFeature(tenantId: string | null, versionId: string, linkId: string) {
    await this.assertMutable(tenantId, versionId);
    const link = await this.prisma.pmFeatureCapability.findFirst({ where: { id: linkId, tenantId } });
    if (!link) throw new PmException('PACK_NOT_FOUND', 'Liaison feature/capability introuvable.', HttpStatus.NOT_FOUND, { id: linkId });
    await this.prisma.pmFeatureCapability.delete({ where: { id: link.id } });
    await this.touchVersion(versionId);
    return { deleted: true };
  }

  // ------------------------------------------------------------------
  // PM-CDC-06 — Dépendances
  // ------------------------------------------------------------------

  async listDependencies(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmDependency.findMany({
      where: { versionId, tenantId },
      orderBy: { createdAt: 'asc' },
      include: { targetPack: { select: { id: true, code: true, name: true, status: true } } },
    });
  }

  async createDependency(
    tenantId: string | null,
    versionId: string,
    dto: { targetType: string; targetCode: string; versionRange?: string; type?: string; targetPackId?: string },
  ) {
    await this.assertMutable(tenantId, versionId);
    const targetTypes = ['PACK', 'MODULE', 'FEATURE', 'CAPABILITY'];
    const depTypes = ['REQUIRED', 'OPTIONAL', 'CONFLICTS_WITH', 'RECOMMENDS', 'IMPLIES'];
    if (!targetTypes.includes(dto.targetType)) {
      throw new PmException('PACK_DEPENDENCY_MISSING', 'Type de cible invalide.', HttpStatus.UNPROCESSABLE_ENTITY, { field: 'targetType' });
    }
    if (!depTypes.includes(dto.type ?? 'REQUIRED')) {
      throw new PmException('PACK_DEPENDENCY_MISSING', 'Type de dépendance invalide.', HttpStatus.UNPROCESSABLE_ENTITY, { field: 'type' });
    }
    if (!dto.targetCode?.trim()) {
      throw new PmException('PACK_DEPENDENCY_MISSING', 'Code cible requis.', HttpStatus.UNPROCESSABLE_ENTITY, { field: 'targetCode' });
    }
    // Résolution du pack cible pour les dépendances de type PACK.
    let targetPackId: string | null = dto.targetPackId ?? null;
    if (dto.targetType === 'PACK' && !targetPackId) {
      const target = await this.prisma.pmPack.findFirst({ where: { code: dto.targetCode, tenantId } });
      targetPackId = target?.id ?? null;
    }
    // Cycle direct interdit : un pack ne peut pas dépendre de lui-même.
    const version = await this.ownVersion(tenantId, versionId);
    if (dto.targetType === 'PACK' && targetPackId === version.packId) {
      throw new PmException('PACK_DEPENDENCY_CYCLE', 'Un pack ne peut pas dépendre de lui-même.', HttpStatus.CONFLICT);
    }
    const created = await this.prisma.pmDependency.create({
      data: {
        versionId,
        targetType: dto.targetType as never,
        targetPackId,
        targetCode: dto.targetCode.trim(),
        versionRange: dto.versionRange,
        type: (dto.type ?? 'REQUIRED') as never,
        tenantId,
      },
    });
    await this.touchVersion(versionId);
    await this.audit({ tenantId, packId: version.packId, versionId, action: 'pack.dependency.created', actor: null, details: { code: dto.targetCode } });
    return created;
  }

  async deleteDependency(tenantId: string | null, versionId: string, dependencyId: string) {
    await this.assertMutable(tenantId, versionId);
    const dep = await this.prisma.pmDependency.findFirst({ where: { id: dependencyId, versionId, tenantId } });
    if (!dep) throw new PmException('PACK_DEPENDENCY_MISSING', 'Dépendance introuvable.', HttpStatus.NOT_FOUND, { id: dependencyId });
    await this.prisma.pmDependency.delete({ where: { id: dep.id } });
    await this.touchVersion(versionId);
    return { deleted: true };
  }

  // ------------------------------------------------------------------
  // PM-CDC-07 — Règles & Conditions
  // ------------------------------------------------------------------

  async listRules(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmRule.findMany({
      where: { versionId, tenantId },
      orderBy: [{ priority: 'asc' }, { code: 'asc' }],
      include: { module: { select: { id: true, code: true, name: true } } },
    });
  }

  async createRule(
    tenantId: string | null,
    versionId: string,
    dto: { code: string; name: string; type?: string; description?: string; conditions: ConditionNode; effect?: string; priority?: number; moduleId?: string },
  ) {
    await this.assertMutable(tenantId, versionId);
    const error = this.validateConditionTree(dto.conditions);
    if (error) {
      throw new PmException('PACK_MANIFEST_INVALID', `Règle invalide : ${error}`, HttpStatus.UNPROCESSABLE_ENTITY, { field: 'conditions' });
    }
    const ruleTypes = ['ACTIVATION', 'AVAILABILITY', 'CONSTRAINT'];
    const ruleType = ruleTypes.includes(dto.type ?? 'ACTIVATION') ? (dto.type as never) : 'ACTIVATION';
    try {
      const created = await this.prisma.pmRule.create({
        data: {
          versionId,
          code: dto.code?.trim(),
          name: dto.name?.trim() || dto.code,
          type: ruleType,
          description: dto.description,
          conditions: dto.conditions as never,
          effect: dto.effect ?? 'ENABLE',
          priority: dto.priority ?? 100,
          moduleId: dto.moduleId,
          tenantId,
        },
      });
      await this.touchVersion(versionId);
      return created;
    } catch {
      throw new PmException('PACK_VERSION_CONFLICT', 'Code règle déjà utilisé dans cette version.', HttpStatus.CONFLICT, { field: 'code' });
    }
  }

  async updateRule(tenantId: string | null, versionId: string, ruleId: string, dto: { name?: string; description?: string; enabled?: boolean; priority?: number; effect?: string; conditions?: ConditionNode }) {
    await this.assertMutable(tenantId, versionId);
    if (dto.conditions) {
      const error = this.validateConditionTree(dto.conditions);
      if (error) throw new PmException('PACK_MANIFEST_INVALID', `Règle invalide : ${error}`, HttpStatus.UNPROCESSABLE_ENTITY, { field: 'conditions' });
    }
    const rule = await this.prisma.pmRule.findFirst({ where: { id: ruleId, versionId, tenantId } });
    if (!rule) throw new PmException('PACK_NOT_FOUND', 'Règle introuvable.', HttpStatus.NOT_FOUND, { id: ruleId });
    const updated = await this.prisma.pmRule.update({ where: { id: rule.id }, data: dto as never });
    await this.touchVersion(versionId);
    return updated;
  }

  async deleteRule(tenantId: string | null, versionId: string, ruleId: string) {
    await this.assertMutable(tenantId, versionId);
    const rule = await this.prisma.pmRule.findFirst({ where: { id: ruleId, versionId, tenantId } });
    if (!rule) throw new PmException('PACK_NOT_FOUND', 'Règle introuvable.', HttpStatus.NOT_FOUND, { id: ruleId });
    await this.prisma.pmRule.delete({ where: { id: rule.id } });
    await this.touchVersion(versionId);
    return { deleted: true };
  }

  /** Validation d'un arbre de conditions déclaratives (aucun eval, opérateurs en allowlist). */
  private validateConditionTree(node: unknown, depth = 0): string | null {
    if (depth > 8) return 'profondeur de conditions excessive.';
    if (!node || typeof node !== 'object') return 'condition requise.';
    const tree = node as ConditionNode;
    if (Array.isArray(tree.all)) {
      for (const child of tree.all) {
        const error = this.validateConditionTree(child, depth + 1);
        if (error) return error;
      }
      return null;
    }
    if (Array.isArray(tree.any)) {
      for (const child of tree.any) {
        const error = this.validateConditionTree(child, depth + 1);
        if (error) return error;
      }
      return null;
    }
    if (!tree.field || typeof tree.field !== 'string') return 'champ requis.';
    if (!tree.operator || !RULE_OPERATORS.has(tree.operator)) return `opérateur non autorisé : ${String(tree.operator)}`;
    return null;
  }

  // ------------------------------------------------------------------
  // Validation + Manifest + Publication (PM-CDC-00 §18/14/19)
  // ------------------------------------------------------------------

  /** Validation structurelle réelle de la version. Retourne checks + issues. */
  private async runValidationChecks(tenantId: string | null, versionId: string) {
    const version = await this.getVersion(tenantId, versionId);
    const checks: Array<{ key: string; label: string; severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'; ok: boolean; message?: string }> = [];
    const issues: Array<{ severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'; code: string; message: string }> = [];

    checks.push({
      key: 'pack',
      label: 'Pack et version valides',
      severity: 'ERROR',
      ok: Boolean(version.pack?.code && version.versionNumber),
    });
    checks.push({
      key: 'modules',
      label: 'Modules déclarés',
      severity: 'WARNING',
      ok: version.modules.length > 0,
      message: version.modules.length === 0 ? 'Aucun module déclaré : le pack publiera un manifest vide.' : undefined,
    });
    checks.push({
      key: 'features',
      label: 'Features déclarées',
      severity: 'WARNING',
      ok: version.features.length > 0,
      message: version.features.length === 0 ? 'Aucune feature déclarée.' : undefined,
    });

    // Codes dupliqués entre features et capabilities (structure).
    const featureCodes = new Set<string>();
    let duplicateFeatures = 0;
    for (const feature of version.features) {
      if (featureCodes.has(feature.code)) duplicateFeatures += 1;
      featureCodes.add(feature.code);
    }
    checks.push({
      key: 'features-unique',
      label: 'Codes features uniques',
      severity: 'CRITICAL',
      ok: duplicateFeatures === 0,
      message: duplicateFeatures ? `${duplicateFeatures} code(s) feature dupliqué(s).` : undefined,
    });

    // Capabilities requises sans feature liée (sémantique).
    const linkedCapabilityIds = new Set(version.features.flatMap((f) => f.capabilities.map((c) => c.capabilityId)));
    const orphanRequired = version.capabilities.filter((c) => c.required && !linkedCapabilityIds.has(c.id));
    checks.push({
      key: 'capabilities-linked',
      label: 'Capabilities requises reliées à une feature',
      severity: 'ERROR',
      ok: orphanRequired.length === 0,
      message: orphanRequired.length ? `${orphanRequired.length} capability(s) requise(s) non reliée(s).` : undefined,
    });
    for (const capability of orphanRequired) {
      issues.push({ severity: 'ERROR', code: 'CAPABILITY_ORPHAN', message: `La capability requise ${capability.code} n'est reliée à aucune feature.` });
    }

    // Dépendances : REQUIRED doit viser un pack existant du même tenant.
    for (const dependency of version.dependencies) {
      if (dependency.targetType === 'PACK' && dependency.type === 'REQUIRED') {
        const target = dependency.targetPackId
          ? await this.prisma.pmPack.findFirst({ where: { id: dependency.targetPackId, tenantId } })
          : await this.prisma.pmPack.findFirst({ where: { code: dependency.targetCode, tenantId } });
        if (!target) {
          issues.push({ severity: 'CRITICAL', code: 'DEPENDENCY_MISSING', message: `Dépendance requise introuvable : ${dependency.targetCode}.` });
        }
      }
      if (dependency.type === 'CONFLICTS_WITH') {
        const target = await this.prisma.pmPack.findFirst({ where: { code: dependency.targetCode, tenantId } });
        if (target) {
          issues.push({ severity: 'ERROR', code: 'DEPENDENCY_CONFLICT', message: `Conflit déclaré avec le pack présent ${dependency.targetCode}.` });
        }
      }
    }
    const blocking = issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'ERROR');
    checks.push({
      key: 'dependencies',
      label: 'Dépendances résolues',
      severity: 'CRITICAL',
      ok: blocking.length === 0,
      message: blocking.length ? `${blocking.length} problème(s) de dépendance.` : undefined,
    });

    // Règles : déjà validées à l'écriture ; vérifier références module.
    const moduleIds = new Set(version.modules.map((m) => m.id));
    const danglingRules = version.rules.filter((r) => r.moduleId && !moduleIds.has(r.moduleId));
    checks.push({
      key: 'rules',
      label: 'Règles référencent des modules existants',
      severity: 'ERROR',
      ok: danglingRules.length === 0,
      message: danglingRules.length ? `${danglingRules.length} règle(s) avec module inconnu.` : undefined,
    });

    return { checks, issues, version };
  }

  async validateVersion(tenantId: string | null, versionId: string, actor?: string | null, traceId?: string | null) {
    const version = await this.ownVersion(tenantId, versionId);
    if (PM_IMMUTABLE_VERSION_STATUSES.has(version.status)) throw pmError.versionImmutable(version.id);
    await this.prisma.pmPackVersion.update({ where: { id: version.id }, data: { validationStatus: 'RUNNING' } });
    const started = Date.now();
    const { checks, issues } = await this.runValidationChecks(tenantId, versionId);
    const blocking = issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'ERROR');
    const warnings = issues.filter((i) => i.severity === 'WARNING');
    const status = blocking.length > 0 ? 'INVALID' : warnings.length > 0 ? 'VALID' : 'VALID';
    const validation = await this.prisma.pmValidation.create({
      data: {
        versionId: version.id,
        status: status as never,
        checks: checks as never,
        issues: issues as never,
        durationMs: Date.now() - started,
        tenantId,
      },
    });
    // Un échec bloquant renvoie la version en CONFIGURING ; sinon la validation devient VALID.
    await this.prisma.pmPackVersion.update({
      where: { id: version.id },
      data: {
        validationStatus: status as never,
        ...(blocking.length > 0 ? { status: 'CONFIGURING' as const } : {}),
      },
    });
    await this.audit({ tenantId, packId: version.packId, versionId: version.id, action: 'pack.version.validated', actor, traceId, details: { status, blocking: blocking.length, warnings: warnings.length } });
    return {
      validationId: validation.id,
      status,
      checks,
      issues,
      durationMs: validation.durationMs,
      blockers: blocking.length,
      warnings: warnings.length,
    };
  }

  async latestValidation(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmValidation.findFirst({ where: { versionId, tenantId }, orderBy: { createdAt: 'desc' } });
  }

  /** Génère le Pack Manifest Contract v1 (PM-CDC-00 §14) si la validation le permet. */
  async generateManifest(tenantId: string | null, versionId: string, actor?: string | null, traceId?: string | null) {
    const version = await this.ownVersion(tenantId, versionId);
    if (PM_IMMUTABLE_VERSION_STATUSES.has(version.status)) throw pmError.versionImmutable(version.id);
    const latest = await this.prisma.pmValidation.findFirst({ where: { versionId, tenantId }, orderBy: { createdAt: 'desc' } });
    if (!latest || latest.status !== 'VALID') {
      throw pmError.publicationDenied('Le manifest ne peut être généré qu\u2019après une validation VALID.');
    }
    const full = await this.getVersion(tenantId, versionId);
    if (!full.pack) throw pmError.packNotFound(versionId);
    const manifest = {
      contract: PM.MANIFEST_CONTRACT,
      contractVersion: PM.MANIFEST_CONTRACT_VERSION,
      pack: {
        id: full.pack.id,
        code: full.pack.code,
        name: full.pack.name,
        version: full.versionNumber,
      },
      modules: full.modules.map((m) => ({ code: m.code, name: m.name, enabled: m.enabled, orderIndex: m.orderIndex })),
      features: full.features.map((f) => ({ code: f.code, enabled: f.enabled })),
      capabilities: full.capabilities.map((c) => ({ code: c.code, required: c.required })),
      dependencies: full.dependencies.map((d) => ({
        target: d.targetCode,
        type: d.type,
        versionRange: d.versionRange ?? undefined,
      })),
      activationRules: full.rules.map((r) => ({ code: r.code, type: r.type, conditions: r.conditions, effect: r.effect, priority: r.priority })),
      revision: 1,
    };
    const hash = sha256(JSON.stringify(manifest));
    const lastRevision = await this.prisma.pmManifest.findFirst({
      where: { versionId, tenantId },
      orderBy: { revision: 'desc' },
    });
    const revision = (lastRevision?.revision ?? 0) + 1;
    const created = await this.prisma.pmManifest.create({
      data: {
        versionId,
        contract: PM.MANIFEST_CONTRACT,
        contractVersion: PM.MANIFEST_CONTRACT_VERSION,
        status: 'VALID',
        content: manifest as never,
        hash,
        revision,
        tenantId,
      },
    });
    await this.prisma.pmPackVersion.update({ where: { id: versionId }, data: { manifestStatus: 'VALID' } });
    await this.audit({ tenantId, packId: full.pack.id, versionId, action: 'pack.manifest.generated', actor, traceId, details: { hash, revision } });
    return created;
  }

  async latestManifest(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmManifest.findFirst({ where: { versionId, tenantId }, orderBy: { revision: 'desc' } });
  }

  async listManifests(tenantId: string | null, versionId: string) {
    await this.ownVersion(tenantId, versionId);
    return this.prisma.pmManifest.findMany({ where: { versionId, tenantId }, orderBy: { revision: 'desc' } });
  }

  /** Publication transactionnelle (PM-CDC-03 §30) : snapshot → manifest → status → audit → outbox. */
  async publishVersion(tenantId: string | null, versionId: string, actor?: string | null, traceId?: string | null) {
    const version = await this.ownVersion(tenantId, versionId);
    if (version.status === 'PUBLISHED') throw pmError.versionImmutable(version.id);
    if (!['READY', 'VALIDATING'].includes(version.status)) {
      throw pmError.publicationDenied(`Statut ${version.status} : la publication exige une version READY.`);
    }
    const latest = await this.prisma.pmValidation.findFirst({ where: { versionId, tenantId }, orderBy: { createdAt: 'desc' } });
    if (!latest || latest.status !== 'VALID') {
      throw pmError.publicationDenied('La publication exige une validation VALID.');
    }
    const manifest = await this.prisma.pmManifest.findFirst({ where: { versionId, tenantId }, orderBy: { revision: 'desc' } });
    if (!manifest || manifest.status !== 'VALID') {
      throw pmError.publicationDenied('La publication exige un manifest valide.');
    }
    const published = await this.prisma.$transaction(async (tx) => {
      // 1. Snapshot déterministe du contenu publié.
      const full = (await tx.pmPackVersion.findUnique({
        where: { id: versionId },
        include: { modules: true, features: true, capabilities: true, dependencies: true, rules: true },
      })) as VersionFull | null;
      if (!full) throw pmError.versionNotFound(versionId);
      const snapshotContent = {
        packId: full.packId,
        versionNumber: full.versionNumber,
        modules: full.modules,
        features: full.features,
        capabilities: full.capabilities,
        dependencies: full.dependencies,
        rules: full.rules,
      };
      const snapshotHash = sha256(JSON.stringify(snapshotContent));
      await tx.pmSnapshot.create({
        data: { versionId, hash: snapshotHash, content: snapshotContent as never, tenantId },
      });
      // 2. Immuaibilisation de la version.
      const updated = await tx.pmPackVersion.update({
        where: { id: versionId },
        data: { status: 'PUBLISHED', publishedAt: new Date(), snapshotHash, manifestStatus: 'VALID' },
      });
      // 3. Audit + Outbox.
      await tx.pmAuditEvent.create({
        data: {
          tenantId,
          packId: version.packId,
          versionId,
          action: 'pack.version.published',
          actor: actor ?? null,
          traceId: traceId ?? null,
          details: { manifestHash: manifest.hash, revision: manifest.revision } as never,
        },
      });
      await tx.outboxEvent.create({
        data: {
          aggregateType: 'pm_pack_version',
          aggregateId: versionId,
          eventType: 'pack.version.published',
          payload: {
            packId: version.packId,
            versionId,
            packCode: (manifest.content as ManifestContent | undefined)?.pack?.code ?? null,
            version: (manifest.content as ManifestContent | undefined)?.pack?.version ?? null,
            manifestHash: manifest.hash,
          } as never,
          traceId: traceId ?? null,
        },
      });
      return updated;
    });
    return published;
  }

  // ------------------------------------------------------------------
  // Cockpit (PM-CDC-01)
  // ------------------------------------------------------------------

  async getCockpit(tenantId: string | null) {
    const [packs, versions, recentEvents] = await Promise.all([
      this.prisma.pmPack.findMany({ where: { tenantId }, select: { status: true } }),
      this.prisma.pmPackVersion.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        include: {
          pack: { select: { id: true, code: true, name: true, status: true } },
          modules: { select: { id: true } },
          dependencies: { select: { id: true, type: true, targetCode: true, targetPackId: true } },
        },
      }),
      this.prisma.pmAuditEvent.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
    ]);

    const packStatuses = { total: packs.length, DRAFT: 0, ACTIVE: 0, SUSPENDED: 0, DEPRECATED: 0, ARCHIVED: 0 };
    for (const pack of packs) packStatuses[pack.status] += 1;

    const versionStatuses = {
      DRAFT: 0, CONFIGURING: 0, VALIDATING: 0, READY: 0, PUBLISHED: 0,
      SUPERSEDED: 0, DEPRECATED: 0, ARCHIVED: 0, INVALID: 0, ERROR: 0,
    };
    let validationValid = 0;
    let validationInvalid = 0;
    let validationOutdated = 0;
    let validationNotRun = 0;
    let manifests = 0;
    const attention: Array<{ versionId: string; packCode: string; versionNumber: string; reason: string; severity: 'WARNING' | 'CRITICAL' }> = [];

    for (const version of versions) {
      versionStatuses[version.status] = (versionStatuses[version.status] ?? 0) + 1;
      if (version.validationStatus === 'VALID') validationValid += 1;
      else if (version.validationStatus === 'INVALID') validationInvalid += 1;
      else if (version.validationStatus === 'OUTDATED') validationOutdated += 1;
      else if (version.validationStatus === 'NOT_RUN') validationNotRun += 1;
      if (version.manifestStatus === 'VALID') manifests += 1;

      if (version.validationStatus === 'INVALID') {
        attention.push({ versionId: version.id, packCode: version.pack.code, versionNumber: version.versionNumber, reason: 'Validation en échec', severity: 'CRITICAL' });
      }
      if (version.status === 'READY' && version.manifestStatus !== 'VALID') {
        attention.push({ versionId: version.id, packCode: version.pack.code, versionNumber: version.versionNumber, reason: 'Prête sans manifest valide', severity: 'WARNING' });
      }
      const requiredMissing = version.dependencies.filter((d) => d.type === 'REQUIRED' && !d.targetPackId);
      if (requiredMissing.length > 0) {
        attention.push({
          versionId: version.id,
          packCode: version.pack.code,
          versionNumber: version.versionNumber,
          reason: `Dépendance(s) requise(s) non résolue(s) : ${requiredMissing.map((d) => d.targetCode).join(', ')}`,
          severity: 'CRITICAL',
        });
      }
    }

    return {
      packs: packStatuses,
      versions: {
        total: versions.length,
        ...versionStatuses,
        validation: { valid: validationValid, invalid: validationInvalid, outdated: validationOutdated, notRun: validationNotRun },
        manifests,
      },
      attention: attention.slice(0, 10),
      recentEvents,
    };
  }

  // ------------------------------------------------------------------
  // Helpers ownership (isolation tenant systématique)
  // ------------------------------------------------------------------

  private async ownPack(tenantId: string | null, packId: string) {
    const pack = await this.prisma.pmPack.findFirst({ where: { id: packId, tenantId } });
    if (!pack) throw pmError.packNotFound(packId);
    return pack;
  }

  private async ownVersion(tenantId: string | null, versionId: string) {
    const version = await this.prisma.pmPackVersion.findFirst({ where: { id: versionId, tenantId } });
    if (!version) throw pmError.versionNotFound(versionId);
    return version;
  }

  private async ownModule(tenantId: string | null, moduleId: string) {
    const module = await this.prisma.pmModule.findFirst({ where: { id: moduleId, tenantId } });
    if (!module) throw new PmException('PACK_NOT_FOUND', 'Module introuvable.', HttpStatus.NOT_FOUND, { id: moduleId });
    return module;
  }

  private async ownFeature(tenantId: string | null, featureId: string) {
    const feature = await this.prisma.pmFeature.findFirst({ where: { id: featureId, tenantId } });
    if (!feature) throw new PmException('PACK_NOT_FOUND', 'Feature introuvable.', HttpStatus.NOT_FOUND, { id: featureId });
    return feature;
  }

  private async ownCapability(tenantId: string | null, capabilityId: string) {
    const capability = await this.prisma.pmCapability.findFirst({ where: { id: capabilityId, tenantId } });
    if (!capability) throw new PmException('PACK_NOT_FOUND', 'Capability introuvable.', HttpStatus.NOT_FOUND, { id: capabilityId });
    return capability;
  }

  /** Toute écriture sur une version publiée est refusée (immutabilité PM-CDC-03 §10). */
  private async assertMutable(tenantId: string | null, versionId: string) {
    const version = await this.ownVersion(tenantId, versionId);
    if (PM_IMMUTABLE_VERSION_STATUSES.has(version.status)) throw pmError.versionImmutable(versionId);
    return version;
  }

  /** Toute modification de contenu invalide la validation précédente (PM-CDC-00 §29). */
  private async touchVersion(versionId: string) {
    await this.prisma.pmPackVersion.update({
      where: { id: versionId },
      data: { validationStatus: 'OUTDATED', manifestStatus: 'OUTDATED' },
    });
  }

  private async audit(input: { tenantId: string | null; packId?: string | null; versionId?: string | null; action: string; actor?: string | null; traceId?: string | null; details?: unknown }) {
    await this.prisma.pmAuditEvent.create({
      data: {
        tenantId: input.tenantId,
        packId: input.packId ?? null,
        versionId: input.versionId ?? null,
        action: input.action,
        actor: input.actor ?? null,
        traceId: input.traceId ?? null,
        details: (input.details ?? undefined) as never,
      },
    });
  }
}
