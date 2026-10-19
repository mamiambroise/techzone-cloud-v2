import { Test, TestingModule } from '@nestjs/testing';
import { GateService } from './gate.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeploymentException } from '../../../common/errors/deployment.exception';
import type { IamAuthContext } from '../../../iam/decorators/current-user.decorator';

const principalFor = (tenantId: string): IamAuthContext => ({
  userId: 'gate-test-user',
  sessionId: 'gate-test-session',
  tenantId,
  organizationId: null,
  siteId: null,
  authenticationLevel: 'PASSWORD',
  roles: [],
  permissions: [],
  isSuperAdmin: false,
});

describe('GateService (DEP-CDC-05)', () => {
  let service: GateService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GateService, PrismaService],
    }).compile();

    service = module.get<GateService>(GateService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get all gates for a deployment', async () => {
    const deployments = await prisma.deployment.findMany({
      include: { gates: true },
    });
    const depWithGates = deployments.find((d: any) => d.gates && d.gates.length > 0);

    if (depWithGates?.tenantId) {
      const gates = await service.findByDeployment(
        depWithGates.id,
        principalFor(depWithGates.tenantId),
      );
      expect(gates.length).toBeGreaterThan(0);
      expect(gates[0]).toHaveProperty('type');
      expect(gates[0]).toHaveProperty('result');
    }
  });

  it('should approve a gate', async () => {
    const deployments = await prisma.deployment.findMany({
      include: { gates: true },
    });
    const depWithGates = deployments.find((d: any) => d.gates && d.gates.length > 0);

    if (depWithGates?.tenantId) {
      const gate = depWithGates.gates[0];
      await expect(
        service.approve(
          depWithGates.id,
          gate.id,
          {
            approvedBy: 'forged-qa-engineer@techzone.io',
            comment: 'Manual compliance sign-off',
          },
          principalFor(depWithGates.tenantId),
        ),
      ).rejects.toThrow(DeploymentException);
    }
  });

  it('should bypass a gate with mandatory audit justification', async () => {
    const deployments = await prisma.deployment.findMany({
      include: { gates: true },
    });
    const depWithGates = deployments.find((d: any) => d.gates && d.gates.length > 0);

    if (depWithGates?.tenantId) {
      const gate = depWithGates.gates[0];

      // Rejects empty justification
      await expect(
        service.bypass(
          depWithGates.id,
          gate.id,
          {
            bypassedBy: 'emergency-responder',
            justification: '   ',
          },
          principalFor(depWithGates.tenantId),
        ),
      ).rejects.toThrow(DeploymentException);

      // Required gates remain non-bypassable even with a forged body actor.
      await expect(
        service.bypass(
          depWithGates.id,
          gate.id,
          {
            bypassedBy: 'emergency-responder',
            justification: 'Hotfix release approved by VP of Engineering during outage',
          },
          principalFor(depWithGates.tenantId),
        ),
      ).rejects.toThrow(DeploymentException);
    }
  });
});
