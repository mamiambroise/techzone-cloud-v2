import { jest } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';

import { UiBuilderService } from './ui-builder.service';
import { PlatformException } from '../../common/errors/platform.exception';
import { PlatformErrorCode } from '../../common/errors/platform-error-code.enum';

function createMockPrisma() {
  return {
    applicationVersion: {
      findFirst: jest.fn(),
    },
    application: {
      findFirst: jest.fn(),
    },
    uiPage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    uiThemeSetting: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    bmEntity: {
      findMany: jest.fn(),
    },
    auditEvent: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';
const VERSION_ID = '33333333-3333-3333-3333-333333333333';

function makeService(prisma: ReturnType<typeof createMockPrisma>) {
  return new UiBuilderService(prisma as any);
}

describe('UiBuilderService — PAGES (TENANT-ISOLATION)', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: UiBuilderService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = makeService(prisma);
  });

  it('createPage refuse une version hors tenant (cross-tenant BLOCKED)', async () => {
    prisma.applicationVersion.findFirst.mockResolvedValue(null);

    await expect(
      service.createPage(
        {
          applicationVersionId: VERSION_ID,
          key: 'customers',
          route: '/customers',
          title: 'Clients',
        } as any,
        TENANT_A,
        'user-1',
      ),
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });

    expect(prisma.applicationVersion.findFirst).toHaveBeenCalledWith({
      where: { id: VERSION_ID, tenantId: TENANT_A },
    });
    expect(prisma.uiPage.create).not.toHaveBeenCalled();
  });

  it('createPage refuse une key dupliquée', async () => {
    prisma.applicationVersion.findFirst.mockResolvedValue({ id: VERSION_ID, applicationId: 'app-1', status: 'DRAFT' });
    prisma.uiPage.findFirst
      .mockResolvedValueOnce({ id: 'existing', key: 'customers' }) // duplicate key check
      .mockResolvedValueOnce(null); // route check

    await expect(
      service.createPage(
        {
          applicationVersionId: VERSION_ID,
          key: 'customers',
          route: '/customers',
          title: 'Clients',
        } as any,
        TENANT_A,
        'user-1',
      ),
    ).rejects.toMatchObject({ response: { code: PlatformErrorCode.UI_PAGE_KEY_EXISTS } });
  });

  it('createPage refuse une route dupliquée', async () => {
    prisma.applicationVersion.findFirst.mockResolvedValue({ id: VERSION_ID, applicationId: 'app-1', status: 'DRAFT' });
    prisma.uiPage.findFirst
      .mockResolvedValueOnce(null) // key check
      .mockResolvedValueOnce({ id: 'existing', route: '/customers' }); // route check

    await expect(
      service.createPage(
        {
          applicationVersionId: VERSION_ID,
          key: 'customers',
          route: '/customers',
          title: 'Clients',
        } as any,
        TENANT_A,
        'user-1',
      ),
    ).rejects.toMatchObject({ response: { code: PlatformErrorCode.UI_PAGE_ROUTE_EXISTS } });
  });

  it('createPage page avec valeurs par défaut + audit', async () => {
    prisma.applicationVersion.findFirst.mockResolvedValue({ id: VERSION_ID, applicationId: 'app-1', status: 'DRAFT' });
    prisma.uiPage.findFirst.mockResolvedValue(null);
    prisma.uiPage.create.mockResolvedValue({ id: 'p-1', key: 'customers', route: '/customers' });

    const page = await service.createPage(
      {
        applicationVersionId: VERSION_ID,
        key: 'Customers',
        route: '/customers',
        title: 'Clients',
      } as any,
      TENANT_A,
      'user-1',
    );

    expect(page).toMatchObject({ id: 'p-1' });
    expect(prisma.uiPage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationVersionId: VERSION_ID,
        key: 'customers',
        tenantId: TENANT_A,
        type: 'CUSTOM',
        layout: 'SIDEBAR',
        visibility: 'ALWAYS',
      }),
    });
    expect(prisma.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: 'ui.page.created', actorId: 'user-1', tenantId: TENANT_A }),
      }),
    );
  });

  it('updatePage refuse une page hors tenant', async () => {
    prisma.uiPage.findFirst.mockResolvedValue(null);

    await expect(
      service.updatePage('p-1', { title: 'X' } as any, TENANT_A, 'user-1'),
    ).rejects.toMatchObject({ status: HttpStatus.NOT_FOUND });
  });

  it('updatePage refuse la modification si version publiée (UI_VERSION_LOCKED)', async () => {
    prisma.uiPage.findFirst.mockResolvedValue({ id: 'p-1', applicationVersionId: VERSION_ID, key: 'customers' });
    prisma.applicationVersion.findFirst.mockResolvedValue({ id: VERSION_ID, status: 'ACTIVE' });

    await expect(
      service.updatePage('p-1', { title: 'X' } as any, TENANT_A, 'user-1'),
    ).rejects.toMatchObject({ response: { code: PlatformErrorCode.UI_VERSION_LOCKED } });
  });

  it('deletePage supprime et audite', async () => {
    prisma.uiPage.findFirst.mockResolvedValue({ id: 'p-1', applicationVersionId: VERSION_ID, key: 'customers' });
    prisma.applicationVersion.findFirst.mockResolvedValue({ id: VERSION_ID, status: 'DRAFT' });
    prisma.uiPage.delete.mockResolvedValue({ id: 'p-1' });

    const result = await service.deletePage('p-1', TENANT_A, 'user-1');

    expect(result).toEqual({ deleted: true, id: 'p-1' });
    expect(prisma.uiPage.delete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    expect(prisma.auditEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: 'ui.page.deleted' }) }),
    );
  });
});

