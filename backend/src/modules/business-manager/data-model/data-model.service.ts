import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';
import { BmEntityStatus, BmRelationType } from '../../../generated/prisma/enums';
import { assertVersionWritable } from '../version-mutability';
import {
  CreateEntityDto,
  CreateFieldDto,
  CreateRelationDto,
  CreateConstraintDto,
  CreateIndexDto,
  CreateFieldValidationDto,
  CreateComputedFieldDto,
  UpdateEntityDto,
} from './dto/create-data-model.dto';

@Injectable()
export class DataModelService {
  constructor(private readonly prisma: PrismaService) {}

/**
   * Résout la version propriétaire d'une entité puis vérifie qu'elle accepte
   * encore une écriture. Centralise l'immuabilité des versions publiées pour
   * toutes les écritures « enfant » (champs, contraintes, index, …).
   */
  private async assertEntityVersionWritable(entityId: string, tenantId: string | null) {
    const entity = await this.prisma.bmEntity.findFirst({
      where: { id: entityId, tenantId: tenantId ?? undefined },
      select: { id: true, applicationVersionId: true },
    });

    if (!entity) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Entity "${entityId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    await assertVersionWritable(this.prisma, entity.applicationVersionId, tenantId);
    return entity;
  }

  /** Variante champ : résout l'entité propriétaire du champ. */
  private async assertFieldVersionWritable(fieldId: string, tenantId: string | null) {
    const field = await this.prisma.bmField.findFirst({
      where: { id: fieldId, tenantId: tenantId ?? undefined },
      select: { id: true, entityId: true },
    });

    if (!field) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Field "${fieldId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.assertEntityVersionWritable(field.entityId, tenantId);
    return field;
  }

  // =====================================================================
  // ENTITY MANAGER
  // =====================================================================

