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
  ReleaseStatus,
  DeploymentStatus,
  DeploymentStrategy,
  EnvironmentDeploymentStatus,
  DeploymentGateType,
  DeploymentGateResult,
  DeploymentHistoryAction,
} from '../generated/prisma/enums';
import { Prisma, PrismaClient } from '../generated/prisma/client';
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

  // ============================================================
  // DEPLOYMENT MODULE (DEP-CDC-01 to DEP-CDC-07)
  // ============================================================

  await prisma.release.upsert({
    where: { id: 'c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f' },
    update: {},
    create: {
      id: 'c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f',
      code: 'techzone-core-rel',
      version: '1.0.0',
      applicationId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      applicationVersionId: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
      snapshotId: 'e1f2a3b4-c5d6-4e7f-8091-a2b3c4d5e6f7',
      artifactRefs: {
        containerImage: 'registry.techzone.internal/techzone-core:1.0.0',
        digest: 'sha256:7b49f992a8310c812d32ae18e5898d5c412f864bc81',
      },
      contractVersions: {
        'customer-identity-contract': '1.0.0',
      },
      configurationVersion: '1.0.0',
      status: ReleaseStatus.RELEASED,
      createdBy: 'release-manager@techzone.io',
      approvedAt: new Date('2026-01-16T14:00:00Z'),
      releasedAt: new Date('2026-01-16T15:00:00Z'),
      createdAt: new Date('2026-01-16T12:00:00Z'),
    },
  });

  await prisma.release.upsert({
    where: { id: 'd5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f90' },
    update: {},
    create: {
      id: 'd5e6f7a8-b9c0-4d1e-2f3a-4b5c6d7e8f90',
      code: 'techzone-core-rel',
      version: '1.1.0',
      applicationId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      applicationVersionId: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f80',
      snapshotId: 'e1f2a3b4-c5d6-4e7f-8091-a2b3c4d5e6f7',
      artifactRefs: {
        containerImage: 'registry.techzone.internal/techzone-core:1.1.0',
        digest: 'sha256:8c50e003b9421d923e43bf29f6909e6d523a975cd92',
      },
      contractVersions: {
        'customer-identity-contract': '1.0.0',
      },
      configurationVersion: '1.0.0',
      status: ReleaseStatus.APPROVED,
      createdBy: 'release-manager@techzone.io',
      approvedAt: new Date('2026-02-12T11:00:00Z'),
      releasedAt: null,
      createdAt: new Date('2026-02-12T10:00:00Z'),
    },
  });

  await prisma.deployment.upsert({
    where: { id: 'e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f90a1' },
    update: {},
    create: {
      id: 'e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f90a1',
      releaseId: 'c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f',
      environmentId: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091',
      status: DeploymentStatus.SUCCEEDED,
      strategy: DeploymentStrategy.STANDARD,
      idempotencyKey: 'idemp-init-prod-001',
      startedBy: 'deployer@techzone.io',
      startedAt: new Date('2026-01-16T15:00:00Z'),
      finishedAt: new Date('2026-01-16T15:05:00Z'),
      healthStatus: 'HEALTHY',
      traceId: 'trc-dep-init-001',
    },
  });

  await prisma.environmentDeployment.upsert({
    where: { id: 'f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f90a1b2' },
    update: {},
    create: {
      id: 'f7a8b9c0-d1e2-4f3a-4b5c-6d7e8f90a1b2',
      environmentId: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091',
      applicationId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      currentReleaseId: 'c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f',
      previousReleaseId: null,
      deploymentId: 'e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f90a1',
      deployedAt: new Date('2026-01-16T15:05:00Z'),
      healthStatus: 'HEALTHY',
      status: EnvironmentDeploymentStatus.ACTIVE,
    },
  });

  await prisma.deploymentGate.upsert({
    where: { id: 'b9c0d1e2-f3a4-4b5c-6d7e-8f90a1b2c3d4' },
    update: {},
    create: {
      id: 'b9c0d1e2-f3a4-4b5c-6d7e-8f90a1b2c3d4',
      deploymentId: 'e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f90a1',
      type: DeploymentGateType.CONTRACT_COMPATIBILITY,
      name: 'Contract Compatibility Verification',
      result: DeploymentGateResult.PASSED,
      required: true,
      message: 'All API and platform contract versions verified compatible',
      executedBy: 'automated-gate-engine',
      executedAt: new Date('2026-01-16T15:01:00Z'),
    },
  });

  await prisma.deploymentHistory.upsert({
    where: { id: 'd1e2f3a4-b5c6-4d7e-8f90-a1b2c3d4e5f6' },
    update: {},
    create: {
      id: 'd1e2f3a4-b5c6-4d7e-8f90-a1b2c3d4e5f6',
      traceId: 'trc-dep-init-001',
      releaseId: 'c4d5e6f7-a8b9-4c0d-1e2f-3a4b5c6d7e8f',
      deploymentId: 'e6f7a8b9-c0d1-4e2f-3a4b-5c6d7e8f90a1',
      applicationId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      environmentId: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091',
      action: DeploymentHistoryAction.SUCCEEDED,
      status: 'SUCCEEDED',
      startedAt: new Date('2026-01-16T15:00:00Z'),
      finishedAt: new Date('2026-01-16T15:05:00Z'),
      duration: 300,
      actor: 'deployer@techzone.io',
      metadata: {
        healthStatus: 'HEALTHY',
      },
    },
  });

  await prisma.apiDefinition.upsert({
    where: {
      id: 'f1a2b3c4-d5e6-4f70-8192-a3b4c5d6e7f8',
    },
    update: {},
    create: {
      id: 'f1a2b3c4-d5e6-4f70-8192-a3b4c5d6e7f8',
      apiCode: 'payment-gateway-api',
      version: '1.0.0',
      basePath: '/v1/payments',

      operations: [
        {
          method: 'POST',
          path: '/charge',
          description: 'Create payment charge',
        },
        {
          method: 'GET',
          path: '/transactions',
          description: 'List transactions',
        },
      ],

      authentication: 'BEARER',

      authorization: {
        roles: ['finance-admin'],
        tenantIsolation: true,
      },

      rateLimit: {
        limit: 1000,
        windowSec: 60,
      },

      requestSchema: {
        type: 'object',
        required: ['amount', 'currency'],
      },

      responseSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
          },
        },
      },

      status: 'ACTIVE',

      publishedAt: new Date('2026-01-10T10:00:00Z'),
      createdAt: new Date('2026-01-08T09:00:00Z'),
      updatedAt: new Date('2026-01-10T10:00:00Z'),
    },
  });

  await prisma.credentialReference.upsert({
    where: {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    },
    update: {},
    create: {
      id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      code: 'cred-stripe-live',
      type: 'API_KEY',
      provider: 'stripe',
      status: 'ACTIVE',

      lastRotatedAt: new Date('2026-01-01T00:00:00Z'),
      expiresAt: new Date('2027-01-01T00:00:00Z'),

      metadataSafe: {
        maskedPreview: 'sk_li••••••••a1b2',
        secretLength: 32,
        hasKeyPrefix: true,
      },

      createdAt: new Date('2026-01-01T00:00:00Z'),
      updatedAt: new Date('2026-01-01T00:00:00Z'),
    },
  });

  await prisma.webhook.upsert({
    where: {
      id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    },
    update: {},
    create: {
      id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
      code: 'stripe-inbound-charges',
      direction: 'INBOUND',
      event: 'payment.succeeded',
      endpoint: '/api/integrations/webhooks/inbound/stripe-inbound-charges',

      status: 'ACTIVE',

      secretRef: 'cred-stripe-live',

      signaturePolicy: {
        algorithm: 'sha256',
        headerName: 'x-hub-signature-256',
        toleranceSeconds: 300,
      },

      retryPolicy: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        backoffMultiplier: 2,
      },

      timeout: 5000,
      filters: {},

      createdAt: new Date('2026-01-12T08:00:00Z'),
      updatedAt: new Date('2026-01-12T08:00:00Z'),
    },
  });

  await prisma.webhookDelivery.upsert({
    where: {
      id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    },
    update: {},
    create: {
      id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      webhookId: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',

      eventId: 'evt_stripe_998822',
      attempt: 1,

      status: 'SUCCEEDED',
      httpStatus: 200,
      duration: 142,

      traceId: 'trc-webhook-stripe-001',

      startedAt: new Date('2026-01-20T14:22:00Z'),
      finishedAt: new Date('2026-01-20T14:22:01Z'),
      createdAt: new Date('2026-01-20T14:22:00Z'),
    },
  });

  await prisma.synchronization.upsert({
    where: {
      id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
    },
    update: {},
    create: {
      id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',

      code: 'sync-stripe-salesforce-contacts',

      connectorId: 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8091a2b3',

      source: 'stripe.customers',
      target: 'salesforce.contacts',

      direction: 'PUSH',
      mode: 'INCREMENTAL',

      schedule: '0 */4 * * *',

      mappingRef: 'map_cust_to_contact_v1',

      conflictPolicy: {
        strategy: 'SOURCE_WINS',
      },

      batchSize: 100,
      status: 'SUCCEEDED',

      createdAt: new Date('2026-01-15T10:00:00Z'),
      updatedAt: new Date('2026-01-22T08:30:00Z'),
    },
  });

  await prisma.integrationLog.createMany({
    data: [
      {
        id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
        traceId: 'trc-initial-sync-001',
        tenantId: 'default',
        connectorId: 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8091a2b3',

        operation: 'connector.health_check',
        direction: 'OUTBOUND',
        status: 'SUCCEEDED',

        errorCode: null,
        duration: 85,
        attempt: 1,

        startedAt: new Date('2026-01-22T08:30:00Z'),
        finishedAt: new Date('2026-01-22T08:30:01Z'),
      },

      {
        id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2',
        traceId: 'trc-initial-sync-001',
        tenantId: 'default',
        connectorId: 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8091a2b3',

        operation: 'sync.pipeline',
        direction: 'INBOUND',
        status: 'SUCCEEDED',

        errorCode: null,
        duration: 210,
        attempt: 1,

        startedAt: new Date('2026-01-22T08:30:01Z'),
        finishedAt: new Date('2026-01-22T08:30:02Z'),
      },
    ],
  });

  console.log(
    'Platform Foundation & API Integration & Deployment seed completed',
  );
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
