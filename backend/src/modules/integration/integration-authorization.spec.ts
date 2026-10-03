import { jest } from '@jest/globals';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';

import { IamPermissionGuard } from '../../iam/iam-permission.guard';
import { PERMISSION_KEY } from '../../iam/permission.decorator';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLES,
} from '../../iam/iam.constants';

import { IntegrationController } from './integration.controller';
import { ConnectorController } from './connectors/connector.controller';
import { WebhookController } from './webhooks/webhook.controller';
import { InboundWebhookController } from './webhooks/inbound-webhook.controller';
import { SynchronizationController } from './synchronizations/synchronization.controller';
import { CredentialsController } from './credentials/credentials.controller';
import { ApiManagerController } from './api-manager/api-manager.controller';
import { DiagnosticsController } from './diagnostics/diagnostics.controller';
import { DiagnosticsService } from './diagnostics/diagnostics.service';

/** Permission réellement attachée par le décorateur sur la méthode. */
const declaredPermission = (proto: object, method: string): string | undefined =>
  Reflect.getMetadata(PERMISSION_KEY, proto[method]);

/** Simule le守卫 global avec la permission déclarée par la route. */
const guardFor = (permission?: string) =>
  new IamPermissionGuard({
    getAllAndOverride: () => permission,
  } as unknown as Reflector);

const ctxWith = (principal: unknown) =>
  ({
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ iamPrincipal: principal }) }),
  }) as never;

