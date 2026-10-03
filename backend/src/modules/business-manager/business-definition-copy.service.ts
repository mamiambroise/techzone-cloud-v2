import { HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { PlatformErrorCode } from '../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../common/errors/platform.exception';

export type CopyBusinessDefinitionResult = {
  entities: number;
  fields: number;
  relations: number;
  constraints: number;
  indexes: number;
  computedFields: number;
  fieldValidations: number;
  features: number;
  capabilities: number;
  capabilityDependencies: number;
  menus: number;
  navigationItems: number;
  versionFeatures: number;
  versionCapabilities: number;
  configurations: number;
};

/**
 * Copie integralement la definition metier (Business Definition) d'une
 * ApplicationVersion vers une autre ApplicationVersion du meme tenant.
 *
 * Les identifiants sont regeneres et les references internes (relations,
 * contraintes, index, champs de navigation, dependances de capacites) sont
 * re-echappees vers les nouveaux objets. Les cles metier (code) sont
 * preservees : la copie est isomorphique a la source et n'introduit donc
 * aucune divergence de code dans le modele.
 *
 * Partagee par la duplication d'application et le clonage de version afin
 * qu'il n'existe qu'une seule implementation du "copier une definition".
 */
@Injectable()
export class BusinessDefinitionCopyService {
  constructor(private readonly prisma: PrismaService) {}

  async copy(
    sourceVersionId: string,
    targetVersionId: string,
    tenantId: string | null,
  ): Promise<CopyBusinessDefinitionResult> {
    const scope = { tenantId: tenantId ?? undefined };

    const sourceVersion = await this.prisma.applicationVersion.findFirst({
      where: { id: sourceVersionId, ...scope },
      select: { id: true, applicationId: true, version: true },
    });
    if (!sourceVersion) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_NOT_FOUND,
        `Application version "${sourceVersionId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const targetVersion = await this.prisma.applicationVersion.findFirst({
      where: { id: targetVersionId, ...scope },
      select: { id: true, applicationId: true },
    });
    if (!targetVersion) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_NOT_FOUND,
        `Application version "${targetVersionId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const applicationId = targetVersion.applicationId;
    const target = { applicationId, applicationVersionId: targetVersionId, ...scope };

    // ---------------------------------------------------------------- data model
    const sourceEntities = await this.prisma.bmEntity.findMany({
      where: { applicationVersionId: sourceVersionId, ...scope },
      include: {
        fields: { include: { validations: true } },
        constraints: true,
        indexes: { include: { fields: true } },
        computedFields: true,
      },
      orderBy: { code: 'asc' },
    });

    const entityIdMap = new Map<string, string>();
    const fieldIdMap = new Map<string, string>();

    let fieldCount = 0;
    let fieldValidationCount = 0;
    let constraintCount = 0;
    let indexCount = 0;
    let computedFieldCount = 0;

    for (const entity of sourceEntities) {
      const created = await this.prisma.bmEntity.create({
        data: {
          ...target,
          code: entity.code,
          name: entity.name,
          pluralName: entity.pluralName,
          description: entity.description,
          icon: entity.icon,
          status: entity.status,
          scope: entity.scope,
          classification: entity.classification,
          version: entity.version,
        },
        select: { id: true },
      });
      entityIdMap.set(entity.id, created.id);

      for (const field of entity.fields) {
        const createdField = await this.prisma.bmField.create({
          data: {
            entityId: created.id,
            code: field.code,
            label: field.label,
            description: field.description,
            type: field.type,
            required: field.required,
            unique: field.unique,
            readonly: field.readonly,
            indexed: field.indexed,
            defaultValue: field.defaultValue,
            position: field.position,
            scope: field.scope,
            classification: field.classification,
            configuration: field.configuration as never,
            version: field.version,
            tenantId: tenantId ?? undefined,
          },
          select: { id: true },
        });
        fieldIdMap.set(field.id, createdField.id);
        fieldCount += 1;

        for (const validation of field.validations) {
          await this.prisma.bmFieldValidation.create({
            data: {
              fieldId: createdField.id,
              validationType: validation.validationType,
              value: validation.value,
              message: validation.message,
              configuration: validation.configuration as never,
              version: validation.version,
              tenantId: tenantId ?? undefined,
            },
          });
          fieldValidationCount += 1;
        }
      }
    }

    // Contraintes, index et champs calculés : seconde passe, car ils
    // référencent les champs par identifiant.
    for (const entity of sourceEntities) {
      const targetEntityId = entityIdMap.get(entity.id)!;

      for (const constraint of entity.constraints) {
        await this.prisma.bmConstraint.create({
          data: {
            entityId: targetEntityId,
            fieldId: constraint.fieldId ? fieldIdMap.get(constraint.fieldId) : null,
            code: constraint.code,
            constraintType: constraint.constraintType,
            name: constraint.name,
            definition: constraint.definition as never,
            version: constraint.version,
            tenantId: tenantId ?? undefined,
          },
        });
        constraintCount += 1;
      }

      for (const index of entity.indexes) {
        const createdIndex = await this.prisma.bmIndex.create({
          data: {
            entityId: targetEntityId,
            code: index.code,
            name: index.name,
            indexType: index.indexType,
            unique: index.unique,
            definition: index.definition as never,
            version: index.version,
            tenantId: tenantId ?? undefined,
          },
          select: { id: true },
        });
        indexCount += 1;

        for (const indexField of index.fields) {
          const targetFieldId = fieldIdMap.get(indexField.fieldId);
          if (!targetFieldId) continue;
          await this.prisma.bmIndexField.create({
            data: { indexId: createdIndex.id, fieldId: targetFieldId, sort: indexField.sort, position: indexField.position },
          });
        }
      }

      for (const computed of entity.computedFields) {
        await this.prisma.bmComputedField.create({
          data: {
            ...target,
            entityId: targetEntityId,
            code: computed.code,
            name: computed.name,
            expression: computed.expression,
            targetFieldCode: computed.targetFieldCode,
            description: computed.description,
            configuration: computed.configuration as never,
            version: computed.version,
          },
        });
        computedFieldCount += 1;
      }
    }

    // ------------------------------------------------------------------ relations
    const sourceRelations = await this.prisma.bmRelation.findMany({
      where: { applicationVersionId: sourceVersionId, ...scope },
      orderBy: { code: 'asc' },
    });

    let relationCount = 0;
    for (const relation of sourceRelations) {
      const sourceEntityId = entityIdMap.get(relation.sourceEntityId);
      const targetEntityId = entityIdMap.get(relation.targetEntityId);
      // Une relation dont un bout n'a pas été recopié est abandonnée plutôt
      // que d'écrire une référence croisée vers la version source.
      if (!sourceEntityId || !targetEntityId) continue;

      await this.prisma.bmRelation.create({
        data: {
          ...target,
          sourceEntityId,
          targetEntityId,
          code: relation.code,
          relationType: relation.relationType,
          sourceLabel: relation.sourceLabel,
          targetLabel: relation.targetLabel,
          required: relation.required,
          deleteBehavior: relation.deleteBehavior,
          configuration: relation.configuration as never,
          version: relation.version,
        },
      });
      relationCount += 1;
    }

    // ------------------------------------------------------- features / capacités
    const sourceFeatures = await this.prisma.bmFeature.findMany({
      where: { applicationVersionId: sourceVersionId, ...scope },
      include: { capabilities: { include: { dependencies: true } } },
      orderBy: { code: 'asc' },
    });

    let featureCount = 0;
    let capabilityCount = 0;
    let dependencyCount = 0;

    for (const feature of sourceFeatures) {
      const createdFeature = await this.prisma.bmFeature.create({
        data: {
          ...target,
          code: feature.code,
          name: feature.name,
          description: feature.description,
          category: feature.category,
          tags: feature.tags,
          status: feature.status,
          source: feature.source,
          version: feature.version,
        },
        select: { id: true },
      });
      featureCount += 1;

      for (const capability of feature.capabilities) {
        const createdCapability = await this.prisma.bmFeatureCapability.create({
          data: {
            ...target,
            featureId: createdFeature.id,
            code: capability.code,
            name: capability.name,
            description: capability.description,
            required: capability.required,
            status: capability.status,
            requiredEntities: capability.requiredEntities,
            configuration: capability.configuration as never,
            version: capability.version,
          },
          select: { id: true },
        });
        capabilityCount += 1;

        for (const dependency of capability.dependencies) {
          await this.prisma.bmCapabilityDependency.create({
            data: {
              capabilityId: createdCapability.id,
              targetCapabilityCode: dependency.targetCapabilityCode,
              dependencyType: dependency.dependencyType,
              configuration: dependency.configuration as never,
              tenantId: tenantId ?? undefined,
            },
          });
          dependencyCount += 1;
        }
      }
    }

    // -------------------------------------------------------------- navigation
    const sourceMenus = await this.prisma.bmMenu.findMany({
      where: { applicationVersionId: sourceVersionId, ...scope },
      include: { items: true },
      orderBy: { code: 'asc' },
    });

    let menuCount = 0;
    let itemCount = 0;

    for (const menu of sourceMenus) {
      const createdMenu = await this.prisma.bmMenu.create({
        data: {
          ...target,
          code: menu.code,
          name: menu.name,
          description: menu.description,
          location: menu.location,
          status: menu.status,
          version: menu.version,
        },
        select: { id: true },
      });
      menuCount += 1;

      const itemIdMap = new Map<string, string>();
      // Deux passes : d'abord les éléments racine, puis les enfants, afin que
      // `parentItemId` pointe toujours vers un identifiant de la copie.
      for (const pass of [0, 1]) {
        for (const item of menu.items) {
          const hasParent = Boolean(item.parentItemId);
          if ((pass === 0) !== !hasParent) continue;
          const parentItemId = item.parentItemId ? itemIdMap.get(item.parentItemId) : null;
          if (item.parentItemId && !parentItemId) continue;

          const createdItem = await this.prisma.bmNavigationItem.create({
            data: {
              ...target,
              menuId: createdMenu.id,
              parentItemId,
              code: item.code,
              label: item.label,
              itemType: item.itemType,
              routePath: item.routePath,
              icon: item.icon,
              requiredCapabilities: item.requiredCapabilities,
              capabilityOperator: item.capabilityOperator,
              visibility: item.visibility,
              orderIndex: item.orderIndex,
              configuration: item.configuration as never,
              version: item.version,
            },
            select: { id: true },
          });
          itemIdMap.set(item.id, createdItem.id);
          itemCount += 1;
        }
      }
    }

    // ------------------------------------------- activations par version
    const [versionFeatures, versionCapabilities] = await Promise.all([
      this.prisma.bmVersionFeature.findMany({ where: { applicationVersionId: sourceVersionId, ...scope } }),
      this.prisma.bmVersionCapability.findMany({ where: { applicationVersionId: sourceVersionId, ...scope } }),
    ]);

    for (const activation of versionFeatures) {
      await this.prisma.bmVersionFeature.create({
        data: {
          ...target,
          featureCode: activation.featureCode,
          enabled: activation.enabled,
          activationStrategy: activation.activationStrategy,
          configuration: activation.configuration as never,
          version: activation.version,
        },
      });
    }

    for (const activation of versionCapabilities) {
      await this.prisma.bmVersionCapability.create({
        data: {
          ...target,
          featureCode: activation.featureCode,
          capabilityCode: activation.capabilityCode,
          enabled: activation.enabled,
          required: activation.required,
        },
      });
    }

    // ------------------------------------------------------------ configuration
    // La configuration métier est portée par `Configuration` avec un scope
    // APPLICATION_VERSION : elle est recopiée au même niveau, pas re-créée.
    const configurations = await this.prisma.configuration.findMany({
      where: { scope: 'APPLICATION_VERSION', scopeId: sourceVersionId, ...scope },
    });

    for (const configuration of configurations) {
      await this.prisma.configuration.create({
        data: {
          key: configuration.key,
          scope: 'APPLICATION_VERSION',
          scopeId: targetVersionId,
          type: configuration.type,
          value: configuration.value as never,
          defaultValue: configuration.defaultValue as never,
          required: configuration.required,
          schema: configuration.schema as never,
          version: configuration.version,
          status: configuration.status,
          tenantId: tenantId ?? undefined,
        },
      });
    }

    return {
      entities: sourceEntities.length,
      fields: fieldCount,
      relations: relationCount,
      constraints: constraintCount,
      indexes: indexCount,
      computedFields: computedFieldCount,
      fieldValidations: fieldValidationCount,
      features: featureCount,
      capabilities: capabilityCount,
      capabilityDependencies: dependencyCount,
      menus: menuCount,
      navigationItems: itemCount,
      versionFeatures: versionFeatures.length,
      versionCapabilities: versionCapabilities.length,
      configurations: configurations.length,
    };
  }
}