import { Test, TestingModule } from '@nestjs/testing';
import { CredentialService } from './credentials.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';

describe('CredentialService', () => {
  let service: CredentialService;
  let prisma: { credentialReference: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock; findMany: jest.Mock }; connector: { update: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      credentialReference: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      connector: {
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CredentialService>(CredentialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a credential reference and mask the secret', async () => {
      prisma.credentialReference.findUnique.mockResolvedValue(null);
      prisma.credentialReference.create.mockResolvedValue({
        id: 'cred-1',
        code: 'test-cred',
        type: 'API_KEY',
        provider: 'mock',
        status: 'ACTIVE',
        lastRotatedAt: null,
        expiresAt: null,
        metadataSafe: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create({
        code: 'test-cred',
        type: 'API_KEY',
        provider: 'mock',
        secretValue: 'supersecret12345',
      });

      expect(result.maskedSecret).not.toContain('supersecret');
      expect(result.maskedSecret).toContain('12345');
    });
  });

  describe('rotate', () => {
    it('should rotate secret and update lastRotatedAt', async () => {
      prisma.credentialReference.findUnique.mockResolvedValue({
        id: 'cred-1',
        code: 'test-cred',
        type: 'API_KEY',
        provider: 'mock',
        status: 'ACTIVE',
        lastRotatedAt: null,
        expiresAt: null,
        metadataSafe: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      prisma.credentialReference.update.mockResolvedValue({
        id: 'cred-1',
        code: 'test-cred',
        type: 'API_KEY',
        provider: 'mock',
        status: 'ACTIVE',
        lastRotatedAt: new Date(),
        expiresAt: null,
        metadataSafe: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.rotate('cred-1', { secretValue: 'newkey67890' });

      expect(result.maskedSecret).toContain('67890');
      expect(prisma.credentialReference.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lastRotatedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw if credential is archived', async () => {
      prisma.credentialReference.findUnique.mockResolvedValue({
        id: 'cred-1',
        status: 'ARCHIVED',
      });

      await expect(service.rotate('cred-1', {})).rejects.toThrow(IntegrationException);
    });
  });

  describe('test', () => {
    it('should return invalid when no secret is stored', async () => {
      prisma.credentialReference.findUnique.mockResolvedValue({
        id: 'cred-1',
        status: 'ACTIVE',
      });

      const result = await service.test('cred-1');
      expect(result.valid).toBe(false);
    });
  });

  describe('getSecret', () => {
    it('should never expose secret without authentication', async () => {
      prisma.credentialReference.findUnique.mockResolvedValue(null);

      await expect(service.getSecret('nonexistent')).rejects.toThrow(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
      );
    });

    it('should return secret for authenticated ACTIVE credential', async () => {
      prisma.credentialReference.findUnique.mockResolvedValue({
        id: 'cred-1',
        status: 'ACTIVE',
      });
      service['secretStore'].set('cred-1', 'the-real-secret');

      const secret = await service.getSecret('cred-1');
      expect(secret).toBe('the-real-secret');
    });

    it('should throw if credential is not ACTIVE', async () => {
      prisma.credentialReference.findUnique.mockResolvedValue({
        id: 'cred-1',
        status: 'DISABLED',
      });

      await expect(service.getSecret('cred-1')).rejects.toThrow(
        IntegrationErrorCode.INTEGRATION_AUTH_FAILED,
      );
    });
  });

  describe('toSafeView - masking', () => {
    it('should never return the full secret value', () => {
      const view = service['toSafeView'](
        {
          id: '1',
          code: 'test',
          type: 'API_KEY',
          provider: 'mock',
          status: 'ACTIVE',
          lastRotatedAt: null,
          expiresAt: null,
          metadataSafe: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        'verylongsecretvalue123456789',
      );

      expect(view.maskedSecret).not.toContain('verylongsecretvalue');
      expect(view.maskedSecret).toContain('6789');
    });
  });
});
