// import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { PrismaClient } from '../generated/prisma/client';

// @Injectable()
// export class PrismaService
//   extends PrismaClient
//   implements OnModuleInit, OnModuleDestroy
// {
//   constructor() {
//     const adapter = new PrismaPg({
//       connectionString: process.env.DATABASE_URL!,
//     });

//     super({ adapter });
//   }

//   async onModuleInit() {
//     await this.$connect();
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//   }
// }

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { randomUUID } from 'crypto';

class InMemoryStore {
  private tables = new Map<string, Map<string, any>>();

  constructor() {
    this.seed();
  }

  private getTable(model: string): Map<string, any> {
    const key = model.toLowerCase();
    let table = this.tables.get(key);
    if (!table) {
      table = new Map<string, any>();
      this.tables.set(key, table);
    }
    return table;
  }

  private seed() {
    const appTable = this.getTable('application');
    const versionTable = this.getTable('applicationversion');
    const envTable = this.getTable('environment');
    const connTable = this.getTable('connector');
    const contractTable = this.getTable('contract');
    const configTable = this.getTable('configuration');
    const snapshotTable = this.getTable('snapshot');

    const app1 = {
      id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
      code: 'techzone-core',
      name: 'TechZone Core Platform',
      description:
        'Platform foundation service providing identity and configuration orchestration',
      status: 'ACTIVE',
      tenantScope: 'global',
      createdAt: new Date('2026-01-15T10:00:00Z'),
      updatedAt: new Date('2026-01-15T10:00:00Z'),
    };
    appTable.set(app1.id, app1);

    const app2 = {
      id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
      code: 'payment-gateway',
      name: 'Payment Integration Hub',
      description:
        'Handles payment connectors and webhook dispatching for transaction events',
      status: 'ACTIVE',
      tenantScope: 'payments',
      createdAt: new Date('2026-02-01T12:00:00Z'),
      updatedAt: new Date('2026-02-01T12:00:00Z'),
    };
    appTable.set(app2.id, app2);

    const v1 = {
      id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
      applicationId: app1.id,
      version: '1.0.0',
      status: 'ACTIVE',
      releaseNotes: 'Initial production release of Platform Foundation',
      createdAt: new Date('2026-01-15T10:30:00Z'),
      publishedAt: new Date('2026-01-15T11:00:00Z'),
    };
    versionTable.set(v1.id, v1);

    const v2 = {
      id: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f80',
      applicationId: app1.id,
      version: '1.1.0-rc1',
      status: 'READY',
      releaseNotes:
        'Release candidate with enhanced telemetry and contract validation',
      createdAt: new Date('2026-02-10T14:00:00Z'),
      publishedAt: null,
    };
    versionTable.set(v2.id, v2);

    const env1 = {
      id: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8091',
      code: 'production',
      name: 'Global Production',
      type: 'PRODUCTION',
      status: 'ACTIVE',
      region: 'europe-west2',
      baseUrl: 'https://api.techzone.internal',
      configurationRef: 'cfg-prod-v1',
      createdAt: new Date('2026-01-10T08:00:00Z'),
      updatedAt: new Date('2026-01-10T08:00:00Z'),
    };
    envTable.set(env1.id, env1);

    const env2 = {
      id: 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8091a2',
      code: 'staging',
      name: 'Integration Staging',
      type: 'STAGING',
      status: 'ACTIVE',
      region: 'europe-west2',
      baseUrl: 'https://staging.techzone.internal',
      configurationRef: 'cfg-stage-v1',
      createdAt: new Date('2026-01-10T08:30:00Z'),
      updatedAt: new Date('2026-01-10T08:30:00Z'),
    };
    envTable.set(env2.id, env2);

    const env3 = {
      id: 'a1b2c3d4-e5f6-4a5b-6c7d-8e9f0a1b2c3d',
      code: 'development',
      name: 'Local Development',
      type: 'DEVELOPMENT',
      status: 'ACTIVE',
      region: 'europe-west2',
      baseUrl: 'http://localhost:3000',
      configurationRef: 'cfg-dev-v1',
      createdAt: new Date('2026-01-10T09:00:00Z'),
      updatedAt: new Date('2026-01-10T09:00:00Z'),
    };
    envTable.set(env3.id, env3);

    const conn1 = {
      id: 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8091a2b3',
      code: 'rest-payment-v1',
      name: 'Primary Payment REST Connector',
      providerType: 'REST',
      contractVersion: '2.1.0',
      status: 'ACTIVE',
      credentialRef: 'cred-stripe-live',
      health: 'HEALTHY',
      createdAt: new Date('2026-01-20T09:00:00Z'),
      updatedAt: new Date('2026-01-20T09:00:00Z'),
    };
    connTable.set(conn1.id, conn1);

    const conn2 = {
      id: 'b8c9d0e1-f2a3-4b5c-5d6e-7f8091a2b3c4',
      code: 'graphql-crm-v1',
      name: 'Customer CRM GraphQL Connector',
      providerType: 'GRAPHQL',
      contractVersion: '1.4.0',
      status: 'ACTIVE',
      credentialRef: 'cred-crm-oauth',
      health: 'HEALTHY',
      createdAt: new Date('2026-01-22T11:00:00Z'),
      updatedAt: new Date('2026-01-22T11:00:00Z'),
    };
    connTable.set(conn2.id, conn2);

    const contract1 = {
      id: 'c9d0e1f2-a3b4-4c5d-6e7f-8091a2b3c4d5',
      contractCode: 'customer-identity-contract',
      contractVersion: '1.0.0',
      ownerTeam: 'Platform Security',
      status: 'ACTIVE',
      schema: { type: 'object', properties: { userId: { type: 'string' } } },
      compatibilityPolicy: { backwardCompatible: true },
      publishedAt: new Date('2026-01-16T12:00:00Z'),
      createdAt: new Date('2026-01-16T12:00:00Z'),
      updatedAt: new Date('2026-01-16T12:00:00Z'),
    };
    contractTable.set(contract1.id, contract1);

    const config1 = {
      id: 'd0e1f2a3-b4c5-4d6e-7f80-91a2b3c4d5e6',
      key: 'platform.security.session_timeout',
      scope: 'PLATFORM',
      scopeId: null,
      type: 'DURATION',
      value: '3600s',
      defaultValue: '1800s',
      required: true,
      version: '1.0.0',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-12T10:00:00Z'),
      updatedAt: new Date('2026-01-12T10:00:00Z'),
    };
    configTable.set(config1.id, config1);

    const snap1 = {
      id: 'e1f2a3b4-c5d6-4e7f-8091-a2b3c4d5e6f7',
      applicationId: app1.id,
      applicationVersionId: v1.id,
      environmentId: env1.id,
      contracts: [],
      configuration: [],
      createdBy: 'system',
      hash: 'snap-hash-001',
      status: 'ACTIVE',
      createdAt: new Date('2026-01-15T12:00:00Z'),
    };
    snapshotTable.set(snap1.id, snap1);

    // Seed Integration models (API-CDC-00 to API-CDC-07)
    const apiDefTable = this.getTable('apidefinition');
    const api1 = {
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
      authorization: { roles: ['finance-admin'], tenantIsolation: true },
      rateLimit: { limit: 1000, windowSec: 60 },
      requestSchema: { type: 'object', required: ['amount', 'currency'] },
      responseSchema: {
        type: 'object',
        properties: { id: { type: 'string' } },
      },
      status: 'ACTIVE',
      publishedAt: new Date('2026-01-10T10:00:00Z'),
      createdAt: new Date('2026-01-08T09:00:00Z'),
      updatedAt: new Date('2026-01-10T10:00:00Z'),
    };
    apiDefTable.set(api1.id, api1);

    const credTable = this.getTable('credentialreference');
    const cred1 = {
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
    };
    credTable.set(cred1.id, cred1);

    const webhookTable = this.getTable('webhook');
    const deliveryTable = this.getTable('webhookdelivery');
    const hook1 = {
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
      filters: null,
      createdAt: new Date('2026-01-12T08:00:00Z'),
      updatedAt: new Date('2026-01-12T08:00:00Z'),
    };
    webhookTable.set(hook1.id, hook1);

    const deliv1 = {
      id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
      webhookId: hook1.id,
      eventId: 'evt_stripe_998822',
      attempt: 1,
      status: 'SUCCEEDED',
      httpStatus: 200,
      duration: 142,
      traceId: 'trc-webhook-stripe-001',
      startedAt: new Date('2026-01-20T14:22:00Z'),
      finishedAt: new Date('2026-01-20T14:22:01Z'),
      createdAt: new Date('2026-01-20T14:22:00Z'),
    };
    deliveryTable.set(deliv1.id, deliv1);

    const syncTable = this.getTable('synchronization');
    const sync1 = {
      id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
      code: 'sync-stripe-salesforce-contacts',
      connectorId: conn1.id,
      source: 'stripe.customers',
      target: 'salesforce.contacts',
      direction: 'PUSH',
      mode: 'INCREMENTAL',
      schedule: '0 */4 * * *',
      mappingRef: 'map_cust_to_contact_v1',
      conflictPolicy: { strategy: 'SOURCE_WINS' },
      batchSize: 100,
      status: 'SUCCEEDED',
      createdAt: new Date('2026-01-15T10:00:00Z'),
      updatedAt: new Date('2026-01-22T08:30:00Z'),
    };
    syncTable.set(sync1.id, sync1);

    const logTable = this.getTable('integrationlog');
    const log1 = {
      id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
      traceId: 'trc-initial-sync-001',
      tenantId: 'default',
      connectorId: conn1.id,
      operation: 'connector.health_check',
      direction: 'OUTBOUND',
      status: 'SUCCEEDED',
      errorCode: null,
      duration: 85,
      attempt: 1,
      startedAt: new Date('2026-01-22T08:30:00Z'),
      finishedAt: new Date('2026-01-22T08:30:01Z'),
    };
    const log2 = {
      id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8091a2',
      traceId: 'trc-initial-sync-001',
      tenantId: 'default',
      connectorId: conn1.id,
      operation: 'sync.pipeline',
      direction: 'PUSH',
      status: 'SUCCEEDED',
      errorCode: null,
      duration: 210,
      attempt: 1,
      startedAt: new Date('2026-01-22T08:30:01Z'),
      finishedAt: new Date('2026-01-22T08:30:02Z'),
    };
    logTable.set(log1.id, log1);
    logTable.set(log2.id, log2);
  }

