import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  RegistryEntryStatus,
  RegistryNamespace,
  RegistrySubDomain,
} from '../generated/prisma/client';
import type { IamPrincipal } from '../iam/principal.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { RegistryService } from './registry.service';

const principal = (
  overrides: Partial<IamPrincipal> = {},
): IamPrincipal => ({
  userId: 'user-a',
  sessionId: 'session-a',
  tenantId: 'tenant-a',
  organizationId: null,
  authenticationLevel: null,
  roles: [],
  permissions: [],
  isSuperAdmin: false,
  ...overrides,
});

function setup() {
  const prisma = {
    registryEntry: {
      count: jest.fn(),
      groupBy: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    registryNamespaceDef: { findUnique: jest.fn() },
    registryCapability: { findMany: jest.fn() },
    registryProviderDef: { findMany: jest.fn(), count: jest.fn() },
    registrySchema: { findFirst: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    registryCompatibility: { count: jest.fn(), findMany: jest.fn() },
    registryAvailability: { findMany: jest.fn() },
    registryDiagnostic: { count: jest.fn(), findMany: jest.fn() },
    registryAuditEvent: { count: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    packDependency: { findFirst: jest.fn() },
    packManifest: { findMany: jest.fn() },
    runtimeEffectiveManifest: { findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new RegistryService(prisma as unknown as PrismaService);
  return { prisma, service };
}

const uiNamespace = {
  id: 'namespace-ui',
  namespace: RegistryNamespace.UI,
  authority: 'UI_BUILDER',
};

const registerInput: Parameters<RegistryService['register']>[1] = {
  namespace: RegistryNamespace.UI,
  subDomain: RegistrySubDomain.UI_COMPONENT,
  key: 'table',
  version: '1.2.0',
  type: 'COMPONENT',
} as const;

describe('RegistryService security boundaries', () => {
  it('does not discover another tenant entry', async () => {
    const { prisma, service } = setup();
    prisma.registryEntry.findMany.mockResolvedValue([]);

    await expect(service.listEntries(principal(), {})).resolves.toEqual([]);
    expect(prisma.registryEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ tenantId: null }, { tenantId: 'tenant-a' }],
        },
      }),
    );
  });

  it('returns scoped published Pack and executable Runtime references without manifest bodies', async () => {
    const { prisma, service } = setup();
    prisma.registryEntry.findFirst.mockResolvedValue({
      id: 'entry-a',
      namespace: uiNamespace,
      subDomain: RegistrySubDomain.UI_COMPONENT,
      key: 'table',
      metadata: { internal: 'not returned' },
    });
    prisma.packManifest.findMany.mockResolvedValue([
      {
        packVersionId: 'pack-version-a',
        publishedAt: new Date('2026-01-01T00:00:00.000Z'),
        packVersion: {
          versionNumber: '2.0.0',
          pack: { code: 'finance', name: 'Finance' },
        },
        content: { registryReferences: [{ entryId: 'entry-a' }] },
      },
    ]);
    prisma.runtimeEffectiveManifest.findMany.mockResolvedValue([
      {
        id: 'runtime-a',
        applicationId: 'app-a',
        environment: 'PRODUCTION',
        createdAt: new Date('2026-01-02T00:00:00.000Z'),
        content: { registryReferences: [{ entryId: 'entry-a' }] },
      },
    ]);

    const result = await service.getEntry(principal(), 'entry-a');

    expect(result.references.publishedPacks).toHaveLength(1);
    expect(result.references.publishedPacks[0]).not.toHaveProperty('content');
    expect(result.references.runtimeContexts).toHaveLength(1);
    expect(result.references.runtimeContexts[0]).not.toHaveProperty('content');
    expect(prisma.packManifest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'PUBLISHED', tenantId: 'tenant-a' },
      }),
    );
  });

  it('does not resolve a tenant entry outside the principal scope', async () => {
    const { prisma, service } = setup();
    prisma.registryEntry.findMany.mockResolvedValue([]);

    const result = await service.resolve(principal(), {
      key: 'ui.component.table',
      version: '1.2.0',
    });

    expect(result.status).toBe('MISSING');
    expect(prisma.registryEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ tenantId: null }, { tenantId: 'tenant-a' }] },
      }),
    );
  });

  it('denies a module registering in a namespace it does not own', async () => {
    const { prisma, service } = setup();

    await expect(service.register(principal(), registerInput)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(prisma.registryNamespaceDef.findUnique).not.toHaveBeenCalled();
  });

  it('rejects duplicate namespace/key/version before writing', async () => {
    const { prisma, service } = setup();
    prisma.registryNamespaceDef.findUnique.mockResolvedValue(uiNamespace);
    prisma.registryEntry.findFirst.mockResolvedValue({ id: 'existing-entry' });

    await expect(
      service.register(
        principal({ permissions: ['registry.namespace.ui.write'] }),
        registerInput,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('derives owner, provider, tenant, scope, and initial status on the server', async () => {
    const { prisma, service } = setup();
    prisma.registryNamespaceDef.findUnique.mockResolvedValue(uiNamespace);
    prisma.registryEntry.findFirst.mockResolvedValue(null);
    const tx = {
      registryEntry: {
        create: jest.fn(async ({ data }) => ({
          id: 'entry-a',
          ...data,
          namespace: uiNamespace,
          capabilities: [],
          versions: [],
          availabilities: [],
        })),
      },
      registryAuditEvent: { create: jest.fn().mockResolvedValue({}) },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));

    const input = {
      ...registerInput,
      owner: 'PLATFORM',
      provider: 'CORE',
      tenantId: 'tenant-b',
      status: 'AVAILABLE',
      sourceModule: 'attacker',
    };
    await service.register(
      principal({ permissions: ['registry.namespace.ui.write'] }),
      input,
    );

    const { data } = tx.registryEntry.create.mock.calls[0][0];
    expect(data).toEqual(
      expect.objectContaining({
        owner: 'UI_BUILDER',
        provider: 'UI_BUILDER',
        tenantId: 'tenant-a',
        scopeId: 'tenant-a',
        status: RegistryEntryStatus.REGISTERED,
        sourceModule: 'registry:ui',
      }),
    );
    expect(data).not.toHaveProperty('sourceModule', 'attacker');
  });

  it('rejects executable code and credential-like metadata before persistence', async () => {
    const { prisma, service } = setup();
    prisma.registryNamespaceDef.findUnique.mockResolvedValue(uiNamespace);

    await expect(
      service.register(
        principal({ permissions: ['registry.namespace.ui.write'] }),
        { ...registerInput, metadata: { template: '<script>alert(1)</script>' } },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.register(
        principal({ permissions: ['registry.namespace.ui.write'] }),
        { ...registerInput, metadata: { config: 'Bearer abcdefghijklmnopqrstuvwxyz' } },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('returns not found rather than updating an entry belonging to another tenant', async () => {
    const { prisma, service } = setup();
    prisma.registryEntry.findFirst.mockResolvedValue(null);

    await expect(
      service.disable(
        principal({ permissions: ['registry.disable'] }),
        'entry-from-tenant-b',
        'security review',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.registryEntry.update).not.toHaveBeenCalled();
  });

  it('blocks removal when a compatibility record still references the entry', async () => {
    const { prisma, service } = setup();
    prisma.registryEntry.findFirst.mockResolvedValue({
      id: 'entry-a',
      status: RegistryEntryStatus.AVAILABLE,
      tenantId: 'tenant-a',
      subDomain: RegistrySubDomain.UI_COMPONENT,
      key: 'table',
      namespace: uiNamespace,
    });
    prisma.registryCompatibility.count.mockResolvedValue(1);
    prisma.packDependency.findFirst.mockResolvedValue(null);
    prisma.packManifest.findMany.mockResolvedValue([]);
    prisma.runtimeEffectiveManifest.findMany.mockResolvedValue([]);

    await expect(
      service.remove(
        principal({ permissions: ['registry.remove'] }),
        'entry-a',
        'retiring entry',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.registryEntry.update).not.toHaveBeenCalled();
  });

  it('blocks removal when a published Pack manifest references the entry', async () => {
    const { prisma, service } = setup();
    prisma.registryEntry.findFirst.mockResolvedValue({
      id: 'entry-a',
      status: RegistryEntryStatus.AVAILABLE,
      tenantId: 'tenant-a',
      subDomain: RegistrySubDomain.UI_COMPONENT,
      key: 'table',
      namespace: uiNamespace,
    });
    prisma.registryCompatibility.count.mockResolvedValue(0);
    prisma.packDependency.findFirst.mockResolvedValue({ id: 'dependency-a' });
    prisma.packManifest.findMany.mockResolvedValue([]);
    prisma.runtimeEffectiveManifest.findMany.mockResolvedValue([]);

    await expect(
      service.remove(
        principal({ permissions: ['registry.remove'] }),
        'entry-a',
        'retiring entry',
      ),
    ).rejects.toThrow('REGISTRY_ENTRY_IN_USE');
    expect(prisma.packDependency.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          targetRef: { in: ['entry-a', 'ui.component.table'] },
          targetType: { in: ['REGISTRY', 'REGISTRY_ENTRY', 'REGISTRY_REF'] },
          packVersion: {
            is: {
              status: 'PUBLISHED',
              tenantId: 'tenant-a',
              manifest: { is: { status: 'PUBLISHED' } },
            },
          },
        }),
      }),
    );
    expect(prisma.registryEntry.update).not.toHaveBeenCalled();
  });

  it('blocks removal when a published Pack manifest locks the entry', async () => {
    const { prisma, service } = setup();
    prisma.registryEntry.findFirst.mockResolvedValue({
      id: 'entry-a',
      status: RegistryEntryStatus.AVAILABLE,
      tenantId: 'tenant-a',
      subDomain: RegistrySubDomain.UI_COMPONENT,
      key: 'table',
      namespace: uiNamespace,
    });
    prisma.registryCompatibility.count.mockResolvedValue(0);
    prisma.packDependency.findFirst.mockResolvedValue(null);
    prisma.packManifest.findMany.mockResolvedValue([
      {
        content: {
          registryReferences: [{ entryId: 'entry-a', version: '1.2.0' }],
        },
      },
    ]);
    prisma.runtimeEffectiveManifest.findMany.mockResolvedValue([]);

    await expect(
      service.remove(
        principal({ permissions: ['registry.remove'] }),
        'entry-a',
        'retiring entry',
      ),
    ).rejects.toThrow('REGISTRY_ENTRY_IN_USE');
    expect(prisma.packManifest.findMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED', tenantId: 'tenant-a' },
      select: { content: true },
    });
    expect(prisma.registryEntry.update).not.toHaveBeenCalled();
  });

  it('blocks removal when an executable Runtime manifest references the entry', async () => {
    const { prisma, service } = setup();
    prisma.registryEntry.findFirst.mockResolvedValue({
      id: 'entry-a',
      status: RegistryEntryStatus.AVAILABLE,
      tenantId: 'tenant-a',
      subDomain: RegistrySubDomain.UI_COMPONENT,
      key: 'table',
      namespace: uiNamespace,
    });
    prisma.registryCompatibility.count.mockResolvedValue(0);
    prisma.packDependency.findFirst.mockResolvedValue(null);
    prisma.packManifest.findMany.mockResolvedValue([]);
    prisma.runtimeEffectiveManifest.findMany.mockResolvedValue([
      {
        content: {
          registryReferences: [{ entryId: 'entry-a', version: '1.2.0' }],
        },
      },
    ]);

    await expect(
      service.remove(
        principal({ permissions: ['registry.remove'] }),
        'entry-a',
        'retiring entry',
      ),
    ).rejects.toThrow('REGISTRY_ENTRY_IN_USE');
    expect(prisma.runtimeEffectiveManifest.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-a', executable: true },
      select: { content: true },
    });
    expect(prisma.registryEntry.update).not.toHaveBeenCalled();
  });

  it('keeps diagnostics tenant-scoped and does not select diagnostic details', () => {
    const { prisma, service } = setup();
    prisma.registryDiagnostic.findMany.mockResolvedValue([]);

    service.listDiagnostics(principal());
    expect(prisma.registryDiagnostic.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId: 'tenant-a' },
        select: expect.not.objectContaining({ details: true }),
      }),
    );
  });

  it('does not accept client-supplied namespace/provider status combinations', async () => {
    const { prisma, service } = setup();

    await expect(
      service.register(
        principal({ permissions: ['registry.namespace.ui.write'] }),
        {
          ...registerInput,
          namespace: RegistryNamespace.INTEGRATION,
          subDomain: RegistrySubDomain.INTEGRATION_CONNECTOR,
          provider: 'UI_BUILDER',
        } as Parameters<RegistryService['register']>[1],
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.registryNamespaceDef.findUnique).not.toHaveBeenCalled();
  });
});
