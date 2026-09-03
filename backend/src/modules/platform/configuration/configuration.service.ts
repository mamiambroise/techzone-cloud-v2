import { HttpStatus, Injectable } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';

import {
  ConfigurationScope,
  ConfigurationStatus,
  ConfigurationType,
  ConfigurationHistoryAction,
} from '../../../generated/prisma/enums';

import { PrismaService } from '../../../prisma/prisma.service';

import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';

import { CreateConfigurationDto } from '../configuration/dto/create-config.dto';
import { UpdateConfigurationDto } from './dto/update-config.dto';

@Injectable()
export class ConfigurationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConfigurationDto) {
    const key = dto.key.trim();

    const version = dto.version ?? '1.0.0';

    // PLATFORM ne doit pas avoir de scopeId
    if (dto.scope === ConfigurationScope.PLATFORM && dto.scopeId) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_INVALID_SCOPE,
        `PLATFORM configuration cannot have a scopeId`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Les autres scopes doivent avoir un scopeId
    if (dto.scope !== ConfigurationScope.PLATFORM && !dto.scopeId) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_INVALID_SCOPE,
        `Scope "${dto.scope}" requires a scopeId`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.validateScopeTarget(dto.scope, dto.scopeId);

    // Vérifier qu'une configuration identique n'existe pas déjà
    const existing = dto.scopeId
      ? await this.prisma.configuration.findFirst({
          where: {
            key,
            scope: dto.scope,
            scopeId: dto.scopeId,
            version,
          },
        })
      : await this.prisma.configuration.findFirst({
          where: {
            key,
            scope: dto.scope,
            scopeId: null,
            version,
          },
        });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_EXISTS,
        `Configuration "${key}" version "${version}" already exists for scope "${dto.scope}"`,
        HttpStatus.CONFLICT,
      );
    }

    this.validateSecretConfiguration(dto.value, dto.schema);

    // Vérification de base de la valeur selon son type
    this.validateValueType(dto.type, dto.value, dto.schema);

    return this.prisma.$transaction(async (tx) => {
      const configuration = await tx.configuration.create({
        data: {
          key,
          scope: dto.scope,
          scopeId: dto.scopeId ?? null,
          type: dto.type,

          value:
            dto.value === undefined
              ? Prisma.JsonNull
              : (dto.value as Prisma.InputJsonValue),

          defaultValue:
            dto.defaultValue === undefined
              ? Prisma.JsonNull
              : (dto.defaultValue as Prisma.InputJsonValue),

          required: dto.required ?? false,

          schema:
            dto.schema === undefined
              ? Prisma.JsonNull
              : (dto.schema as Prisma.InputJsonValue),

          version,

          status: ConfigurationStatus.DRAFT,
        },
      });

      await tx.configurationHistory.create({
        data: {
          configurationId: configuration.id,
          action: ConfigurationHistoryAction.CREATED,

          changes: {
            key,
            scope: dto.scope,
            scopeId: dto.scopeId ?? null,
            type: dto.type,
            version,
          },

          metadata: {
            source: 'CONFIGURATION_MANAGER',
          },
        },
      });

      return configuration;
    });
  }

  async findAll() {
    return this.prisma.configuration.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async resolveEffectiveConfigurations(params: {
    applicationId: string;
    applicationVersionId: string;
    environmentId: string;
  }) {
    const { applicationId, applicationVersionId, environmentId } = params;

    const configurations = await this.prisma.configuration.findMany({
      where: {
        status: ConfigurationStatus.ACTIVE,
        OR: [
          {
            scope: ConfigurationScope.PLATFORM,
            scopeId: null,
          },
          {
            scope: ConfigurationScope.APPLICATION,
            scopeId: applicationId,
          },
          {
            scope: ConfigurationScope.APPLICATION_VERSION,
            scopeId: applicationVersionId,
          },
          {
            scope: ConfigurationScope.ENVIRONMENT,
            scopeId: environmentId,
          },
        ],
      },
      orderBy: {
        key: 'asc',
      },
    });

    const priority: Record<ConfigurationScope, number> = {
      [ConfigurationScope.PLATFORM]: 1,
      [ConfigurationScope.APPLICATION]: 2,
      [ConfigurationScope.APPLICATION_VERSION]: 3,
      [ConfigurationScope.ENVIRONMENT]: 4,
      [ConfigurationScope.TENANT]: 5,
    };

    const effective = new Map<string, (typeof configurations)[number]>();

    for (const configuration of configurations) {
      const existing = effective.get(configuration.key);

      if (
        !existing ||
        priority[configuration.scope] > priority[existing.scope]
      ) {
        effective.set(configuration.key, configuration);
      }
    }

    return Array.from(effective.values());
  }

  private validateValueType(
    type: ConfigurationType,
    value: unknown,
    schema?: unknown,
  ) {
    if (value === undefined || value === null) {
      return;
    }

    switch (type) {
      case ConfigurationType.STRING:
        if (typeof value !== 'string') {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_TYPE,
            `Configuration value must be a string`,
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      case ConfigurationType.NUMBER:
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_TYPE,
            `Configuration value must be a number`,
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      case ConfigurationType.BOOLEAN:
        if (typeof value !== 'boolean') {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_TYPE,
            `Configuration value must be a boolean`,
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      case ConfigurationType.JSON:
        if (typeof value !== 'object' || value === null) {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_TYPE,
            `Configuration value must be a JSON object`,
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      case ConfigurationType.URL:
        if (typeof value !== 'string') {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_TYPE,
            `Configuration URL must be a string`,
            HttpStatus.BAD_REQUEST,
          );
        }

        try {
          new URL(value);
        } catch {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_TYPE,
            `Configuration value must be a valid URL`,
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      case ConfigurationType.DURATION:
        if (typeof value !== 'string' || !/^\d+(ms|s|m|h|d)$/.test(value)) {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_TYPE,
            `Configuration duration must use a valid format such as "30s", "5m" or "1h"`,
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      case ConfigurationType.ENUM:
        // La vraie validation de l'enum sera faite avec `schema`
        break;
    }

    this.validateSchemaConstraints(type, value, schema);
  }

  private validateSchemaConstraints(
    type: ConfigurationType,
    value: unknown,
    schema?: unknown,
  ) {
    if (
      value === undefined ||
      value === null ||
      schema === undefined ||
      schema === null
    ) {
      return;
    }

    if (typeof schema !== 'object' || Array.isArray(schema)) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
        'Configuration schema must be a JSON object',
        HttpStatus.BAD_REQUEST,
      );
    }

    const constraints = schema as Record<string, unknown>;

    // NUMBER
    if (type === ConfigurationType.NUMBER) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return;
      }

      if (
        constraints.min !== undefined &&
        (typeof constraints.min !== 'number' ||
          !Number.isFinite(constraints.min))
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          'Configuration schema "min" must be a finite number',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        constraints.max !== undefined &&
        (typeof constraints.max !== 'number' ||
          !Number.isFinite(constraints.max))
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          'Configuration schema "max" must be a finite number',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        constraints.min !== undefined &&
        value < (constraints.min as number)
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          `Configuration value must be greater than or equal to ${constraints.min}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        constraints.max !== undefined &&
        value > (constraints.max as number)
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          `Configuration value must be less than or equal to ${constraints.max}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // STRING / URL
    if (type === ConfigurationType.STRING || type === ConfigurationType.URL) {
      if (typeof value !== 'string') {
        return;
      }

      if (
        constraints.minLength !== undefined &&
        (!Number.isInteger(constraints.minLength) ||
          (constraints.minLength as number) < 0)
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          'Configuration schema "minLength" must be a non-negative integer',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        constraints.maxLength !== undefined &&
        (!Number.isInteger(constraints.maxLength) ||
          (constraints.maxLength as number) < 0)
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          'Configuration schema "maxLength" must be a non-negative integer',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        constraints.minLength !== undefined &&
        value.length < (constraints.minLength as number)
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          `Configuration value must contain at least ${constraints.minLength} characters`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        constraints.maxLength !== undefined &&
        value.length > (constraints.maxLength as number)
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          `Configuration value must contain at most ${constraints.maxLength} characters`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (constraints.pattern !== undefined) {
        if (typeof constraints.pattern !== 'string') {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
            'Configuration schema "pattern" must be a string',
            HttpStatus.BAD_REQUEST,
          );
        }

        let regex: RegExp;

        try {
          regex = new RegExp(constraints.pattern);
        } catch {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
            'Configuration schema "pattern" must be a valid regular expression',
            HttpStatus.BAD_REQUEST,
          );
        }

        if (!regex.test(value)) {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
            'Configuration value does not match the required pattern',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }

    // DURATION
    if (type === ConfigurationType.DURATION) {
      if (typeof value !== 'string') {
        return;
      }

      const valueMs = this.durationToMilliseconds(value);

      if (
        constraints.min !== undefined &&
        typeof constraints.min !== 'string'
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          'Configuration schema "min" must be a duration string',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        constraints.max !== undefined &&
        typeof constraints.max !== 'string'
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          'Configuration schema "max" must be a duration string',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (constraints.min !== undefined) {
        const minMs = this.durationToMilliseconds(constraints.min as string);

        if (valueMs < minMs) {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
            `Configuration duration must be greater than or equal to ${constraints.min}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      if (constraints.max !== undefined) {
        const maxMs = this.durationToMilliseconds(constraints.max as string);

        if (valueMs > maxMs) {
          throw new PlatformException(
            PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
            `Configuration duration must be less than or equal to ${constraints.max}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }
  }

  private durationToMilliseconds(value: string): number {
    const match = value.match(/^(\d+)(ms|s|m|h|d)$/);

    if (!match) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
        `Invalid duration "${value}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const amount = Number(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      ms: 1,
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return amount * multipliers[unit];
  }

  private validateSecretConfiguration(value: unknown, schema?: unknown) {
    if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
      return;
    }

    const configSchema = schema as Record<string, unknown>;

    if (configSchema.secret !== true) {
      return;
    }

    if (value !== undefined && value !== null) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
        'Secret configuration values must not be stored in clear text',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async validateScopeTarget(
    scope: ConfigurationScope,
    scopeId?: string,
  ) {
    if (scope === ConfigurationScope.PLATFORM) {
      return;
    }

    if (!scopeId) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_INVALID_SCOPE,
        `Scope "${scope}" requires a scopeId`,
        HttpStatus.BAD_REQUEST,
      );
    }

    switch (scope) {
      case ConfigurationScope.APPLICATION: {
        const application = await this.prisma.application.findUnique({
          where: { id: scopeId },
          select: { id: true },
        });

        if (!application) {
          throw new PlatformException(
            PlatformErrorCode.APPLICATION_NOT_FOUND,
            `Application "${scopeId}" not found`,
            HttpStatus.NOT_FOUND,
          );
        }

        break;
      }

      case ConfigurationScope.APPLICATION_VERSION: {
        const version = await this.prisma.applicationVersion.findUnique({
          where: { id: scopeId },
          select: { id: true },
        });

        if (!version) {
          throw new PlatformException(
            PlatformErrorCode.VERSION_NOT_FOUND,
            `Application version "${scopeId}" not found`,
            HttpStatus.NOT_FOUND,
          );
        }

        break;
      }

      case ConfigurationScope.ENVIRONMENT: {
        const environment = await this.prisma.environment.findUnique({
          where: { id: scopeId },
          select: { id: true },
        });

        if (!environment) {
          throw new PlatformException(
            PlatformErrorCode.ENVIRONMENT_NOT_FOUND,
            `Environment "${scopeId}" not found`,
            HttpStatus.NOT_FOUND,
          );
        }

        break;
      }

      case ConfigurationScope.TENANT:
        // Le modèle Tenant n'existe pas encore dans ton schéma.
        // Ce scope sera traité lorsque la gestion TENANT
        // sera implémentée.
        break;
    }
  }

  async findByScope(scope: string, scopeId: string) {
    if (
      !Object.values(ConfigurationScope).includes(scope as ConfigurationScope)
    ) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_INVALID_SCOPE,
        `Invalid configuration scope: ${scope}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.configuration.findMany({
      where: {
        scope: scope as ConfigurationScope,
        scopeId,
      },
      orderBy: {
        key: 'asc',
      },
    });
  }

  async update(id: string, dto: UpdateConfigurationDto) {
    const configuration = await this.prisma.configuration.findUnique({
      where: { id },
    });

    if (!configuration) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_NOT_FOUND,
        `Configuration "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Vérifier le nouveau type de valeur
    if (dto.value !== undefined) {
      const newValue =
        dto.value !== undefined ? dto.value : configuration.value;

      const newSchema =
        dto.schema !== undefined ? dto.schema : configuration.schema;

      this.validateValueType(configuration.type, newValue, newSchema);
    }

    // Construire l'historique des changements
    const changes: Record<string, unknown> = {};

    if (dto.key !== undefined && dto.key.trim() !== configuration.key) {
      changes.key = {
        from: configuration.key,
        to: dto.key.trim(),
      };
    }

    if (dto.value !== undefined) {
      changes.value = {
        from: configuration.value,
        to: dto.value,
      };
    }

    if (dto.defaultValue !== undefined) {
      changes.defaultValue = {
        from: configuration.defaultValue,
        to: dto.defaultValue,
      };
    }

    if (dto.required !== undefined && dto.required !== configuration.required) {
      changes.required = {
        from: configuration.required,
        to: dto.required,
      };
    }

    if (dto.schema !== undefined) {
      changes.schema = {
        from: configuration.schema,
        to: dto.schema,
      };
    }

    // Aucun changement
    if (Object.keys(changes).length === 0) {
      return configuration;
    }

    /*
     * Une configuration ACTIVE est immutable.
     * Toute modification crée une nouvelle version.
     */
    if (configuration.status === ConfigurationStatus.ACTIVE) {
      const newVersion = this.incrementPatchVersion(configuration.version);

      // Vérifier que cette nouvelle version n'existe pas déjà
      const existingVersion = await this.prisma.configuration.findFirst({
        where: {
          key: dto.key?.trim() ?? configuration.key,
          scope: configuration.scope,
          scopeId: configuration.scopeId,
          version: newVersion,
        },
      });

      if (existingVersion) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_EXISTS,
          `Configuration "${configuration.key}" version "${newVersion}" already exists`,
          HttpStatus.CONFLICT,
        );
      }

      return this.prisma.$transaction(async (tx) => {
        const newConfiguration = await tx.configuration.create({
          data: {
            key: dto.key?.trim() ?? configuration.key,

            scope: configuration.scope,
            scopeId: configuration.scopeId,

            type: configuration.type,

            value:
              dto.value !== undefined
                ? (dto.value as Prisma.InputJsonValue)
                : (configuration.value as Prisma.InputJsonValue),

            defaultValue:
              dto.defaultValue !== undefined
                ? (dto.defaultValue as Prisma.InputJsonValue)
                : (configuration.defaultValue as Prisma.InputJsonValue),

            required:
              dto.required !== undefined
                ? dto.required
                : configuration.required,

            schema:
              dto.schema !== undefined
                ? (dto.schema as Prisma.InputJsonValue)
                : (configuration.schema as Prisma.InputJsonValue),

            version: newVersion,

            status: ConfigurationStatus.DRAFT,
          },
        });

        // Historique sur l'ancienne configuration
        await tx.configurationHistory.create({
          data: {
            configurationId: configuration.id,
            action: ConfigurationHistoryAction.UPDATED,
            changes: {
              ...changes,
              newVersion,
            },
            metadata: {
              source: 'CONFIGURATION_MANAGER',
              reason: 'ACTIVE_CONFIGURATION_VERSIONING',
            },
          },
        });

        // Historique sur la nouvelle configuration
        await tx.configurationHistory.create({
          data: {
            configurationId: newConfiguration.id,
            action: ConfigurationHistoryAction.CREATED,
            changes: {
              basedOn: configuration.id,
              previousVersion: configuration.version,
              newVersion,
            },
            metadata: {
              source: 'CONFIGURATION_MANAGER',
              reason: 'ACTIVE_CONFIGURATION_VERSIONING',
            },
          },
        });

        return newConfiguration;
      });
    }

    /*
     * DRAFT / READY / autres états modifiables :
     * modification de la configuration existante.
     */
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.configuration.update({
        where: { id },
        data: {
          ...(dto.key !== undefined && {
            key: dto.key.trim(),
          }),

          ...(dto.value !== undefined && {
            value: dto.value as Prisma.InputJsonValue,
          }),

          ...(dto.defaultValue !== undefined && {
            defaultValue: dto.defaultValue as Prisma.InputJsonValue,
          }),

          ...(dto.required !== undefined && {
            required: dto.required,
          }),

          ...(dto.schema !== undefined && {
            schema: dto.schema as Prisma.InputJsonValue,
          }),
        },
      });

      await tx.configurationHistory.create({
        data: {
          configurationId: configuration.id,
          action: ConfigurationHistoryAction.UPDATED,
          changes: changes as Prisma.InputJsonValue,
          metadata: {
            source: 'CONFIGURATION_MANAGER',
          },
        },
      });

      return updated;
    });
  }

  private incrementPatchVersion(version: string): string {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);

    if (!match) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
        `Invalid configuration version "${version}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]) + 1;

    return `${major}.${minor}.${patch}`;
  }

  async validate(id: string) {
    const configuration = await this.prisma.configuration.findUnique({
      where: { id },
    });

    if (!configuration) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_NOT_FOUND,
        `Configuration "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Une configuration déjà active ou archivée ne doit pas être revalidée
    if (
      configuration.status === ConfigurationStatus.ACTIVE ||
      configuration.status === ConfigurationStatus.ARCHIVED ||
      configuration.status === ConfigurationStatus.DEPRECATED
    ) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_IMMUTABLE,
        `Configuration "${id}" cannot be validated in status "${configuration.status}"`,
        HttpStatus.CONFLICT,
      );
    }

    // Une valeur obligatoire doit être présente
    if (
      configuration.required &&
      (configuration.value === null || configuration.value === undefined)
    ) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
        `Configuration "${configuration.key}" requires a value`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Vérification du type
    if (configuration.value !== null && configuration.value !== undefined) {
      this.validateValueType(
        configuration.type,
        configuration.value,
        configuration.schema,
      );
    }

    // Validation spécifique ENUM
    if (configuration.type === ConfigurationType.ENUM) {
      const schema = configuration.schema;

      if (
        !schema ||
        typeof schema !== 'object' ||
        Array.isArray(schema) ||
        !('values' in schema)
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          `ENUM configuration "${configuration.key}" must define allowed values in schema`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const allowedValues = (schema as { values?: unknown }).values;

      if (!Array.isArray(allowedValues) || allowedValues.length === 0) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          `ENUM configuration "${configuration.key}" must define a non-empty "values" array`,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (
        configuration.value !== null &&
        configuration.value !== undefined &&
        !allowedValues.includes(configuration.value)
      ) {
        throw new PlatformException(
          PlatformErrorCode.CONFIGURATION_INVALID_VALUE,
          `Value of "${configuration.key}" is not allowed`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // Passage temporaire en VALIDATING
      await tx.configuration.update({
        where: { id },
        data: {
          status: ConfigurationStatus.VALIDATING,
        },
      });

      await tx.configurationHistory.create({
        data: {
          configurationId: configuration.id,
          action: ConfigurationHistoryAction.VALIDATED,
          changes: {
            from: configuration.status,
            to: ConfigurationStatus.VALIDATING,
          },
          metadata: {
            source: 'CONFIGURATION_MANAGER',
          },
        },
      });

      // Validation réussie → READY
      const validated = await tx.configuration.update({
        where: { id },
        data: {
          status: ConfigurationStatus.READY,
        },
      });

      await tx.configurationHistory.create({
        data: {
          configurationId: configuration.id,
          action: ConfigurationHistoryAction.VALIDATED,
          changes: {
            from: ConfigurationStatus.VALIDATING,
            to: ConfigurationStatus.READY,
          },
          metadata: {
            source: 'CONFIGURATION_MANAGER',
          },
        },
      });

      return validated;
    });
  }

  async activate(id: string) {
    const configuration = await this.prisma.configuration.findUnique({
      where: { id },
    });

    if (!configuration) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_NOT_FOUND,
        `Configuration "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Seule une configuration READY peut être activée
    if (configuration.status !== ConfigurationStatus.READY) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_IMMUTABLE,
        `Configuration "${id}" cannot be activated in status "${configuration.status}"`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Chercher l'ancienne version ACTIVE
      const previousActive = await tx.configuration.findFirst({
        where: {
          key: configuration.key,
          scope: configuration.scope,
          scopeId: configuration.scopeId,
          status: ConfigurationStatus.ACTIVE,
          id: {
            not: configuration.id,
          },
        },
      });

      // Déprécier l'ancienne version si elle existe
      if (previousActive) {
        await tx.configuration.update({
          where: {
            id: previousActive.id,
          },
          data: {
            status: ConfigurationStatus.DEPRECATED,
          },
        });

        await tx.configurationHistory.create({
          data: {
            configurationId: previousActive.id,
            action: ConfigurationHistoryAction.DEPRECATED,
            changes: {
              from: ConfigurationStatus.ACTIVE,
              to: ConfigurationStatus.DEPRECATED,
              replacedBy: configuration.id,
              newVersion: configuration.version,
            },
            metadata: {
              source: 'CONFIGURATION_MANAGER',
              reason: 'NEW_CONFIGURATION_VERSION_ACTIVATED',
            },
          },
        });
      }

      // Activer la nouvelle version
      const activated = await tx.configuration.update({
        where: {
          id: configuration.id,
        },
        data: {
          status: ConfigurationStatus.ACTIVE,
        },
      });

      // Historique de l'activation
      await tx.configurationHistory.create({
        data: {
          configurationId: configuration.id,
          action: ConfigurationHistoryAction.ACTIVATED,
          changes: {
            from: ConfigurationStatus.READY,
            to: ConfigurationStatus.ACTIVE,
            previousVersion: previousActive?.version ?? null,
            previousConfigurationId: previousActive?.id ?? null,
          },
          metadata: {
            source: 'CONFIGURATION_MANAGER',
          },
        },
      });

      return activated;
    });
  }

  async getHistory(id: string) {
    const configuration = await this.prisma.configuration.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!configuration) {
      throw new PlatformException(
        PlatformErrorCode.CONFIGURATION_NOT_FOUND,
        `Configuration "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.configurationHistory.findMany({
      where: {
        configurationId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
