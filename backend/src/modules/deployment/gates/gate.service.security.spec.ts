import { DeploymentException } from '../../../common/errors/deployment.exception';
import type { IamAuthContext } from '../../../iam/decorators/current-user.decorator';
import { GateService } from './gate.service';

const principal = (tenantId = 'tenant-a', userId = 'server-user'): IamAuthContext => ({
  userId,
  sessionId: 'session-a',
  tenantId,
  organizationId: null,
  siteId: null,
  authenticationLevel: 'PASSWORD',
  roles: [],
  permissions: [],
  isSuperAdmin: false,
});

const deployment = {
  id: 'deployment-a',
  tenantId: 'tenant-a',
  releaseId: 'release-a',
  environmentId: 'environment-a',
  status: 'RUNNING',
  traceId: 'trace-a',
  release: { applicationId: 'application-a' },
  environment: { id: 'environment-a' },
};

function setup() {
  const prisma = {
    deployment: { findFirst: jest.fn().mockResolvedValue(deployment) },
    deploymentGate: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'gate-a', required: true, result: 'FAILED', type: 'TESTS_PASS' },
      ]),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    deploymentHistory: { create: jest.fn().mockResolvedValue({}) },
  };
  return { prisma, service: new GateService(prisma as any) };
}

describe('GateService readiness and tenant security', () => {
  it('does not expose a deployment gate across tenants', async () => {
    const { prisma, service } = setup();
    prisma.deployment.findFirst.mockResolvedValueOnce(null);

    await expect(
      service.findByDeployment('deployment-a', principal('tenant-b')),
    ).rejects.toThrow(DeploymentException);
    expect(prisma.deploymentGate.findMany).not.toHaveBeenCalled();
  });

  it('returns persisted gate evidence without synthesizing PASSED results', async () => {
    const { prisma, service } = setup();

    await expect(
      service.evaluate('deployment-a', principal()),
    ).resolves.toMatchObject({
      allPassed: false,
      evaluated: false,
      reason: 'NO_REAL_GATE_EVALUATOR_CONFIGURED',
    });
    expect(prisma.deploymentGate.update).not.toHaveBeenCalled();
  });

  it('accepts only a MANUAL_APPROVAL gate and derives the actor server-side', async () => {
    const { prisma, service } = setup();
    prisma.deploymentGate.findFirst.mockResolvedValue({
      id: 'manual-gate',
      deploymentId: deployment.id,
      type: 'MANUAL_APPROVAL',
      required: true,
    });
    prisma.deploymentGate.update.mockResolvedValue({ id: 'manual-gate', result: 'PASSED' });

    await service.approve(
      deployment.id,
      'manual-gate',
      { approvedBy: 'forged-body-actor', comment: 'Human approval' },
      principal('tenant-a', 'authenticated-approver'),
    );

    expect(prisma.deploymentGate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ executedBy: 'authenticated-approver' }),
      }),
    );
  });

  it('refuses to bypass a required gate even with a valid body justification', async () => {
    const { prisma, service } = setup();
    prisma.deploymentGate.findFirst.mockResolvedValue({
      id: 'required-gate',
      deploymentId: deployment.id,
      type: 'ENVIRONMENT_READY',
      required: true,
    });

    await expect(
      service.bypass(
        deployment.id,
        'required-gate',
        {
          bypassedBy: 'forged-body-actor',
          justification: 'Attempt to bypass runtime readiness',
        },
        principal(),
      ),
    ).rejects.toThrow(DeploymentException);
    expect(prisma.deploymentGate.update).not.toHaveBeenCalled();
  });

  it('does not permit late manual gate changes on a terminal deployment', async () => {
    const { prisma, service } = setup();
    prisma.deployment.findFirst.mockResolvedValue({ ...deployment, status: 'SUCCEEDED' });

    await expect(
      service.approve(
        deployment.id,
        'manual-gate',
        { approvedBy: 'forged-body-actor', comment: 'Too late' },
        principal(),
      ),
    ).rejects.toThrow(DeploymentException);
    expect(prisma.deploymentGate.findFirst).not.toHaveBeenCalled();
  });
});
