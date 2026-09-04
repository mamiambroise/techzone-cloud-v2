import {
  ApplicationStatus,
  ApplicationVersionStatus,
  EnvironmentType,
  EnvironmentStatus,
  ContractStatus,
  ConfigurationScope,
  ConfigurationType,
  ConfigurationStatus,
  SnapshotStatus,
  ConnectorProviderType,
  ConnectorStatus,
  ConnectorHealthStatus,
  ApiStatus,
  ApiAuthenticationType,
  CredentialType,
  CredentialStatus,
  WebhookDirection,
  WebhookStatus,
  WebhookDeliveryStatus,
  SynchronizationDirection,
  SynchronizationMode,
  SynchronizationStatus,
  IntegrationLogDirection,
  IntegrationLogStatus,
} from '../generated/prisma/enums';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/techzone',
  }),
});

async function main() {
  console.log('🌱 Starting PostgreSQL seed...');

  // ============================================================
  // APPLICATIONS
  // ============================================================

  await prisma.application.upsert({
    where: {
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    },
    update: {},
    create: {
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      code: 'techzone-core',
      name: 'TechZone Core Platform',
      description:
        'Platform foundation service providing identity and configuration orchestration',
      status: ApplicationStatus.ACTIVE,
      tenantScope: 'GLOBAL',
      createdAt: new Date('2026-01-15T10:00:00Z'),
      updatedAt: new Date('2026-01-15T10:00:00Z'),
    },
  });

  await prisma.application.upsert({
    where: {
      id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
    },
    update: {},
    create: {
      id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
      code: 'payment-gateway',
      name: 'Payment Integration Hub',
      description:
        'Handles payment connectors and webhook dispatching for transaction events',
      status: ApplicationStatus.ACTIVE,
      tenantScope: 'PAYMENTS',
      createdAt: new Date('2026-02-01T12:00:00Z'),
      updatedAt: new Date('2026-02-01T12:00:00Z'),
    },
  });

  // ============================================================
  // APPLICATION VERSIONS
  // ============================================================

  await prisma.applicationVersion.upsert({
    where: {
      id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
    },
    update: {},
    create: {
      id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
      applicationId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      version: '1.0.0',
      status: ApplicationVersionStatus.ACTIVE,
      releaseNotes: 'Initial production release of Platform Foundation',
      createdAt: new Date('2026-01-15T10:30:00Z'),
      publishedAt: new Date('2026-01-15T11:00:00Z'),
    },
  });

  await prisma.applicationVersion.upsert({
    where: {
      id: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f80',
    },
    update: {},
    create: {
      id: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f80',
      applicationId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      version: '1.1.0-rc1',
      status: ApplicationVersionStatus.READY,
      releaseNotes:
        'Release candidate with enhanced telemetry and contract validation',
      createdAt: new Date('2026-02-10T14:00:00Z'),
      publishedAt: null,
    },
  });

  // ============================================================
  // ENVIRONMENTS
  // ============================================================

  await prisma.environment.upsert({
    where: {
      id: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091',
    },
    update: {},
    create: {
      id: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091',
      code: 'production',
      name: 'Global Production',
      type: EnvironmentType.PRODUCTION,
      status: EnvironmentStatus.ACTIVE,
      region: 'europe-west2',
      baseUrl: 'https://api.techzone.internal',
      configurationRef: 'cfg-prod-v1',
      createdAt: new Date('2026-01-10T08:00:00Z'),
      updatedAt: new Date('2026-01-10T08:00:00Z'),
    },
  });

  await prisma.environment.upsert({
    where: {
      id: 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8091a2',
    },
    update: {},
    create: {
      id: 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8091a2',
      code: 'staging',
      name: 'Integration Staging',
      type: EnvironmentType.STAGING,
      status: EnvironmentStatus.ACTIVE,
      region: 'europe-west2',
      baseUrl: 'https://staging.techzone.internal',
      configurationRef: 'cfg-stage-v1',
      createdAt: new Date('2026-01-10T08:30:00Z'),
      updatedAt: new Date('2026-01-10T08:30:00Z'),
    },
  });

  await prisma.environment.upsert({
    where: {
      id: 'a1b2c3d4-e5f6-4a5b-6c7d-8e9f0a1b2c3d',
    },
    update: {},
    create: {
      id: 'a1b2c3d4-e5f6-4a5b-6c7d-8e9f0a1b2c3d',
      code: 'development',
      name: 'Local Development',
      type: EnvironmentType.DEVELOPMENT,
      status: EnvironmentStatus.ACTIVE,
      region: 'europe-west2',
      baseUrl: 'http://localhost:3000',
      configurationRef: 'cfg-dev-v1',
      createdAt: new Date('2026-01-10T09:00:00Z'),
      updatedAt: new Date('2026-01-10T09:00:00Z'),
    },
  });

  // ============================================================
  // CONNECTORS
  // ============================================================

  await prisma.connector.upsert({
    where: {
      id: 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8091a2b3',
    },
    update: {},
    create: {
      id: 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8091a2b3',
      code: 'rest-payment-v1',
      name: 'Primary Payment REST Connector',
      providerType: ConnectorProviderType.REST,
      contractVersion: '2.1.0',
      status: ConnectorStatus.ACTIVE,
      credentialRef: 'cred-stripe-live',
      health: ConnectorHealthStatus.HEALTHY,
      createdAt: new Date('2026-01-20T09:00:00Z'),
      updatedAt: new Date('2026-01-20T09:00:00Z'),
    },
  });

  await prisma.connector.upsert({
    where: {
      id: 'b8c9d0e1-f2a3-4b5c-5d6e-7f8091a2b3c4',
    },
    update: {},
    create: {
      id: 'b8c9d0e1-f2a3-4b5c-5d6e-7f8091a2b3c4',
      code: 'graphql-crm-v1',
      name: 'Customer CRM GraphQL Connector',
      providerType: ConnectorProviderType.GRAPHQL,
      contractVersion: '1.4.0',
      status: ConnectorStatus.ACTIVE,
      credentialRef: 'cred-crm-oauth',
      health: ConnectorHealthStatus.HEALTHY,
      createdAt: new Date('2026-01-22T11:00:00Z'),
      updatedAt: new Date('2026-01-22T11:00:00Z'),
    },
  });

  // ============================================================
  // CONTRACT
  // ============================================================

  await prisma.contract.upsert({
    where: {
      id: 'c9d0e1f2-a3b4-4c5d-6e7f-8091a2b3c4d5',
    },
    update: {},
    create: {
      id: 'c9d0e1f2-a3b4-4c5d-6e7f-8091a2b3c4d5',
      contractCode: 'customer-identity-contract',
      contractVersion: '1.0.0',
      ownerTeam: 'Platform Security',
      status: ContractStatus.ACTIVE,
      schema: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
          },
        },
      },
      compatibilityPolicy: {
        backwardCompatible: true,
      },
      publishedAt: new Date('2026-01-16T12:00:00Z'),
      createdAt: new Date('2026-01-16T12:00:00Z'),
      updatedAt: new Date('2026-01-16T12:00:00Z'),
    },
  });

  // ============================================================
  // CONFIGURATION
  // ============================================================

  await prisma.configuration.upsert({
    where: {
      id: 'd0e1f2a3-b4c5-4d6e-7f80-91a2b3c4d5e6',
    },
    update: {},
    create: {
      id: 'd0e1f2a3-b4c5-4d6e-7f80-91a2b3c4d5e6',
      key: 'platform.security.session_timeout',
      scope: ConfigurationScope.PLATFORM,
      scopeId: null,
      type: ConfigurationType.DURATION,
      value: '3600s',
      defaultValue: '1800s',
      required: true,
      version: '1.0.0',
      status: ConfigurationStatus.ACTIVE,
      createdAt: new Date('2026-01-12T10:00:00Z'),
      updatedAt: new Date('2026-01-12T10:00:00Z'),
    },
  });

  // ============================================================
  // SNAPSHOT
  // ============================================================

  await prisma.snapshot.upsert({
    where: {
      id: 'e1f2a3b4-c5d6-4e7f-8091-a2b3c4d5e6f7',
    },
    update: {},
    create: {
      id: 'e1f2a3b4-c5d6-4e7f-8091-a2b3c4d5e6f7',
      applicationId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      applicationVersionId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
      environmentId: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091',
      contracts: [],
      configuration: [],
      createdBy: 'system',
      hash: 'snap-hash-001',
      status: SnapshotStatus.ACTIVE,
      createdAt: new Date('2026-01-15T12:00:00Z'),
    },
  });

  console.log('✅ Platform Foundation seed completed');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