describe('Integration Hub — permissions déclarées sur chaque endpoint', () => {
  const cases: Array<[string, object, string, string]> = [
    ['GET dashboard', IntegrationController.prototype, 'getDashboard', PERMISSIONS.INTEGRATION_READ],
    ['GET activity', IntegrationController.prototype, 'getActivity', PERMISSIONS.INTEGRATION_READ],
    ['GET health', IntegrationController.prototype, 'getHealth', PERMISSIONS.INTEGRATION_READ],
    ['GET attention', IntegrationController.prototype, 'getAttention', PERMISSIONS.INTEGRATION_READ],

    ['GET connectors', ConnectorController.prototype, 'findAll', PERMISSIONS.INTEGRATION_READ],
    ['GET connectors/:id', ConnectorController.prototype, 'findOne', PERMISSIONS.INTEGRATION_READ],
    ['POST connectors', ConnectorController.prototype, 'create', PERMISSIONS.INTEGRATION_WRITE],
    ['PATCH connectors/:id', ConnectorController.prototype, 'update', PERMISSIONS.INTEGRATION_WRITE],
    ['POST connectors/:id/validate', ConnectorController.prototype, 'validate', PERMISSIONS.INTEGRATION_EXECUTE],
    ['POST connectors/:id/health', ConnectorController.prototype, 'healthCheck', PERMISSIONS.INTEGRATION_EXECUTE],
    ['POST connectors/:id/activate', ConnectorController.prototype, 'activate', PERMISSIONS.INTEGRATION_WRITE],
    ['POST connectors/:id/disable', ConnectorController.prototype, 'disable', PERMISSIONS.INTEGRATION_WRITE],
    ['POST connectors/:id/archive', ConnectorController.prototype, 'archive', PERMISSIONS.INTEGRATION_WRITE],

    ['GET webhooks', WebhookController.prototype, 'findAll', PERMISSIONS.INTEGRATION_READ],
    ['GET webhooks/:id', WebhookController.prototype, 'findOne', PERMISSIONS.INTEGRATION_READ],
    ['POST webhooks', WebhookController.prototype, 'create', PERMISSIONS.INTEGRATION_WRITE],
    ['PATCH webhooks/:id', WebhookController.prototype, 'update', PERMISSIONS.INTEGRATION_WRITE],
    ['POST webhooks/:id/transition', WebhookController.prototype, 'transition', PERMISSIONS.INTEGRATION_WRITE],
    ['DELETE webhooks/:id', WebhookController.prototype, 'remove', PERMISSIONS.INTEGRATION_WRITE],

    ['GET synchronizations', SynchronizationController.prototype, 'findAll', PERMISSIONS.INTEGRATION_READ],
    ['GET synchronizations/:id', SynchronizationController.prototype, 'findOne', PERMISSIONS.INTEGRATION_READ],
    ['GET synchronizations/:id/checkpoint', SynchronizationController.prototype, 'getCheckpoint', PERMISSIONS.INTEGRATION_READ],
    ['POST synchronizations', SynchronizationController.prototype, 'create', PERMISSIONS.INTEGRATION_WRITE],
    ['PATCH synchronizations/:id', SynchronizationController.prototype, 'update', PERMISSIONS.INTEGRATION_WRITE],
    ['DELETE synchronizations/:id', SynchronizationController.prototype, 'remove', PERMISSIONS.INTEGRATION_WRITE],
    ['POST synchronizations/:id/run', SynchronizationController.prototype, 'run', PERMISSIONS.INTEGRATION_EXECUTE],
    ['POST synchronizations/:id/resume', SynchronizationController.prototype, 'resume', PERMISSIONS.INTEGRATION_EXECUTE],
    ['POST synchronizations/:id/pause', SynchronizationController.prototype, 'pause', PERMISSIONS.INTEGRATION_EXECUTE],
    ['POST synchronizations/:id/cancel', SynchronizationController.prototype, 'cancel', PERMISSIONS.INTEGRATION_EXECUTE],

    ['GET credentials', CredentialsController.prototype, 'findAll', PERMISSIONS.INTEGRATION_CREDENTIAL_READ],
    ['GET credentials/:id', CredentialsController.prototype, 'findOne', PERMISSIONS.INTEGRATION_CREDENTIAL_READ],
    ['POST credentials', CredentialsController.prototype, 'create', PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE],
    ['PATCH credentials/:id', CredentialsController.prototype, 'update', PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE],
    ['POST credentials/:id/rotate', CredentialsController.prototype, 'rotate', PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE],
    ['POST credentials/:id/disable', CredentialsController.prototype, 'disable', PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE],
    ['POST credentials/:id/archive', CredentialsController.prototype, 'archive', PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE],
    ['POST credentials/:id/associate/:connectorId', CredentialsController.prototype, 'associateToConnector', PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE],
    ['DELETE credentials/:id', CredentialsController.prototype, 'remove', PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE],
    ['POST credentials/:id/test', CredentialsController.prototype, 'test', PERMISSIONS.INTEGRATION_EXECUTE],

    ['GET apis', ApiManagerController.prototype, 'findAll', PERMISSIONS.INTEGRATION_READ],
    ['GET apis/:id', ApiManagerController.prototype, 'findOne', PERMISSIONS.INTEGRATION_READ],
    ['GET apis/code/:apiCode/version/:version', ApiManagerController.prototype, 'findByCodeAndVersion', PERMISSIONS.INTEGRATION_READ],
    ['POST apis', ApiManagerController.prototype, 'create', PERMISSIONS.INTEGRATION_WRITE],
    ['POST apis/versions', ApiManagerController.prototype, 'createVersion', PERMISSIONS.INTEGRATION_WRITE],
    ['PATCH apis/:id', ApiManagerController.prototype, 'update', PERMISSIONS.INTEGRATION_WRITE],
    ['POST apis/:id/transition', ApiManagerController.prototype, 'transition', PERMISSIONS.INTEGRATION_WRITE],
    ['DELETE apis/:id', ApiManagerController.prototype, 'remove', PERMISSIONS.INTEGRATION_WRITE],

    ['GET diagnostics/logs', DiagnosticsController.prototype, 'searchLogs', PERMISSIONS.INTEGRATION_DIAGNOSTIC_READ],
    ['GET diagnostics/metrics', DiagnosticsController.prototype, 'getMetrics', PERMISSIONS.INTEGRATION_DIAGNOSTIC_READ],
    ['GET diagnostics/timeline/:traceId', DiagnosticsController.prototype, 'getTimeline', PERMISSIONS.INTEGRATION_DIAGNOSTIC_READ],

    ['POST webhooks/inbound/:code/outbound', InboundWebhookController.prototype, 'sendOutbound', PERMISSIONS.INTEGRATION_EXECUTE],
    ['GET webhooks/inbound/:code/deliveries', InboundWebhookController.prototype, 'getDeliveries', PERMISSIONS.INTEGRATION_READ],
  ];

  it.each(cases)('%s exige %s', (_label, proto, method, expected) => {
    expect(declaredPermission(proto, method)).toBe(expected);
  });

  it('la réception machine d’un webhook entrant ne porte AUCUNE permission IAM', () => {
    // Un système externe n'a pas de session IAM : une permission ici casserait
    // les webhooks entrants. Sa frontière réelle est le code + la signature.
    expect(declaredPermission(InboundWebhookController.prototype, 'receive')).toBeUndefined();
  });

  it('aucun endpoint Integration Hub n’est laissé sans permission', () => {
    const unguarded = cases.filter(
      ([, proto, method]) => declaredPermission(proto, method) === undefined,
    );
    expect(unguarded).toEqual([]);
  });
});