  async ensureApplicationVersionExists(applicationVersionId: string, tenantId: string | null) {
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

  async createEntity(applicationVersionId: string, dto: CreateEntityDto, tenantId: string | null) {
    await assertVersionWritable(this.prisma, applicationVersionId, tenantId);

    const code = dto.code.trim().toLowerCase();

    const existing = await this.prisma.bmEntity.findFirst({
      where: {
        applicationVersionId,
        code,
        tenantId: tenantId ?? undefined,
      },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_CODE_EXISTS,
        `Entity with code "${code}" already exists in this version`,
        HttpStatus.CONFLICT,
      );
    }

    const appVersion = await this.prisma.applicationVersion.findUnique({
      where: { id: applicationVersionId },
      select: { applicationId: true },
    });

    return this.prisma.bmEntity.create({
      data: {
        applicationId: appVersion?.applicationId ?? '',
        applicationVersionId,
        code,
        name: dto.name,
        pluralName: dto.pluralName,
        description: dto.description,
        icon: dto.icon,
        scope: dto.scope || undefined,
        classification: dto.classification || undefined,
        version: dto.version || '1.0.0',
        status: BmEntityStatus.DRAFT,
        tenantId: tenantId ?? undefined,
      },
      include: {
        fields: { take: 50, orderBy: { position: 'asc' } },
        constraints: true,
        indexes: { include: { fields: { take: 20 } } },
        computedFields: true,
      },
    });
  }

  async findAllEntities(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    return this.prisma.bmEntity.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        fields: { take: 100, orderBy: { position: 'asc' } },
        constraints: true,
        indexes: true,
      },
    });
  }

  async findOneEntity(id: string, tenantId: string | null) {
    const entity = await this.prisma.bmEntity.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
      include: {
        fields: { orderBy: { position: 'asc' } },
        constraints: true,
        indexes: { include: { fields: true } },
        computedFields: true,
      },
    });

    if (!entity) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Entity "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return entity;
  }

  async updateEntity(id: string, dto: UpdateEntityDto, tenantId: string | null) {
    await this.assertEntityVersionWritable(id, tenantId);
    const entity = await this.findOneEntity(id, tenantId);

    if (entity.status === BmEntityStatus.ARCHIVED) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_ARCHIVED,
        'Archived entity cannot be modified',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.bmEntity.update({
      where: { id },
      data: {
        name: dto.name,
        pluralName: dto.pluralName,
        description: dto.description,
        icon: dto.icon,
        scope: dto.scope !== undefined ? dto.scope : undefined,
        classification: dto.classification !== undefined ? dto.classification : undefined,
      },
      include: {
        fields: { orderBy: { position: 'asc' } },
      },
    });
  }

  async archiveEntity(id: string, tenantId: string | null) {
    await this.assertEntityVersionWritable(id, tenantId);
    const entity = await this.findOneEntity(id, tenantId);
    if (entity.status === BmEntityStatus.ARCHIVED) return entity;

    return this.prisma.bmEntity.update({
      where: { id },
      data: { status: BmEntityStatus.ARCHIVED },
    });
  }

  async getEntitySchema(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    return this.prisma.bmEntity.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      include: {
        fields: { orderBy: { position: 'asc' } },
        constraints: true,
        indexes: { include: { fields: true } },
        computedFields: true,
      },
    });
  }

  // =====================================================================
  // FIELD MANAGER
  // =====================================================================

  async createField(entityId: string, dto: CreateFieldDto, tenantId: string | null) {
    await this.assertEntityVersionWritable(entityId, tenantId);
    const entity = await this.prisma.bmEntity.findFirst({
      where: { id: entityId, tenantId: tenantId ?? undefined },
    });

    if (!entity) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Entity "${entityId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const code = dto.code.trim().toLowerCase();

    const existing = await this.prisma.bmField.findFirst({
      where: { entityId, code },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_CODE_EXISTS,
        `Field with code "${code}" already exists in this entity`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.bmField.create({
      data: {
        entityId,
        code,
        label: dto.label,
        description: dto.description,
        type: dto.type,
        required: dto.required ?? false,
        unique: dto.unique ?? false,
        readonly: dto.readonly ?? false,
        indexed: dto.indexed ?? false,
        defaultValue: dto.defaultValue,
        position: dto.position ?? 0,
        scope: dto.scope || undefined,
        classification: dto.classification || undefined,
        configuration: (dto.configuration || undefined) as any,
        version: dto.version || '1.0.0',
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async findFieldsByEntity(entityId: string, tenantId: string | null) {
    const entity = await this.prisma.bmEntity.findFirst({
      where: { id: entityId, tenantId: tenantId ?? undefined },
    });

    if (!entity) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Entity "${entityId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.bmField.findMany({
      where: { entityId },
      orderBy: { position: 'asc' },
    });
  }

  async updateField(id: string, dto: Partial<CreateFieldDto>, tenantId: string | null) {
    await this.assertFieldVersionWritable(id, tenantId);
    const field = await this.prisma.bmField.findFirst({
      where: { id, tenantId: tenantId ?? undefined },
    });

    if (!field) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Field "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.bmField.update({
      where: { id },
      data: {
        label: dto.label,
        description: dto.description,
        required: dto.required,
        type: dto.type,
        unique: dto.unique,
        readonly: dto.readonly,
        indexed: dto.indexed,
        defaultValue: dto.defaultValue,
        position: dto.position,
        scope: dto.scope,
        classification: dto.classification,
        configuration: dto.configuration as any,
      },
    });
  }

  async deleteField(id: string, tenantId: string | null) {
    await this.assertFieldVersionWritable(id, tenantId);
    const field = await this.prisma.bmField.findFirst({
      where: { id, tenantId: tenantId ?? undefined },
    });

    if (!field) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Field "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.bmField.delete({ where: { id } });
  }

  // =====================================================================
  // RELATION BUILDER
  // =====================================================================

async createRelation(applicationVersionId: string, dto: CreateRelationDto, tenantId: string | null) {
    await assertVersionWritable(this.prisma, applicationVersionId, tenantId);

    for (const id of [dto.sourceEntityId, dto.targetEntityId]) {
      const entity = await this.findOneEntity(id, tenantId);
      if (entity.applicationVersionId !== applicationVersionId) {
        throw new PlatformException(PlatformErrorCode.VERSION_NOT_FOUND, 'Entity does not belong to this version', HttpStatus.NOT_FOUND);
      }
    }

    return this.prisma.bmRelation.create({
      data: {
        applicationVersionId,
        code: dto.code.trim().toLowerCase(),
        sourceEntityId: dto.sourceEntityId,
        targetEntityId: dto.targetEntityId,
        relationType: dto.relationType || BmRelationType.ONE_TO_MANY,
        sourceLabel: dto.sourceLabel,
        targetLabel: dto.targetLabel,
        required: dto.required ?? false,
        deleteBehavior: dto.deleteBehavior || 'RESTRICT',
        configuration: (dto.configuration || undefined) as any,
        version: dto.version || '1.0.0',
        tenantId: tenantId ?? undefined,
      },
    });
  }

  async findRelationsByVersion(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    return this.prisma.bmRelation.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // =====================================================================
  // CONSTRAINT MANAGER
  // =====================================================================

  async createConstraint(entityId: string, dto: CreateConstraintDto, tenantId: string | null) {
    await this.assertEntityVersionWritable(entityId, tenantId);
    const entity = await this.prisma.bmEntity.findFirst({
      where: { id: entityId, tenantId: tenantId ?? undefined },
    });

    if (!entity) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Entity "${entityId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (dto.fieldId) {
      const field = await this.prisma.bmField.findFirst({ where: { id: dto.fieldId, entityId, tenantId: tenantId ?? undefined } });
      if (!field) throw new PlatformException(PlatformErrorCode.APPLICATION_NOT_FOUND, 'Field not found in this entity', HttpStatus.NOT_FOUND);
    }

    return this.prisma.bmConstraint.create({
      data: {
        entityId,
        fieldId: dto.fieldId || undefined,
        code: dto.code.trim().toLowerCase(),
        name: dto.name,
        definition: (dto.definition || undefined) as any,
        version: dto.version || '1.0.0',
        tenantId: tenantId ?? undefined,
      },
    });
  }

  // =====================================================================
  // INDEX MANAGER
  // =====================================================================

  async createIndex(entityId: string, dto: CreateIndexDto, tenantId: string | null) {
    await this.assertEntityVersionWritable(entityId, tenantId);
    const entity = await this.prisma.bmEntity.findFirst({
      where: { id: entityId, tenantId: tenantId ?? undefined },
    });

    if (!entity) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Entity "${entityId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.bmIndex.create({
      data: {
        entityId,
        code: dto.code.trim().toLowerCase(),
        name: dto.name,
        indexType: dto.indexType || 'SIMPLE',
        unique: dto.unique ?? false,
        definition: (dto.definition || undefined) as any,
        version: dto.version || '1.0.0',
        tenantId: tenantId ?? undefined,
        fields: dto.fieldIds
          ? {
              create: dto.fieldIds.map((fid, idx) => ({
                fieldId: fid,
                position: idx,
                sort: 'ASC',
              })),
            }
          : undefined,
      },
    });
  }

  // =====================================================================
  // VALIDATION ENGINE
  // =====================================================================

