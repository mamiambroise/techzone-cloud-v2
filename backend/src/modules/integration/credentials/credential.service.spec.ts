import { Test, TestingModule } from '@nestjs/testing';
import { CredentialService } from './credential.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CredentialTypeEnum } from './dto/create-credential.dto';

describe('CredentialService (API-CDC-05)', () => {
  let service: CredentialService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CredentialService, PrismaService],
    }).compile();

    service = module.get<CredentialService>(CredentialService);
  });

  it('should create a credential reference and NEVER return the raw secret', async () => {
    const cred = await service.create({
      code: 'salesforce-oauth-app',
      type: CredentialTypeEnum.OAUTH_CLIENT,
      provider: 'salesforce',
      secretValue: 'super-secret-client-secret-99999',
    });

    expect(cred).toBeDefined();
    expect((cred as any).secretValue).toBeUndefined();
    expect((cred as any).secret).toBeUndefined();
    expect(cred.metadataSafe).toBeDefined();
    expect((cred.metadataSafe as any).maskedPreview).toContain('••••');
  });

  it('should allow internal backend services to resolve the secret', async () => {
    const cred = await service.create({
      code: 'internal-api-secret',
      type: CredentialTypeEnum.API_KEY,
      provider: 'internal',
      secretValue: 'api_key_secure_12345678',
    });

    const resolved = service.resolveSecret(cred.id);
    expect(resolved).toBe('api_key_secure_12345678');
  });

  it('should rotate a credential securely and update lastRotatedAt', async () => {
    const cred = await service.create({
      code: 'rotatable-token',
      type: CredentialTypeEnum.BEARER_TOKEN,
      provider: 'hubspot',
      secretValue: 'initial_secret_token_1234',
    });

    const rotated = await service.rotate(cred.id, {
      newSecretValue: 'new_rotated_secret_token_9876',
      reason: 'Periodic quarterly rotation',
    });

    expect(rotated.lastRotatedAt).toBeDefined();
    expect((rotated as any).secretValue).toBeUndefined();

    const resolvedNew = service.resolveSecret(cred.id);
    expect(resolvedNew).toBe('new_rotated_secret_token_9876');
  });

  it('should perform connectivity check without exposing secret', async () => {
    const cred = await service.create({
      code: 'testable-cred',
      type: CredentialTypeEnum.API_KEY,
      provider: 'sendgrid',
      secretValue: 'SG.1234567890abcdefghijkl',
    });

    const result = await service.testConnectivity(cred.id);
    expect(result.success).toBe(true);
    expect(result.secretVerified).toBe(true);
    expect((result as any).secret).toBeUndefined();
  });
});
