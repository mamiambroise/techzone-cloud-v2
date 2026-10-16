import { CockpitService } from './cockpit.service';
import type { IamAuthContext } from '../../../iam/decorators/current-user.decorator';

const principal: IamAuthContext = {
  userId: 'cockpit-user',
  sessionId: 'cockpit-session',
  tenantId: 'tenant-a',
  organizationId: null,
  siteId: null,
  authenticationLevel: 'PASSWORD',
  roles: [],
  permissions: [],
  isSuperAdmin: false,
};

describe('CockpitService tenant isolation', () => {
  const prisma = {
    release: { findMany: jest.fn().mockResolvedValue([]) },
    deployment: { findMany: jest.fn().mockResolvedValue([]) },
    environmentDeployment: { findMany: jest.fn().mockResolvedValue([]) },
    rollback: { findMany: jest.fn().mockResolvedValue([]) },
    deploymentHistory: { findMany: jest.fn().mockResolvedValue([]) },
    environment: { findMany: jest.fn().mockResolvedValue([]) },
  };
  const service = new CockpitService(prisma as any);

  beforeEach(() => jest.clearAllMocks());

  it('scopes dashboard aggregates and records to the authenticated tenant', async () => {
    await service.getDashboard(principal);

    expect(prisma.release.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-a' } }),
    );
    expect(prisma.deployment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-a' } }),
    );
    expect(prisma.environmentDeployment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-a' } }),
    );
    expect(prisma.rollback.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { deployment: { is: { tenantId: 'tenant-a' } } } }),
    );
    expect(prisma.deploymentHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-a' } }),
    );
  });

  it('scopes every list endpoint to the authenticated tenant', async () => {
    await service.getRecentReleases(principal, 5);
    await service.getRunningDeployments(principal);
    await service.getActivity(principal, 5);
    await service.getHealth(principal);

    expect(prisma.release.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-a' } }),
    );
    expect(prisma.deployment.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        where: {
          tenantId: 'tenant-a',
          status: { in: ['PENDING', 'RUNNING', 'VERIFYING'] },
        },
      }),
    );
    expect(prisma.deploymentHistory.findMany).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { tenantId: 'tenant-a' } }),
    );
    expect(prisma.environment.findMany).toHaveBeenLastCalledWith({
      where: { tenantId: 'tenant-a' },
    });
  });

  it('rejects a missing tenant context before querying deployment records', async () => {
    await expect(
      service.getDashboard({ ...principal, tenantId: null }),
    ).rejects.toThrow('active tenant context');
    expect(prisma.release.findMany).not.toHaveBeenCalled();
  });
});