describe('Integration Hub — application effective par le guard global', () => {
  const standardUser = {
    userId: 'u1',
    tenantId: 'tenant-a',
    isSuperAdmin: false,
    permissions: ROLE_PERMISSIONS[ROLES.USER],
  };

  it('un utilisateur autorisé passe (lecture du catalogue)', async () => {
    await expect(
      guardFor(PERMISSIONS.INTEGRATION_READ).canActivate(ctxWith(standardUser)),
    ).resolves.toBe(true);
  });

  it('un utilisateur NON autorisé est refusé sur URL directe', async () => {
    // Rôle ne portant que des permissions hors Integration Hub.
    const outsider = { ...standardUser, permissions: [PERMISSIONS.CONFIG_READ] };
    await expect(
      guardFor(PERMISSIONS.INTEGRATION_READ).canActivate(ctxWith(outsider)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      guardFor(PERMISSIONS.INTEGRATION_WRITE).canActivate(ctxWith(standardUser)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      guardFor(PERMISSIONS.INTEGRATION_CREDENTIAL_READ).canActivate(ctxWith(standardUser)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('le rôle admin passe sur toutes les permissions Integration Hub', async () => {
    const admin = {
      userId: 'u2',
      tenantId: 'tenant-a',
      isSuperAdmin: false,
      permissions: ROLE_PERMISSIONS[ROLES.ADMIN],
    };
    for (const permission of [
      PERMISSIONS.INTEGRATION_READ,
      PERMISSIONS.INTEGRATION_WRITE,
      PERMISSIONS.INTEGRATION_EXECUTE,
      PERMISSIONS.INTEGRATION_CREDENTIAL_READ,
      PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE,
      PERMISSIONS.INTEGRATION_DIAGNOSTIC_READ,
    ]) {
      await expect(
        guardFor(permission).canActivate(ctxWith(admin)),
      ).resolves.toBe(true);
    }
  });

  it('le rôle standard garde la lecture mais perd toute mutation', () => {
    const userPerms = ROLE_PERMISSIONS[ROLES.USER];
    expect(userPerms).toContain(PERMISSIONS.INTEGRATION_READ);
    expect(userPerms).not.toContain(PERMISSIONS.INTEGRATION_WRITE);
    expect(userPerms).not.toContain(PERMISSIONS.INTEGRATION_EXECUTE);
    expect(userPerms).not.toContain(PERMISSIONS.INTEGRATION_CREDENTIAL_READ);
    expect(userPerms).not.toContain(PERMISSIONS.INTEGRATION_CREDENTIAL_WRITE);
    expect(userPerms).not.toContain(PERMISSIONS.INTEGRATION_DIAGNOSTIC_READ);
  });

  it('une requête sans principal est refusée', async () => {
    await expect(
      guardFor(PERMISSIONS.INTEGRATION_READ).canActivate(ctxWith(undefined)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

describe('Diagnostics — isolation tenant des journaux', () => {
  const makeService = () => {
    const integrationLog = {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockResolvedValue({ _avg: { duration: null } }),
      groupBy: jest.fn().mockResolvedValue([]),
    };
    const prisma = {
      integrationLog,
      webhookDelivery: { count: jest.fn().mockResolvedValue(0) },
      synchronization: { count: jest.fn().mockResolvedValue(0) },
    } as never;
    return { service: new DiagnosticsService(prisma), integrationLog };
  };

  it('impose le tenant du principal même sans tenantId demandé', async () => {
    const { service, integrationLog } = makeService();
    await service.searchLogs({}, { tenantId: 'tenant-a', isSuperAdmin: false });
    expect(integrationLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a' }) }),
    );
  });

  it('refuse la lecture des journaux d’un autre tenant', async () => {
    const { service, integrationLog } = makeService();
    await expect(
      service.searchLogs({ tenantId: 'tenant-b' }, { tenantId: 'tenant-a', isSuperAdmin: false }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(integrationLog.findMany).not.toHaveBeenCalled();
  });

  it('accepte un tenantId identique à celui du principal', async () => {
    const { service, integrationLog } = makeService();
    await service.searchLogs({ tenantId: 'tenant-a' }, { tenantId: 'tenant-a', isSuperAdmin: false });
    expect(integrationLog.findMany).toHaveBeenCalled();
  });

  it('refuse un principal sans tenant (non super admin)', async () => {
    const { service } = makeService();
    await expect(
      service.searchLogs({}, { tenantId: null, isSuperAdmin: false }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('borne les métriques au tenant du principal', async () => {
    const { service, integrationLog } = makeService();
    await service.getMetrics({ tenantId: 'tenant-a', isSuperAdmin: false });
    expect(integrationLog.count).toHaveBeenCalledWith({ where: { tenantId: 'tenant-a' } });
  });

  it('borne la timeline au tenant du principal', async () => {
    const { service, integrationLog } = makeService();
    await service.getTimeline('trace-1', { tenantId: 'tenant-a', isSuperAdmin: false });
    expect(integrationLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { traceId: { contains: 'trace-1' }, tenantId: 'tenant-a' },
      }),
    );
  });

  it('laisse le super admin sans tenant honoured sans filtre', async () => {
    const { service, integrationLog } = makeService();
    await service.searchLogs({}, { tenantId: null, isSuperAdmin: true });
    expect(integrationLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});