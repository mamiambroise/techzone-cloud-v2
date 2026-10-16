import { HttpStatus } from '@nestjs/common';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import type { IamAuthContext } from '../../../iam/decorators/current-user.decorator';
import { DeploymentDiagnosticsService } from './deployment-diagnostics.service';

const principalFor = (
  tenantId: string | null | undefined = 'tenant-a',
): IamAuthContext => ({
  userId: 'diagnostics-user',
  sessionId: 'diagnostics-session',
  tenantId,
  organizationId: null,
  siteId: null,
  authenticationLevel: 'PASSWORD',
  roles: [],
  permissions: [],
  isSuperAdmin: false,
});

const tenantDeployment = {
  id: 'deployment-a',
  tenantId: 'tenant-a',
  status: 'SUCCEEDED',
  healthStatus: 'HEALTHY',
  traceId: 'trace-a',
  startedAt: new Date('2026-01-01T00:00:00.000Z'),
  finishedAt: new Date('2026-01-01T00:00:10.000Z'),
  release: {
    code: 'release-a',
    version: '1.0.0',
    application: { name: 'application-a' },
  },
  environment: { code: 'test-a' },
  gates: [{ id: 'gate-a', result: 'PASSED', name: 'security' }],
  rollbacks: [{ id: 'rollback-a' }],
};

function setup() {
  const prisma = {
    deploymentHistory: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    deployment: {
      findFirst: jest.fn().mockResolvedValue(tenantDeployment),
      findMany: jest.fn().mockResolvedValue([]),
    },
    rollback: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  return {
    prisma,
    service: new DeploymentDiagnosticsService(prisma as any),
  };
}

describe('DeploymentDiagnosticsService tenant isolation', () => {
  it('scopes deployment history to the authenticated tenant before applying filters', async () => {
    const { prisma, service } = setup();

    await service.getHistory(
      { deploymentId: 'deployment-a', actor: 'diagnostics-user' },
      principalFor(),
    );

    expect(prisma.deploymentHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-a',
          deploymentId: 'deployment-a',
          actor: 'diagnostics-user',
        },
      }),
    );
  });

  it('does not expose a cross-tenant deployment timeline', async () => {
    const { prisma, service } = setup();
    prisma.deployment.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.getTimeline('deployment-b', principalFor()),
    ).rejects.toMatchObject({
      status: HttpStatus.NOT_FOUND,
    });

    expect(prisma.deployment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'deployment-b', tenantId: 'tenant-a' },
      }),
    );
    expect(prisma.deploymentHistory.findMany).not.toHaveBeenCalled();
  });

  it('scopes every timeline event to the deployment tenant', async () => {
    const { prisma, service } = setup();
    prisma.deploymentHistory.findMany.mockResolvedValueOnce([
      { id: 'event-a', tenantId: 'tenant-a', metadata: { token: 'secret' } },
    ]);

    const result = await service.getTimeline('deployment-a', principalFor());

    expect(prisma.deploymentHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { deploymentId: 'deployment-a', tenantId: 'tenant-a' },
      }),
    );
    expect(result.events[0]?.metadata).toEqual({ token: '***REDACTED***' });
  });

  it('does not expose a cross-tenant deployment diagnostic', async () => {
    const { prisma, service } = setup();
    prisma.deployment.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.getDeploymentDiagnostic('deployment-b', principalFor()),
    ).rejects.toThrow(DeploymentException);

    expect(prisma.deployment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'deployment-b', tenantId: 'tenant-a' },
      }),
    );
  });

  it('calculates diagnostics exclusively from deployments returned for the tenant', async () => {
    const { prisma, service } = setup();
    prisma.deployment.findMany.mockResolvedValueOnce([
      tenantDeployment,
      {
        ...tenantDeployment,
        id: 'deployment-failed',
        status: 'FAILED',
        healthStatus: 'DEGRADED',
        gates: [{ id: 'gate-b', result: 'FAILED', name: 'runtime' }],
      },
    ]);
    prisma.rollback.findMany.mockResolvedValueOnce([{ id: 'rollback-a' }]);

    await expect(service.getDiagnostics(principalFor())).resolves.toMatchObject({
      summary: {
        totalDeployments: 2,
        totalRollbacks: 1,
      },
      gatesEvaluation: {
        totalGates: 2,
        passed: 1,
        failed: 1,
      },
    });

    expect(prisma.deployment.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a' },
      include: {
        gates: true,
      },
    });
    expect(prisma.rollback.findMany).toHaveBeenCalledWith({
      where: { deployment: { is: { tenantId: 'tenant-a' } } },
    });
  });

  it('fails closed before querying diagnostics without an active tenant', async () => {
    const { prisma, service } = setup();

    await expect(
      service.getHistory(undefined, { ...principalFor(), tenantId: undefined }),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
    await expect(service.getDiagnostics(principalFor(null))).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });
    await expect(
      service.getDeploymentDiagnostic('deployment-a', principalFor('legacy')),
    ).rejects.toMatchObject({
      status: HttpStatus.FORBIDDEN,
    });

    expect(prisma.deploymentHistory.findMany).not.toHaveBeenCalled();
    expect(prisma.deployment.findFirst).not.toHaveBeenCalled();
    expect(prisma.deployment.findMany).not.toHaveBeenCalled();
    expect(prisma.rollback.findMany).not.toHaveBeenCalled();
  });
});
