import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { MockIntegrationProvider } from '../../../common/providers/mock-integration.provider';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';
import { IntegrationException } from '../../../common/errors/integration-exception';

@Injectable()
export class ConnectorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mockProvider: MockIntegrationProvider,
  ) {}

  async create(data: {
    code: string;
    name: string;
    providerType:
      | 'REST'
      | 'GRAPHQL'
      | 'DATABASE_ADAPTER'
      | 'FILE'
      | 'MESSAGE_QUEUE'
      | 'CUSTOM_PROVIDER';
    contractVersion?: string;
    configurationSchema?: unknown;
    credentialRef?: string;
    capabilities?: unknown;
  }) {
    const existing = await this.prisma.connector.findUnique({
      where: {
        code: data.code,
      },
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `Connector with code "${data.code}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.connector.create({
      data: {
        code: data.code,
        name: data.name,
        providerType: data.providerType,
        contractVersion: data.contractVersion,
        configurationSchema: data.configurationSchema as Prisma.InputJsonValue,
        credentialRef: data.credentialRef,
        capabilities: data.capabilities as Prisma.InputJsonValue,
      },
    });
  }

  async findAll() {
    return this.prisma.connector.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.connector.findUnique({
      where: { id },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      contractVersion?: string;
      configurationSchema?: Record<string, unknown>;
      credentialRef?: string;
      capabilities?: Record<string, unknown>;
    },
  ) {
    const connector = await this.prisma.connector.findUnique({
      where: { id },
    });

    if (!connector) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Connector "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.prisma.connector.update({
      where: { id },
      data: {
        name: data.name,
        contractVersion: data.contractVersion,
        configurationSchema: data.configurationSchema as Prisma.InputJsonValue,
        credentialRef: data.credentialRef,
        capabilities: data.capabilities as Prisma.InputJsonValue,
      },
    });
  }

  async validate(id: string, configuration?: Record<string, unknown>) {
    const connector = await this.prisma.connector.findUnique({
      where: { id },
    });

    if (!connector) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Connector "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Passage en validation
    await this.prisma.connector.update({
      where: { id },
      data: {
        status: 'VALIDATING',
      },
    });

    // Utilise la configuration fournie ou celle enregistrée
    const config =
      configuration ??
      (connector.configurationSchema as Record<string, unknown> | null);

    if (!config || Object.keys(config).length === 0) {
      await this.prisma.connector.update({
        where: { id },
        data: {
          status: 'DEGRADED',
          health: 'WARNING',
        },
      });

      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PAYLOAD_INVALID,
        `Connector "${connector.code}" has no configuration`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (
      connector.providerType === 'REST' &&
      typeof (config.endpoint ?? config.baseUrl) !== 'string'
    ) {
      await this.prisma.connector.update({
        where: { id },
        data: {
          status: 'DEGRADED',
          health: 'WARNING',
        },
      });

      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PAYLOAD_INVALID,
        `Connector "${connector.code}" requires a valid endpoint`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Configuration valide
    return this.prisma.connector.update({
      where: { id },
      data: {
        status: 'READY',
        health: 'HEALTHY',
      },
    });
  }

  async healthCheck(id: string) {
    const connector = await this.prisma.connector.findUnique({
      where: { id },
    });

    if (!connector) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Connector "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const configuration =
      (connector.configurationSchema as Record<string, unknown> | null) ?? {};

    await this.mockProvider.connect(configuration);

    const health = await this.mockProvider.healthCheck();

    return this.prisma.connector.update({
      where: { id },
      data: {
        health: health.status,
        status: health.status === 'HEALTHY' ? 'READY' : 'DEGRADED',
      },
    });
  }

  async activate(id: string) {
    const connector = await this.prisma.connector.findUnique({
      where: { id },
    });

    if (!connector) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Connector "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (connector.status !== 'READY') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Connector "${connector.code}" must be READY before activation`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (connector.health !== 'HEALTHY') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Connector "${connector.code}" must be HEALTHY before activation`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.connector.update({
      where: { id },
      data: {
        status: 'ACTIVE',
      },
    });
  }

  async disable(id: string) {
    const connector = await this.prisma.connector.findUnique({
      where: { id },
    });

    if (!connector) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Connector "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (connector.status !== 'ACTIVE') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Connector "${connector.code}" must be ACTIVE before disabling`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.connector.update({
      where: { id },
      data: {
        status: 'DISABLED',
      },
    });
  }

  async archive(id: string) {
    const connector = await this.prisma.connector.findUnique({
      where: { id },
    });

    if (!connector) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Connector "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (connector.status !== 'DISABLED') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Connector "${connector.code}" must be DISABLED before archiving`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.connector.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
      },
    });
  }
}
