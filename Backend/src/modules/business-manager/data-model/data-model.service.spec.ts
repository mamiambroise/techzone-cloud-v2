import { jest } from '@jest/globals';
import { DataModelService } from './data-model.service';

describe('DataModelService', () => {
    it('detects schema issues for a model without a primary key and with duplicate field names', async () => {
        const repository = {
            create: jest.fn((value) => ({ ...value, id: 'model-1' })),
            save: jest.fn(async (value) => value),
            find: jest.fn(async () => []),
            findOne: jest.fn(async () => null),
            update: jest.fn(async () => undefined),
        };

        const dataSource = {
            getRepository: jest.fn(() => repository),
        };

        const service = new DataModelService(dataSource as any, { log: jest.fn() } as any);

        const createdModel = await service.createForVersion(
            'application-1',
            'version-1',
            {
                name: 'Customer',
                description: 'Customer profile',
                fields: [
                    { name: 'id', type: 'uuid', required: false },
                    { name: 'id', type: 'string', required: true },
                    { name: 'email', type: 'string', required: true },
                ],
                relationships: [],
                constraints: [],
                indexes: [],
                validationRules: [],
                formulaDefinitions: [],
            },
            'user-1',
        );

        const result = await service.validateSchema(createdModel.id);

        expect(result.valid).toBe(false);
        expect(result.issues.some((issue) => issue.code === 'MISSING_PRIMARY_KEY')).toBe(true);
        expect(result.issues.some((issue) => issue.code === 'DUPLICATE_FIELD_NAME')).toBe(true);
    });
});
