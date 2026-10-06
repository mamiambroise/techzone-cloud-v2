import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';
import { BmFeatureStatus, BmCapabilityStatus } from '../../../generated/prisma/enums';
import {
  CreateFeatureDto,
  CreateCapabilityDto,
  CreateVersionFeatureDto,
  CreateVersionCapabilityDto,
  UpdateFeatureDto,
} from './dto/create-feature.dto';
import { assertVersionWritable } from '../version-mutability';

@Injectable()
export class FeatureCapabilityService {
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
  // FEATURE MANAGER
  // =====================================================================

  async createFeature(applicationVersionId: string, dto: CreateFeatureDto, tenantId: string | null) {
    await assertVersionWritable(this.prisma, applicationVersionId, tenantId);

    const code = dto.code.trim().toLowerCase();

    const existing = await this.prisma.bmFeature.findFirst({
      where: {
        applicationVersionId,
        code,
        tenantId: tenantId ?? undefined,
      },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_CODE_EXISTS,
        `Feature with code "${code}" already exists in this version`,
        HttpStatus.CONFLICT,
      );
    }

    const appVersion = await this.prisma.applicationVersion.findUnique({
      where: { id: applicationVersionId },
      select: { applicationId: true },
    });

    return this.prisma.bmFeature.create({
      data: {
        applicationId: appVersion?.applicationId ?? '',
        applicationVersionId,
        code,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        tags: dto.tags || [],
        source: dto.source,
        version: dto.version || '1.0.0',
        status: BmFeatureStatus.DRAFT,
        tenantId: tenantId ?? undefined,
      },
      include: {
        capabilities: { include: { dependencies: true } },
      },
    });
  }

