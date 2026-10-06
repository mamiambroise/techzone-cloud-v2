import { jest } from '@jest/globals';

import { UiBuilderController, UUID } from './ui-builder.controller';
import { UiBuilderService } from './ui-builder.service';

// Reproduit le cas Phase 7 : les versions provisionnées de façon déterministe
// portent des UUID v5, alors que le pipe était épinglé sur la version 4 et
// rejetait l'identifiant en 400 avant d'atteindre le service.
const V4_VERSION_ID = '472584fe-3b27-4fca-89e0-21f31cf9dc1a';
const V5_VERSION_ID = '472584fe-3b27-504a-aedf-2b88ecc63d5a';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const PARAM_METADATA = { type: 'param', metatype: String, data: undefined } as never;

describe('UiBuilderController UUID acceptance', () => {
  const listPages = jest.fn().mockResolvedValue([]);
  const controller = new UiBuilderController({ listPages } as unknown as UiBuilderService);

  it.each([
    ['v4', V4_VERSION_ID],
    ['v5', V5_VERSION_ID],
  ])('accepts a %s application version id', async (_label, versionId) => {
    await expect(UUID.transform(versionId, PARAM_METADATA)).resolves.toBe(versionId);
  });

  it('still rejects a malformed identifier', async () => {
    await expect(UUID.transform('not-a-uuid', PARAM_METADATA)).rejects.toThrow();
  });

  it('scopes the page list to the active tenant for a v5 version', async () => {
    await controller.listPages(V5_VERSION_ID, { tenantId: TENANT_A, userId: 'user-1' } as never);
    expect(listPages).toHaveBeenCalledWith(V5_VERSION_ID, TENANT_A);
  });
});