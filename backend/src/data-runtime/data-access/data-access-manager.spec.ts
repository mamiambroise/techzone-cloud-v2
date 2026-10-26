import { DataAccessManager } from './data-access-manager';

describe('DataAccessManager reported availability', () => {
  it('does not advertise provider health or transaction support without real checks', async () => {
    const manager = new DataAccessManager();
    manager.registerProvider('TEST', {
      get: jest.fn(),
      list: jest.fn(),
      count: jest.fn(),
      exists: jest.fn(),
      metadata: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    });
    manager.registerResource({
      resourceCode: 'Product',
      displayName: 'Product',
      provider: 'TEST',
      instance: 'test',
      operations: ['READ', 'LIST', 'CREATE'],
      fields: [],
      relations: [],
    });

    const contract = await manager.getContract();

    expect(contract.health.status).toBe('UNKNOWN');
    expect(contract.capabilities.every((capability) => capability.availability === 'UNKNOWN')).toBe(true);
    expect(contract.capabilities.some((capability) => capability.constraints?.transactions)).toBe(false);
  });
});