  async findAllFeatures(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    return this.prisma.bmFeature.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        capabilities: { include: { dependencies: true } },
      },
    });
  }

  async findOneFeature(id: string, tenantId: string | null) {
    const feature = await this.prisma.bmFeature.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
      include: {
        capabilities: { include: { dependencies: true } },
      },
    });

    if (!feature) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Feature "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return feature;
  }

  async updateFeature(id: string, dto: UpdateFeatureDto, tenantId: string | null) {
    const feature = await this.findOneFeature(id, tenantId);

    await assertVersionWritable(this.prisma, feature.applicationVersionId, tenantId);

    if (feature.status === BmFeatureStatus.ARCHIVED) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_ARCHIVED,
        'Archived feature cannot be modified',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.bmFeature.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        tags: dto.tags,
        status: dto.status,
      },
      include: {
        capabilities: { include: { dependencies: true } },
      },
    });
  }

  async archiveFeature(id: string, tenantId: string | null) {
    const feature = await this.findOneFeature(id, tenantId);
    await assertVersionWritable(this.prisma, feature.applicationVersionId, tenantId);
    if (feature.status === BmFeatureStatus.ARCHIVED) return feature;

    return this.prisma.bmFeature.update({
      where: { id },
      data: { status: BmFeatureStatus.ARCHIVED },
    });
  }

  async getFeatureCatalog(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    return this.prisma.bmFeature.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
        status: { not: BmFeatureStatus.ARCHIVED },
      },
      include: {
        capabilities: {
          where: { status: { not: BmCapabilityStatus.ARCHIVED } },
          include: { dependencies: true },
        },
      },
    });
  }

  // =====================================================================
  // CAPABILITY MANAGER
  // =====================================================================

  async createCapability(featureId: string, dto: CreateCapabilityDto, tenantId: string | null) {
    const feature = await this.prisma.bmFeature.findFirst({
      where: {
        id: featureId,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!feature) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Feature "${featureId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    await assertVersionWritable(this.prisma, feature.applicationVersionId, tenantId);

    const code = dto.code.trim().toLowerCase();

    return this.prisma.bmFeatureCapability.create({
      data: {
        featureId,
        code,
        name: dto.name,
        description: dto.description,
        required: dto.required ?? false,
        requiredEntities: dto.requiredEntities || [],
        configuration: (dto.configuration || undefined) as any,
        version: dto.version || '1.0.0',
        status: BmCapabilityStatus.DRAFT,
        tenantId: tenantId ?? undefined,
      },
    });
  }

  // =====================================================================
  // VERSION ACTIVATION
  // =====================================================================

  async activateFeature(applicationId: string, applicationVersionId: string, dto: CreateVersionFeatureDto, tenantId: string | null) {
    await assertVersionWritable(this.prisma, applicationVersionId, tenantId);

    const existing = await this.prisma.bmVersionFeature.findFirst({
      where: {
        applicationVersionId,
        featureCode: dto.featureCode.toLowerCase(),
        tenantId: tenantId ?? undefined,
      },
    });

    if (existing) {
      return this.prisma.bmVersionFeature.update({
        where: { id: existing.id },
        data: {
          enabled: dto.enabled ?? true,
          activationStrategy: dto.activationStrategy,
          configuration: (dto.configuration || undefined) as any,
        },
      });
    }

    return this.prisma.bmVersionFeature.create({
      data: {
        applicationId,
        applicationVersionId,
        featureCode: dto.featureCode.toLowerCase(),
        enabled: dto.enabled ?? true,
        activationStrategy: dto.activationStrategy,
        configuration: (dto.configuration || undefined) as any,
        version: dto.version || '1.0.0',
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async activateCapability(applicationId: string, applicationVersionId: string, dto: CreateVersionCapabilityDto, tenantId: string | null) {
    await assertVersionWritable(this.prisma, applicationVersionId, tenantId);

    return this.prisma.bmVersionCapability.create({
      data: {
        applicationId,
        applicationVersionId,
        featureCode: dto.featureCode.toLowerCase(),
        capabilityCode: dto.capabilityCode.toLowerCase(),
        enabled: dto.enabled ?? true,
        required: dto.required ?? false,
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async getActiveCapabilities(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    return this.prisma.bmVersionCapability.findMany({
      where: {
        applicationVersionId,
        enabled: true,
        tenantId: tenantId ?? undefined,
      },
    });
  }

  // =====================================================================
  // DEPENDENCY / IMPACT ANALYSIS
  // =====================================================================

  async getFeatureDependencies(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    const features = await this.prisma.bmFeature.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
        status: { not: BmFeatureStatus.ARCHIVED },
      },
      include: {
        capabilities: {
          include: {
            dependencies: {
              include: {
                capability: {
                  include: { feature: true },
                },
              },
            },
          },
        },
      },
    });

    return features.map(f => ({
      code: f.code,
      name: f.name,
      status: f.status,
      capabilities: f.capabilities.map(c => ({
        code: c.code,
        name: c.name,
        status: c.status,
        required: c.required,
        requiredEntities: c.requiredEntities,
        dependencies: c.dependencies.map(d => ({
          capabilityId: d.capabilityId,
          targetCapabilityCode: d.targetCapabilityCode,
          dependencyType: d.dependencyType,
        })),
      })),
    }));
  }
  async updateCapability(id: string, dto: Partial<CreateCapabilityDto>, tenantId: string | null, archive = false) {
    const capability = await this.prisma.bmFeatureCapability.findFirst({ where: { id, tenantId: tenantId ?? undefined } });
    if (!capability) throw new PlatformException(PlatformErrorCode.APPLICATION_NOT_FOUND, 'Capability not found', HttpStatus.NOT_FOUND);
    const feature = await this.findOneFeature(capability.featureId, tenantId);
    await assertVersionWritable(this.prisma, feature.applicationVersionId, tenantId);
    if (feature.status === BmFeatureStatus.ARCHIVED || capability.status === BmCapabilityStatus.ARCHIVED) {
      throw new PlatformException(PlatformErrorCode.APPLICATION_ARCHIVED, 'Archived capability cannot be modified', HttpStatus.CONFLICT);
    }
    return this.prisma.bmFeatureCapability.update({ where: { id }, data: archive ? {status: BmCapabilityStatus.ARCHIVED} : {
      name: dto.name, description: dto.description, required: dto.required,
      requiredEntities: dto.requiredEntities, configuration: dto.configuration as any,
    } });
  }


}
