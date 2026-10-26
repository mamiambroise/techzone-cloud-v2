import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationPersistenceService } from './automation-persistence.service';
import { WorkflowEngine } from './workflow/workflow.engine';
import { ActionEngine } from './action/action.engine';

describe('AutomationPersistenceService tenant isolation', () => {
  const prisma = {
    automationWorkflow: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    automationSchedule: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  let service: AutomationPersistenceService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AutomationPersistenceService,
        { provide: PrismaService, useValue: prisma },
        { provide: WorkflowEngine, useValue: { validateWorkflow: jest.fn(() => ({ valid: true, errors: [] })) } },
        { provide: ActionEngine, useValue: { getAction: jest.fn() } },
      ],
    }).compile();
    service = module.get(AutomationPersistenceService);
  });

  it('lists only workflows belonging to the authenticated tenant', async () => {
    prisma.automationWorkflow.findMany.mockResolvedValue([]);

    await service.listWorkflows('tenant-A');

    expect(prisma.automationWorkflow.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-A' },
      orderBy: { updatedAt: 'desc' },
    });
  });

  it('does not find a workflow by code outside its tenant', async () => {
    prisma.automationWorkflow.findUnique.mockResolvedValue(null);

    await expect(service.getWorkflow('tenant-A', 'private.workflow')).rejects.toThrow(NotFoundException);
    expect(prisma.automationWorkflow.findUnique).toHaveBeenCalledWith({
      where: { tenantId_code: { tenantId: 'tenant-A', code: 'private.workflow' } },
    });
  });

  it('deletes a schedule only within the authenticated tenant', async () => {
    prisma.automationSchedule.deleteMany.mockResolvedValue({ count: 0 });

    await expect(service.deleteSchedule('tenant-A', 'schedule-id')).rejects.toThrow(NotFoundException);
    expect(prisma.automationSchedule.deleteMany).toHaveBeenCalledWith({
      where: { id: 'schedule-id', tenantId: 'tenant-A' },
    });
  });
});