  private matches(item: any, where?: any): boolean {
    if (!where) return true;
    for (const [key, value] of Object.entries(where)) {
      if (value === undefined) continue;

      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        !(value instanceof Date)
      ) {
        if ('in' in value && Array.isArray((value as any).in)) {
          if (!(value as any).in.includes(item[key])) return false;
        } else if ('not' in value) {
          if (item[key] === (value as any).not) return false;
        } else if (
          'gte' in value ||
          'lte' in value ||
          'gt' in value ||
          'lt' in value
        ) {
          const itemVal =
            item[key] instanceof Date ? item[key].getTime() : item[key];
          const valObj = value as Record<string, any>;
          if ('gte' in valObj) {
            const gteVal =
              valObj.gte instanceof Date ? valObj.gte.getTime() : valObj.gte;
            if (itemVal < gteVal) return false;
          }
          if ('lte' in valObj) {
            const lteVal =
              valObj.lte instanceof Date ? valObj.lte.getTime() : valObj.lte;
            if (itemVal > lteVal) return false;
          }
          if ('gt' in valObj) {
            const gtVal =
              valObj.gt instanceof Date ? valObj.gt.getTime() : valObj.gt;
            if (itemVal <= gtVal) return false;
          }
          if ('lt' in valObj) {
            const ltVal =
              valObj.lt instanceof Date ? valObj.lt.getTime() : valObj.lt;
            if (itemVal >= ltVal) return false;
          }
        } else {
          // Composite key object like { applicationId_version: { applicationId, version } }
          let allMatch = true;
          for (const [subKey, subVal] of Object.entries(value)) {
            if (item[subKey] !== subVal) {
              allMatch = false;
              break;
            }
          }
          if (!allMatch) return false;
        }
      } else {
        if (item[key] !== value) return false;
      }
    }
    return true;
  }

  private resolveIncludes(model: string, item: any, include?: any): any {
    if (!include || !item) return item;
    const cloned = { ...item };
    const m = model.toLowerCase();

    if (include.connector) {
      cloned.connector =
        this.getTable('connector').get(item.connectorId) ?? null;
    }
    if (include.deliveries) {
      cloned.deliveries = Array.from(
        this.getTable('webhookdelivery').values(),
      ).filter((d) => d.webhookId === item.id);
    }
    if (include.webhook) {
      cloned.webhook = this.getTable('webhook').get(item.webhookId) ?? null;
    }

    if (include.versions) {
      const versions = Array.from(
        this.getTable('applicationversion').values(),
      ).filter((v) => v.applicationId === item.id);
      cloned.versions = versions;
    }
    if (include.application) {
      cloned.application =
        this.getTable('application').get(item.applicationId) ?? null;
    }
    if (include.applicationVersion) {
      cloned.applicationVersion =
        this.getTable('applicationversion').get(item.applicationVersionId) ??
        null;
    }
    if (include.environment) {
      cloned.environment =
        this.getTable('environment').get(item.environmentId) ?? null;
    }
    if (include.contracts) {
      cloned.contracts = Array.from(this.getTable('contract').values());
    }
    if (include.history) {
      const histTable = this.getTable(m + 'history');
      cloned.history = Array.from(histTable.values()).filter(
        (h) => h[m + 'Id'] === item.id,
      );
    }
    if (include.providers) {
      cloned.providers = Array.from(
        this.getTable('contractprovider').values(),
      ).filter((p) => p.contractId === item.id);
    }
    if (include.consumers) {
      cloned.consumers = Array.from(
        this.getTable('contractconsumer').values(),
      ).filter((c) => c.contractId === item.id);
    }
    if (include.releases) {
      cloned.releases = [];
    }
    if (include.deployments) {
      cloned.deployments = [];
    }
    if (include.environmentDeployments) {
      cloned.environmentDeployments = [];
    }
    if (include.deploymentHistory) {
      cloned.deploymentHistory = [];
    }
    if (include.snapshots) {
      cloned.snapshots = [];
    }

    return cloned;
  }

  getModelProxy(model: string) {
    const table = this.getTable(model);

    return {
      findMany: async (args?: any) => {
        let list = Array.from(table.values()).filter((item) =>
          this.matches(item, args?.where),
        );

        if (args?.orderBy) {
          const orderKeys = Object.entries(args.orderBy);
          list.sort((a, b) => {
            for (const [key, dir] of orderKeys) {
              const valA = a[key];
              const valB = b[key];
              if (valA === valB) continue;
              if (valA === undefined) return 1;
              if (valB === undefined) return -1;
              const factor = dir === 'desc' ? -1 : 1;
              if (valA < valB) return -1 * factor;
              if (valA > valB) return 1 * factor;
            }
            return 0;
          });
        }

        if (typeof args?.skip === 'number') {
          list = list.slice(args.skip);
        }
        if (typeof args?.take === 'number') {
          list = list.slice(0, args.take);
        }

        return list.map((item) =>
          this.resolveIncludes(model, item, args?.include),
        );
      },

      findUnique: async (args: any) => {
        const items = Array.from(table.values());
        const found = items.find((item) => this.matches(item, args?.where));
        if (!found) return null;
        return this.resolveIncludes(model, found, args?.include);
      },

      findFirst: async (args?: any) => {
        const items = Array.from(table.values()).filter((item) =>
          this.matches(item, args?.where),
        );
        if (items.length === 0) return null;
        return this.resolveIncludes(model, items[0], args?.include);
      },

      create: async (args: any) => {
        const data = args?.data || {};
        const id = data.id || randomUUID();
        const now = new Date();
        const item: any = {
          ...data,
          id,
          createdAt: data.createdAt || now,
          updatedAt: data.updatedAt || now,
        };
        if (model.toLowerCase() === 'application' && !item.status) {
          item.status = 'ACTIVE';
        }
        if (model.toLowerCase() === 'environment') {
          if (!item.status) item.status = 'ACTIVE';
          item.isProduction = item.type === 'PRODUCTION';
        }
        table.set(id, item);
        return this.resolveIncludes(model, item, args?.include);
      },

      update: async (args: any) => {
        const items = Array.from(table.values());
        const found = items.find((item) => this.matches(item, args?.where));
        if (!found) {
          throw new Error(`Record to update not found in mock table ${model}`);
        }
        const updated = {
          ...found,
          ...args?.data,
          updatedAt: new Date(),
        };
        table.set(found.id, updated);
        return this.resolveIncludes(model, updated, args?.include);
      },

      delete: async (args: any) => {
        const items = Array.from(table.values());
        const found = items.find((item) => this.matches(item, args?.where));
        if (found) {
          table.delete(found.id);
        }
        return found || null;
      },

      count: async (args?: any) => {
        const items = Array.from(table.values()).filter((item) =>
          this.matches(item, args?.where),
        );
        return items.length;
      },

      upsert: async (args: any) => {
        const items = Array.from(table.values());
        const found = items.find((item) => this.matches(item, args?.where));
        if (found) {
          const updated = {
            ...found,
            ...args?.update,
            updatedAt: new Date(),
          };
          table.set(found.id, updated);
          return updated;
        }
        const data = args?.create || {};
        const id = data.id || randomUUID();
        const now = new Date();
        const created = {
          ...data,
          id,
          createdAt: data.createdAt || now,
          updatedAt: data.updatedAt || now,
        };
        table.set(id, created);
        return created;
      },
    };
  }
}

