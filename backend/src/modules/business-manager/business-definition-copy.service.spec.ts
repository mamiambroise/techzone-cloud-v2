import { PlatformException } from '../../common/errors/platform.exception';

import { BusinessDefinitionCopyService } from './business-definition-copy.service';

/**
 * Garde-fou de schéma : le service de copie envoie à Prisma des charges utiles
 * (`data`) qui doivent correspondre EXACTEMENT aux colonnes du modèle ciblé.
 *
 * Prisma rejette une clé inconnue (`Unknown argument`), et cette erreur ne se
 * voit qu'à l'exécution réelle — en 500 sur POST /applications/:id/duplicate.
 * Ces tests vérifient donc, sans base de données, qu'aucun modèle ne reçoit une
 * colonne qu'il ne possède pas :
 *   - BmRelation porte `applicationVersionId` mais PAS `applicationId`,
 *   - BmFeatureCapability et BmNavigationItem ne portent NI `applicationId`
 *     NI `applicationVersionId` : ils sont rattachés à leur parent.
 */
describe('BusinessDefinitionCopyService (COLONNES PRISES EN CHARGE)', () => {
  const TENANT_ID = '11111111-1111-4111-8111-111111111111';
  const SOURCE_VERSION_ID = '22222222-2222-4222-8222-222222222222';
  const TARGET_VERSION_ID = '33333333-3333-4333-8333-333333333333';
  const APPLICATION_ID = '44444444-4444-4444-8444-444444444444';

  const SOURCE_ENTITY_ID = '55555555-5555-4555-8555-555555555555';
  const SOURCE_TARGET_ENTITY_ID = '66666666-6666-4666-8666-666666666666';
  const SOURCE_FEATURE_ID = '77777777-7777-4777-8777-777777777777';
  const SOURCE_MENU_ID = '88888888-8888-4888-8888-888888888888';
  const SOURCE_ITEM_ID = '99999999-9999-4999-8999-999999999999';
  const SOURCE_CONTRACT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  let prisma: any;
  let service: BusinessDefinitionCopyService;

  beforeEach(() => {
    const created: { model: string; data: any }[] = [];

    prisma = {
      applicationVersion: {
        findFirst: jest.fn().mockResolvedValue({ id: SOURCE_VERSION_ID, applicationId: APPLICATION_ID }),
      },
      bmEntity: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: SOURCE_ENTITY_ID,
            code: 'customer',
            name: 'Client',
            pluralName: 'Clients',
            description: 'Client',
            status: 'ACTIVE',
            fields: [],
            constraints: [],
            indexes: [],
            computedFields: [],
          },
          {
            id: SOURCE_TARGET_ENTITY_ID,
            code: 'order',
            name: 'Commande',
            pluralName: 'Commandes',
            description: 'Commande',
            status: 'ACTIVE',
            fields: [],
            constraints: [],
            indexes: [],
            computedFields: [],
          },
        ]),
        create: jest.fn(async (args: any) => {
          created.push({ model: 'bmEntity', data: args.data });
          return { id: `entity-${created.length}` };
        }),
      },
      bmField: { create: jest.fn().mockResolvedValue({ id: 'field-1' }) },
      bmFieldValidation: { create: jest.fn().mockResolvedValue({ id: 'validation-1' }), findMany: jest.fn().mockResolvedValue([]) },
      bmConstraint: { create: jest.fn().mockResolvedValue({ id: 'constraint-1' }) },
      bmIndex: { create: jest.fn().mockResolvedValue({ id: 'index-1' }) },
      bmIndexField: { create: jest.fn().mockResolvedValue({ id: 'index-field-1' }) },
      bmComputedField: { create: jest.fn().mockResolvedValue({ id: 'computed-1' }) },
      bmRelation: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'relation-source',
            sourceEntityId: SOURCE_ENTITY_ID,
            targetEntityId: SOURCE_TARGET_ENTITY_ID,
            code: 'customer_orders',
            relationType: 'ONE_TO_MANY',
            sourceLabel: 'Client',
            targetLabel: 'Commande',
            required: false,
            deleteBehavior: 'RESTRICT',
            configuration: null,
            version: '1.0.0',
          },
        ]),
        create: jest.fn(async (args: any) => {
          created.push({ model: 'bmRelation', data: args.data });
          return { id: 'relation-1' };
        }),
      },
      bmFeature: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: SOURCE_FEATURE_ID,
            code: 'sales',
            name: 'Ventes',
            description: 'Ventes',
            category: 'Commerce',
            tags: [],
            status: 'ACTIVE',
            source: 'seed',
            version: '1.0.0',
            capabilities: [
              {
                id: 'capability-source',
                code: 'order.read',
                name: 'Lire les commandes',
                description: null,
                required: false,
                status: 'ACTIVE',
                requiredEntities: ['order'],
                configuration: null,
                version: '1.0.0',
                dependencies: [],
              },
            ],
          },
        ]),
        create: jest.fn(async (args: any) => {
          created.push({ model: 'bmFeature', data: args.data });
          return { id: 'feature-copied' };
        }),
      },
      bmFeatureCapability: {
        create: jest.fn(async (args: any) => {
          created.push({ model: 'bmFeatureCapability', data: args.data });
          return { id: 'capability-copied' };
        }),
      },
      bmCapabilityDependency: { create: jest.fn().mockResolvedValue({ id: 'dependency-1' }) },
      bmMenu: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: SOURCE_MENU_ID,
            code: 'main',
            name: 'Principal',
            description: null,
            location: 'SIDEBAR',
            status: 'ACTIVE',
            version: '1.0.0',
            items: [
              {
                id: SOURCE_ITEM_ID,
                parentItemId: null,
                code: 'orders',
                label: 'Commandes',
                itemType: 'LINK',
                routePath: '/orders',
                icon: 'list',
                requiredCapabilities: ['order.read'],
                capabilityOperator: 'ANY',
                visibility: 'VISIBLE',
                orderIndex: 0,
                configuration: null,
                version: '1.0.0',
              },
            ],
          },
        ]),
        create: jest.fn(async (args: any) => {
          created.push({ model: 'bmMenu', data: args.data });
          return { id: 'menu-copied' };
        }),
      },
      bmNavigationItem: {
        create: jest.fn(async (args: any) => {
          created.push({ model: 'bmNavigationItem', data: args.data });
          return { id: 'item-copied' };
        }),
      },
      bmVersionFeature: { findMany: jest.fn().mockResolvedValue([]) },
      bmVersionCapability: { findMany: jest.fn().mockResolvedValue([]) },
      configuration: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn().mockResolvedValue({ id: 'config-1' }) },
      bmBusinessContract: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: SOURCE_CONTRACT_ID,
            code: 'sales-contract',
            name: 'Contrat ventes',
            description: 'Contrat',
            version: '1.0.0',
            status: 'ACTIVE',
            contractHash: 'hash',
            manifest: { entities: [] },
            contractVersions: [
              {
                id: 'contract-version-source',
                versionNumber: '1.0.0',
                content: { entities: [] },
                hash: 'hash',
                compatibility: 'BACKWARD_COMPATIBLE',
                status: 'ACTIVE',
              },
            ],
          },
        ]),
        create: jest.fn(async (args: any) => {
          created.push({ model: 'bmBusinessContract', data: args.data });
          return { id: 'contract-copied' };
        }),
      },
      bmContractVersion: { create: jest.fn().mockResolvedValue({ id: 'contract-version-copied' }) },
    };

    service = new BusinessDefinitionCopyService(prisma);
    (prisma as any).__created = created;
  });

  it('copie la definition et renvoie un compte coherent', async () => {
    const result = await service.copy(SOURCE_VERSION_ID, TARGET_VERSION_ID, TENANT_ID);

    expect(result).toMatchObject({
      entities: 2,
      relations: 1,
      features: 1,
      capabilities: 1,
      menus: 1,
      navigationItems: 1,
      contracts: 1,
      contractVersions: 1,
    });
  });

  it('n\'envoie pas applicationId a BmRelation (colonne inexistante)', async () => {
    await service.copy(SOURCE_VERSION_ID, TARGET_VERSION_ID, TENANT_ID);

    const relation = prisma.__created.find((entry: any) => entry.model === 'bmRelation');
    expect(relation).toBeDefined();
    expect(relation.data).not.toHaveProperty('applicationId');
    // La relation reste bien rattachee a la version cible.
    expect(relation.data.applicationVersionId).toBe(TARGET_VERSION_ID);
  });

  it('n\'envoie ni applicationId ni applicationVersionId a BmFeatureCapability', async () => {
    await service.copy(SOURCE_VERSION_ID, TARGET_VERSION_ID, TENANT_ID);

    const capability = prisma.__created.find((entry: any) => entry.model === 'bmFeatureCapability');
    expect(capability).toBeDefined();
    expect(capability.data).not.toHaveProperty('applicationId');
    expect(capability.data).not.toHaveProperty('applicationVersionId');
    expect(capability.data.featureId).toBe('feature-copied');
  });

  it('n\'envoie ni applicationId ni applicationVersionId a BmNavigationItem', async () => {
    await service.copy(SOURCE_VERSION_ID, TARGET_VERSION_ID, TENANT_ID);

    const item = prisma.__created.find((entry: any) => entry.model === 'bmNavigationItem');
    expect(item).toBeDefined();
    expect(item.data).not.toHaveProperty('applicationId');
    expect(item.data).not.toHaveProperty('applicationVersionId');
    expect(item.data.menuId).toBe('menu-copied');
  });

  it('rattache les entites et le contrat a la version cible', async () => {
    await service.copy(SOURCE_VERSION_ID, TARGET_VERSION_ID, TENANT_ID);

    const entity = prisma.__created.find((entry: any) => entry.model === 'bmEntity');
    expect(entity.data.applicationId).toBe(APPLICATION_ID);
    expect(entity.data.applicationVersionId).toBe(TARGET_VERSION_ID);
    expect(entity.data.tenantId).toBe(TENANT_ID);

    const contract = prisma.__created.find((entry: any) => entry.model === 'bmBusinessContract');
    expect(contract.data.applicationVersionId).toBe(TARGET_VERSION_ID);
    expect(contract.data.code).toBe('sales-contract');
  });

  it('refuse une version source absente du tenant', async () => {
    prisma.applicationVersion.findFirst.mockResolvedValue(null);

    await expect(service.copy(SOURCE_VERSION_ID, TARGET_VERSION_ID, TENANT_ID)).rejects.toThrow(PlatformException);
  });
});