describe('UiBuilderService — VALIDATION ENGINE', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: UiBuilderService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = makeService(prisma);
    prisma.applicationVersion.findFirst.mockResolvedValue({ id: VERSION_ID, applicationId: 'app-1', status: 'DRAFT' });
  });

  it('détecte routes dupliquées + binding entité inconnue + action invalide', async () => {
    prisma.uiPage.findMany.mockResolvedValue([
      {
        id: 'p-1',
        key: 'customers',
        route: '/customers',
        components: {
          root: 'root',
          nodes: {
            root: {
              id: 'root',
              type: 'Container',
              bindings: { title: { kind: 'ENTITY_FIELD', entity: 'ghost', field: 'name' } },
              actions: [{ type: 'NAVIGATE', config: { route: 'javascript:alert(1)' } }],
              children: ['ghost-child'],
            },
          },
        },
      },
      {
        id: 'p-2',
        key: 'orders',
        route: '/customers', // duplicated
        components: { root: 'root', nodes: {} },
      },
    ]);
    prisma.bmEntity.findMany.mockResolvedValue([]);

    const result = await service.validate(VERSION_ID, TENANT_A);

    expect(result.status).toBe('INVALID');
    const codes = result.issues.map((i: { code: string }) => i.code);
    expect(codes).toContain('ROUTE_DUPLICATED');
    expect(codes).toContain('ENTITY_UNKNOWN');
    expect(codes).toContain('ACTION_INVALID');
    expect(codes).toContain('REFERENCE_BROKEN');
    expect(result.counts.errors).toBeGreaterThanOrEqual(4);
  });

  it('valide un binding BM existant (entity + field) et passe en VALID', async () => {
    prisma.uiPage.findMany.mockResolvedValue([
      {
        id: 'p-1',
        key: 'customers',
        route: '/customers',
        components: {
          root: 'root',
          nodes: {
            root: {
              id: 'root',
              type: 'Text',
              bindings: { value: { kind: 'ENTITY_FIELD', entity: 'customer', field: 'email' } },
              children: [],
            },
          },
        },
      },
    ]);
    prisma.bmEntity.findMany.mockResolvedValue([
      { id: 'e-1', code: 'customer', fields: [{ id: 'f-1', code: 'email' }] },
    ]);

    const result = await service.validate(VERSION_ID, TENANT_A);

    expect(result.status).toBe('VALID');
    expect(result.counts.errors).toBe(0);
  });

  it('détecte un contexte inconnu et un champ BM inconnu', async () => {
    prisma.uiPage.findMany.mockResolvedValue([
      {
        id: 'p-1',
        key: 'customers',
        route: '/customers',
        components: {
          root: 'root',
          nodes: {
            root: {
              id: 'root',
              type: 'Text',
              bindings: {
                a: { kind: 'CONTEXT', context: 'evilContext' },
                b: { kind: 'ENTITY_FIELD', entity: 'customer', field: 'nope' },
              },
              children: [],
            },
          },
        },
      },
    ]);
    prisma.bmEntity.findMany.mockResolvedValue([
      { id: 'e-1', code: 'customer', fields: [{ id: 'f-1', code: 'email' }] },
    ]);

    const result = await service.validate(VERSION_ID, TENANT_A);
    const codes = result.issues.map((i: { code: string }) => i.code);
    expect(codes).toContain('BINDING_INVALID');
    expect(codes).toContain('FIELD_UNKNOWN');
  });

  it('refuse les composants et actions absents du contrat v1', async () => {
    prisma.uiPage.findMany.mockResolvedValue([
      {
        id: 'p-1', key: 'safe', route: '/safe',
        components: { root: 'root', nodes: {
          root: { id: 'root', type: 'ArbitraryReact', actions: [{ type: 'EVAL', config: {} }], children: [] },
        } },
      },
    ]);
    prisma.bmEntity.findMany.mockResolvedValue([]);

    const result = await service.validate(VERSION_ID, TENANT_A);
    expect(result.status).toBe('INVALID');
    expect(result.issues.map((issue: { code: string }) => issue.code)).toEqual(
      expect.arrayContaining(['COMPONENT_UNKNOWN', 'ACTION_UNKNOWN']),
    );
  });

  it('isole la validation par tenant (findMany filtre tenantId)', async () => {
    prisma.uiPage.findMany.mockResolvedValue([]);
    prisma.bmEntity.findMany.mockResolvedValue([]);

    await service.validate(VERSION_ID, TENANT_B);

    expect(prisma.uiPage.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT_B }) }),
    );
    expect(prisma.bmEntity.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT_B }) }),
    );
  });
});