const SYSTEM_PROPERTIES = new Set([
  '$connect',
  '$disconnect',
  '$on',
  '$use',
  '$extends',
  'onModuleInit',
  'onModuleDestroy',
  'isConnected',
  'isMockActive',
  'inMemoryStore',
  'constructor',
]);

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  isConnected = false;
  isMockActive = false;
  inMemoryStore = new InMemoryStore();

  constructor() {
    const connStr =
      process.env.DATABASE_URL ||
      'postgresql://techzone:techzone_password@localhost:5432/techzone_cloud?schema=public';
    const adapter = new PrismaPg({ connectionString: connStr });
    super({ adapter });

    let proxyInstance: any;
    proxyInstance = new Proxy(this, {
      get: (target: any, prop: string | symbol) => {
        if (prop === '$transaction') {
          return async (arg: any, options?: any) => {
            if (target.isMockActive || !target.isConnected) {
              if (typeof arg === 'function') {
                return await arg(proxyInstance);
              }
              if (Array.isArray(arg)) {
                return await Promise.all(arg);
              }
              return arg;
            }
            try {
              return await target.$transaction(arg, options);
            } catch (err: any) {
              console.warn(
                '[AI Studio] Transaction failed on database, falling back to in-memory store:',
                err?.message,
              );
              target.isMockActive = true;
              target.isConnected = false;
              if (typeof arg === 'function') {
                return await arg(proxyInstance);
              }
              if (Array.isArray(arg)) {
                return await Promise.all(arg);
              }
              return arg;
            }
          };
        }

        if (typeof prop === 'symbol' || SYSTEM_PROPERTIES.has(prop as string)) {
          const val = target[prop];
          return typeof val === 'function' ? val.bind(target) : val;
        }

        const modelName = String(prop);

        if (target.isMockActive || !target.isConnected) {
          return target.inMemoryStore.getModelProxy(modelName);
        }

        const realModel = target[prop];
        if (realModel) {
          return new Proxy(realModel, {
            get: (mTarget: any, mProp: string) => {
              const origMethod = mTarget[mProp];
              if (typeof origMethod === 'function') {
                return async (...args: any[]) => {
                  try {
                    return await origMethod.apply(mTarget, args);
                  } catch (err: any) {
                    if (
                      err?.code === 'P1001' ||
                      err?.code === 'P1000' ||
                      err?.message?.includes('connect') ||
                      err?.message?.includes('ECONNREFUSED')
                    ) {
                      console.warn(
                        `[AI Studio] Database connection unavailable for ${modelName}.${mProp}, falling back to in-memory store.`,
                      );
                      target.isMockActive = true;
                      target.isConnected = false;
                      const memModel =
                        target.inMemoryStore.getModelProxy(modelName);
                      return (memModel as any)[mProp](...args);
                    }
                    throw err;
                  }
                };
              }
              return origMethod;
            },
          });
        }

        return target.inMemoryStore.getModelProxy(modelName);
      },
    });

    return proxyInstance;
  }

  async onModuleInit() {
    if (process.env.DATABASE_URL) {
      try {
        await this.$connect();
        this.isConnected = true;
        this.isMockActive = false;
        console.log('[AI Studio] Connected to database successfully.');
      } catch (err: any) {
        console.warn(
          '[AI Studio] Database connection failed, falling back to in-memory mock store:',
          err?.message,
        );
        this.isConnected = false;
        this.isMockActive = true;
      }
    } else {
      console.warn(
        '[AI Studio] DATABASE_URL not provided — using in-memory mock store.',
      );
      this.isConnected = false;
      this.isMockActive = true;
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
    }
  }
}