async createFieldValidation(dto: CreateFieldValidationDto, tenantId: string | null) {
    await this.assertFieldVersionWritable(dto.fieldId, tenantId);

    const field = await this.prisma.bmField.findFirst({
      where: { id: dto.fieldId, tenantId: tenantId ?? undefined },
    });

    if (!field) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Field "${dto.fieldId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.bmFieldValidation.create({
      data: {
        fieldId: dto.fieldId,
        validationType: dto.validationType as any,
        value: dto.value,
        message: dto.message,
        configuration: (dto.configuration || undefined) as any,
        version: dto.version || '1.0.0',
        tenantId: tenantId ?? undefined,
      },
    });
  }

  // =====================================================================
  // COMPUTED FIELD ENGINE
  // =====================================================================

async createComputedField(applicationVersionId: string, entityId: string, dto: CreateComputedFieldDto, tenantId: string | null) {
    await assertVersionWritable(this.prisma, applicationVersionId, tenantId);
    await this.assertEntityVersionWritable(entityId, tenantId);

    const entity = await this.prisma.bmEntity.findFirst({
      where: { id: entityId, tenantId: tenantId ?? undefined },
    });

    if (!entity) {
      throw new PlatformException(
        PlatformErrorCode.APPLICATION_NOT_FOUND,
        `Entity "${entityId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const appVersion = await this.prisma.applicationVersion.findUnique({
      where: { id: applicationVersionId },
      select: { applicationId: true },
    });

    return this.prisma.bmComputedField.create({
      data: {
        applicationId: appVersion?.applicationId ?? '',
        applicationVersionId,
        entityId,
        code: dto.code.trim().toLowerCase(),
        name: dto.name,
        expression: dto.expression,
        targetFieldCode: dto.targetFieldCode,
        description: dto.description,
        configuration: (dto.configuration || undefined) as any,
        version: dto.version || '1.0.0',
        tenantId: tenantId ?? undefined,
      },
    });
  }

  // =====================================================================
  // DEPENDENCY / IMPACT ANALYSIS
  // =====================================================================

  async getDependencyGraph(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    const entities = await this.prisma.bmEntity.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
      select: { id: true, code: true, name: true },
    });

    const relations = await this.prisma.bmRelation.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
    });

    const features = await this.prisma.bmFeature.findMany({
      where: { applicationVersionId, tenantId: tenantId ?? undefined },
      include: { capabilities: true },
    });

    return {
      entities: entities.map(e => ({ id: e.id, code: e.code, name: e.name })),
      relations: relations.map(r => ({
        code: r.code,
        sourceEntityId: r.sourceEntityId,
        targetEntityId: r.targetEntityId,
        relationType: r.relationType,
        deleteBehavior: r.deleteBehavior,
      })),
      features: features.map(f => ({
        code: f.code,
        name: f.name,
        status: f.status,
        capabilities: f.capabilities.map(c => ({
          code: c.code,
          name: c.name,
          required: c.required,
        })),
      })),
    };
  }
}


