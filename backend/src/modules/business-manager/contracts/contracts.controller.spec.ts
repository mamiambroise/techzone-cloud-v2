import 'reflect-metadata';
import { BM_CONTRACT_READ, BM_CONTRACT_WRITE } from '../../../iam/iam.constants';
import { PERMISSION_KEY } from '../../../iam/permission.decorator';
import { ContractsController } from './contracts.controller';

describe('ContractsController permissions', () => {
  it.each([
    ['findAll', BM_CONTRACT_READ],
    ['findOne', BM_CONTRACT_READ],
    ['checkCompatibility', BM_CONTRACT_READ],
    ['assembleContracts', BM_CONTRACT_READ],
    ['create', BM_CONTRACT_WRITE],
    ['update', BM_CONTRACT_WRITE],
    ['validate', BM_CONTRACT_WRITE],
  ] as const)('requires the expected permission for %s', (method, permission) => {
    expect(
      Reflect.getMetadata(PERMISSION_KEY, ContractsController.prototype[method]),
    ).toBe(permission);
  });
});
