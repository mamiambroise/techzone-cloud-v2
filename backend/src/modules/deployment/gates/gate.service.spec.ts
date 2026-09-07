import { Test, TestingModule } from '@nestjs/testing';
import { GateService } from './gate.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeploymentException } from '../../../common/errors/deployment.exception';

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

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get all gates for a deployment', async () => {
    const deployments = await prisma.deployment.findMany({
      include: { gates: true },
    });
    const depWithGates = deployments.find((d: any) => d.gates && d.gates.length > 0);

    if (depWithGates) {
      const gates = await service.findByDeployment(depWithGates.id);
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

    if (depWithGates) {
      const gate = depWithGates.gates[0];
      const approved = await service.approve(depWithGates.id, gate.id, {
        approvedBy: 'qa-engineer@techzone.io',
        comment: 'Manual compliance sign-off',
      });
      expect(approved.result).toBe('PASSED');
      expect(approved.executedBy).toBe('qa-engineer@techzone.io');
    }
  });

  it('should bypass a gate with mandatory audit justification', async () => {
    const deployments = await prisma.deployment.findMany({
      include: { gates: true },
    });
    const depWithGates = deployments.find((d: any) => d.gates && d.gates.length > 0);

    if (depWithGates) {
      const gate = depWithGates.gates[0];

      // Rejects empty justification
      await expect(
        service.bypass(depWithGates.id, gate.id, {
          bypassedBy: 'emergency-responder',
          justification: '   ',
        }),
      ).rejects.toThrow(DeploymentException);

      // Accepts valid justification
      const bypassed = await service.bypass(depWithGates.id, gate.id, {
        bypassedBy: 'emergency-responder',
        justification: 'Hotfix release approved by VP of Engineering during outage',
      });
      expect(bypassed.result).toBe('SKIPPED');
    }
  });
});