describe('UiBuilderService — UI DEFINITION + THEME', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: UiBuilderService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = makeService(prisma);
    prisma.applicationVersion.findFirst.mockResolvedValue({ id: VERSION_ID, applicationId: 'app-1', status: 'DRAFT' });
  });

  it('assemble une UI Definition déclarative conforme (schemaVersion 1.0)', async () => {
    prisma.uiPage.findMany.mockResolvedValue([
      {
        id: 'p-1',
        applicationId: 'app-1',
        key: 'customers',
        route: '/customers',
        title: 'Clients',
        description: null,
        type: 'LIST',
        layout: 'SIDEBAR',
        visibility: 'ALWAYS',
        order: 1,
        permissions: [],
        components: { root: 'root', nodes: { root: { id: 'root', type: 'Container', children: [] } } },
        metadata: { icon: 'Users' },
        updatedAt: new Date(),
      },
    ]);
    prisma.uiThemeSetting.findFirst.mockResolvedValue(null);

    const def = await service.getUiDefinition(VERSION_ID, TENANT_A);

    expect(def).toMatchObject({
      schemaVersion: '1.1',
      applicationId: 'app-1',
      applicationVersionId: VERSION_ID,
    });
    expect(def.pages).toHaveLength(1);
    expect(def.pages[0].components).toMatchObject({ root: 'root' });
    expect(def.navigation.items[0]).toMatchObject({ pageKey: 'customers', icon: 'Users' });
  });

  it('upsertTheme incrémente la révision', async () => {
    prisma.uiThemeSetting.findFirst.mockResolvedValue({ id: 't-1', revision: 3 });
    prisma.uiThemeSetting.update.mockResolvedValue({ id: 't-1', revision: 4 });

    const theme = await service.upsertTheme(
      { applicationVersionId: VERSION_ID, tokens: { colors: { primary: '#2563eb' } } } as any,
      TENANT_A,
      'user-1',
    );

    expect(theme.revision).toBe(4);
    expect(prisma.uiThemeSetting.update).toHaveBeenCalledWith({
      where: { id: 't-1' },
      data: { tokens: { colors: { primary: '#2563eb' } }, revision: { increment: 1 } },
    });
  });

  it('overview n’invente aucune donnée (application manquante → name null)', async () => {
    prisma.application.findFirst.mockResolvedValue(null);
    prisma.uiPage.findMany.mockResolvedValue([]);
    prisma.bmEntity.findMany.mockResolvedValue([]);
    prisma.uiThemeSetting.findFirst.mockResolvedValue(null);

    const overview = await service.getOverview(VERSION_ID, TENANT_A);

    expect(overview.application).toEqual({ id: 'app-1', name: null, code: null });
    expect(overview.counts).toEqual({
      pages: 0,
      components: 0,
      forms: 0,
      bindings: 0,
      navigationItems: 0,
      hiddenPages: 0,
      errors: 0,
      warnings: 1,
    });
    expect(overview.themeConfigured).toBe(false);
    expect(overview.lastSavedAt).toBeNull();
    expect(overview.uiProject).toMatchObject({ applicationVersionId: VERSION_ID, resolved: true, pageCount: 0, hasTheme: false });
  });

  it('overview dérive KPI, progression et dernière sauvegarde des pages réelles', async () => {
    prisma.application.findFirst.mockResolvedValue({ id: 'app-1', name: 'App', code: 'APP' });
    prisma.bmEntity.findMany.mockResolvedValue([
      { id: 'e-1', code: 'customer', fields: [{ id: 'f-1', code: 'name' }] },
    ]);
    prisma.uiThemeSetting.findFirst.mockResolvedValue({
      id: 't-1',
      revision: 2,
      tokens: { breakpoints: { tablet: 834, mobile: 420 } },
      updatedAt: new Date('2026-02-02T10:00:00.000Z'),
    });
    prisma.uiPage.findMany.mockResolvedValue([
      {
        id: 'p-1',
        key: 'customers',
        title: 'Clients',
        route: '/customers',
        type: 'LIST',
        status: 'READY',
        visibility: 'ALWAYS',
        updatedAt: new Date('2026-02-01T09:00:00.000Z'),
        components: {
          root: 'root',
          nodes: {
            root: { id: 'root', type: 'Container', children: ['c-1'] },
            'c-1': { id: 'c-1', type: 'DataTable', bindings: { rows: { kind: 'ENTITY_LIST', entity: 'customer' } } },
          },
        },
      },
      {
        id: 'p-2',
        key: 'customer-form',
        title: 'Formulaire client',
        route: '/customers/form',
        type: 'FORM',
        status: 'DRAFT',
        visibility: 'HIDDEN',
        updatedAt: new Date('2026-01-20T09:00:00.000Z'),
        components: { root: 'root', nodes: { root: { id: 'root', type: 'Container', children: [] } } },
      },
    ]);

    const overview = await service.getOverview(VERSION_ID, TENANT_A);

    expect(overview.counts).toMatchObject({
      pages: 2,
      components: 3,
      forms: 1,
      bindings: 1,
      navigationItems: 1,
      hiddenPages: 1,
    });
    expect(overview.lastSavedAt).toBe('2026-02-02T10:00:00.000Z');
    expect(overview.progression).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'pages', status: 'IN_PROGRESS' }),
        expect.objectContaining({ id: 'bindings', status: 'READY' }),
        expect.objectContaining({ id: 'navigation', status: 'IN_PROGRESS' }),
        expect.objectContaining({ id: 'theme', status: 'READY' }),
        expect.objectContaining({ id: 'responsive', status: 'READY' }),
      ]),
    );
    expect(overview.lastPages[0]).toMatchObject({ id: 'p-1', type: 'LIST', status: 'READY', visibility: 'ALWAYS', bindings: 1 });
    expect(overview.uiProject).toMatchObject({ pageCount: 2, hasTheme: true, themeRevision: 2 });
  });

  it('overview expose les issues de validation réelles (page + composant)', async () => {
    prisma.application.findFirst.mockResolvedValue({ id: 'app-1', name: 'App', code: 'APP' });
    prisma.bmEntity.findMany.mockResolvedValue([]);
    prisma.uiThemeSetting.findFirst.mockResolvedValue(null);
    prisma.uiPage.findMany.mockResolvedValue([
      {
        id: 'p-1',
        key: 'broken',
        title: 'Cassée',
        route: 'broken',
        type: 'CUSTOM',
        status: 'DRAFT',
        visibility: 'ALWAYS',
        updatedAt: new Date('2026-01-01T09:00:00.000Z'),
        components: { root: 'root', nodes: { root: { id: 'root', type: 'Container', children: ['c-1'] }, 'c-1': { id: 'c-1', type: 'Unknown', bindings: {} } } },
      },
    ]);

    const overview = await service.getOverview(VERSION_ID, TENANT_A);

    expect(overview.validation.status).toBe('INVALID');
    expect(overview.counts.errors).toBeGreaterThan(0);
    expect(overview.validation.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'ROUTE_INVALID', pageId: 'p-1' }),
        expect.objectContaining({ code: 'COMPONENT_UNKNOWN', pageId: 'p-1', componentId: 'c-1' }),
      ]),
    );
    expect(overview.progression).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'validation', status: 'IN_PROGRESS' })]),
    );
  });
});
