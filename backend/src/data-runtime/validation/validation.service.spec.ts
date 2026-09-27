import { ValidationService } from './validation.service';
import { CanonicalField } from '../interfaces';

describe('ValidationService', () => {
  let service: ValidationService;

  const productFields: CanonicalField[] = [
    { code: 'id', displayName: 'ID', type: 'STRING', required: true, nullable: false },
    { code: 'name', displayName: 'Nom', type: 'STRING', required: true, nullable: false, maxLength: 50 },
    { code: 'price', displayName: 'Prix', type: 'DECIMAL', required: true, nullable: false },
    { code: 'active', displayName: 'Actif', type: 'BOOLEAN', required: false, nullable: true },
    { code: 'status', displayName: 'Statut', type: 'ENUM', required: true, nullable: false, enumValues: ['ACTIVE','INACTIVE'] },
    { code: 'createdAt', displayName: 'Cree le', type: 'DATETIME', required: false, nullable: true },
    { code: 'tags', displayName: 'Tags', type: 'ARRAY', required: false, nullable: true },
  ];

  beforeEach(() => {
    service = new ValidationService();
    service.registerSchema('Product', productFields);
  });

  describe('validate', () => {
    it('should pass valid data', async () => {
      const result = await service.validate('Product', {
        id: 'P-1',
        name: 'Produit A',
        price: 100,
        active: true,
        status: 'ACTIVE',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing required field', async () => {
      const result = await service.validate('Product', {
        id: 'P-1',
        price: 100,
        status: 'ACTIVE',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('REQUIRED');
      expect(result.errors[0].field).toBe('name');
    });

    it('should catch type mismatch', async () => {
      const result = await service.validate('Product', {
        id: 'P-1',
        name: 'Produit A',
        price: 'not-a-number',
        status: 'ACTIVE',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('TYPE_MISMATCH');
      expect(result.errors[0].field).toBe('price');
    });

    it('should catch invalid enum value', async () => {
      const result = await service.validate('Product', {
        id: 'P-1',
        name: 'Produit A',
        price: 100,
        status: 'INVALID_STATUS',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('INVALID_ENUM');
    });

    it('should catch max length exceeded', async () => {
      const result = await service.validate('Product', {
        id: 'P-1',
        name: 'x'.repeat(51),
        price: 100,
        status: 'ACTIVE',
      });
      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe('MAX_LENGTH');
    });

    it('should validate boolean type', async () => {
      const result = await service.validate('Product', {
        id: 'P-1',
        name: 'Produit A',
        price: 100,
        active: 'yes',
        status: 'ACTIVE',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === 'TYPE_MISMATCH' && e.field === 'active')).toBe(true);
    });
  });

  describe('checkPermission', () => {
    const ctx = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      requestId: 'req-1',
      traceId: 'trace-1',
      permissions: ['product.read', 'product.write'],
    };

    it('should allow permission that exists', () => {
      expect(() => service.checkPermission(ctx as any, 'product.read')).not.toThrow();
    });

    it('should deny permission that does not exist', () => {
      expect(() => service.checkPermission(ctx as any, 'product.delete')).toThrow();
    });

    it('should allow wildcard permission', () => {
      const wildcardCtx = { ...ctx, permissions: ['*'] };
      expect(() => service.checkPermission(wildcardCtx as any, 'anything')).not.toThrow();
    });

    it('should deny when no permissions defined', () => {
      const emptyCtx = { ...ctx, permissions: [] };
      expect(() => service.checkPermission(emptyCtx as any, 'product.read')).toThrow();
    });
  });

  describe('checkTenant', () => {
    const ctx = {
      tenantId: 'tenant-1',
      userId: 'user-1',
      requestId: 'req-1',
      traceId: 'trace-1',
      permissions: ['*'],
    };

    it('should allow same tenant', () => {
      expect(() => service.checkTenant(ctx as any, 'tenant-1')).not.toThrow();
    });

    it('should reject cross-tenant access', () => {
      expect(() => service.checkTenant(ctx as any, 'tenant-2')).toThrow();
    });
  });
});
