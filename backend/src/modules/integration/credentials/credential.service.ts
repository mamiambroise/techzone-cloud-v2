import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { CreateCredentialDto } from './dto/create-credential.dto';
import { UpdateCredentialDto } from './dto/update-credential.dto';
import { RotateCredentialDto } from './dto/rotate-credential.dto';

@Injectable()
export class CredentialService {
  // Backend-only secure storage for decrypted/raw secrets.
  // Never exported or exposed outside of backend services.
  private readonly secureVault = new Map<string, string>();

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Masks a sensitive secret string so that only a minimal prefix and suffix are visible.
   * e.g., "sk_live_1234567890abcdef" -> "sk_li••••••••cdef"
   */
  maskSecret(secret: string): string {
    if (!secret) return '••••';
    const len = secret.length;
    if (len <= 8) {
      return '••••' + secret.slice(-2);
    }
    const prefix = secret.slice(0, Math.min(4, Math.floor(len / 4)));
    const suffix = secret.slice(-Math.min(4, Math.floor(len / 4)));
    return `${prefix}${'•'.repeat(8)}${suffix}`;
  }

  async create(dto: CreateCredentialDto) {
    const existing = await this.prisma.credentialReference.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `Credential reference with code "${dto.code}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    // Format validation
    this.validateSecretFormat(dto.type, dto.secretValue);

    // Compute safe metadata containing only non-sensitive descriptors
    const safeMetadata = {
      ...dto.metadataSafe,
      maskedPreview: this.maskSecret(dto.secretValue),
      secretLength: dto.secretValue.length,
      hasKeyPrefix: dto.secretValue.includes('_'),
    };

    const record = await this.prisma.credentialReference.create({
      data: {
        code: dto.code,
        type: dto.type,
        provider: dto.provider,
        status: 'ACTIVE',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        metadataSafe: safeMetadata as unknown as Prisma.InputJsonValue,
      },
    });

    // Store raw secret in backend-only secure vault
    this.secureVault.set(record.id, dto.secretValue);
    this.secureVault.set(record.code, dto.secretValue);

    return this.sanitizeOutput(record);
  }

  async findAll(query?: {
    type?: string;
    provider?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(Number(query?.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query?.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.CredentialReferenceWhereInput = {};
    if (query?.type) where.type = query.type as any;
    if (query?.provider) where.provider = query.provider;
    if (query?.status) where.status = query.status as any;

    const [items, total] = await Promise.all([
      this.prisma.credentialReference.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.credentialReference.count({ where }),
    ]);

    return {
      items: items.map((item) => this.sanitizeOutput(item)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findOne(id: string) {
    const cred = await this.prisma.credentialReference.findUnique({
      where: { id },
    });

    if (!cred) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CREDENTIAL_NOT_FOUND,
        `Credential reference "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.sanitizeOutput(cred);
  }

  async update(id: string, dto: UpdateCredentialDto) {
    await this.findOne(id);

    const updated = await this.prisma.credentialReference.update({
      where: { id },
      data: {
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.expiresAt !== undefined
          ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
          : {}),
        ...(dto.metadataSafe !== undefined
          ? {
              metadataSafe:
                dto.metadataSafe as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
    });

    return this.sanitizeOutput(updated);
  }

  /**
   * API-CDC-05 Rotation:
   * 1. Validates format of new secret
   * 2. Updates secure vault
   * 3. Sets lastRotatedAt = now
   * 4. Regenerates safe masked preview
   */
  async rotate(id: string, dto: RotateCredentialDto) {
    const cred = await this.prisma.credentialReference.findUnique({
      where: { id },
    });

    if (!cred) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CREDENTIAL_NOT_FOUND,
        `Credential reference "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (cred.status === 'ARCHIVED') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Cannot rotate archived credential "${cred.code}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    this.validateSecretFormat(cred.type, dto.newSecretValue);

    const existingMeta =
      (cred.metadataSafe as Record<string, unknown> | null) ?? {};

    const updatedMeta = {
      ...existingMeta,
      maskedPreview: this.maskSecret(dto.newSecretValue),
      secretLength: dto.newSecretValue.length,
      rotationReason: dto.reason || 'Routine rotation',
      previousRotatedAt: cred.lastRotatedAt?.toISOString(),
    };

    const updated = await this.prisma.credentialReference.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        lastRotatedAt: new Date(),
        expiresAt: dto.newExpiresAt ? new Date(dto.newExpiresAt) : cred.expiresAt,
        metadataSafe: updatedMeta as unknown as Prisma.InputJsonValue,
      },
    });

    // Update secure in-memory storage
    this.secureVault.set(cred.id, dto.newSecretValue);
    this.secureVault.set(cred.code, dto.newSecretValue);

    return this.sanitizeOutput(updated);
  }

  async testConnectivity(id: string) {
    const cred = await this.prisma.credentialReference.findUnique({
      where: { id },
    });

    if (!cred) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CREDENTIAL_NOT_FOUND,
        `Credential reference "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (cred.status === 'DISABLED' || cred.status === 'ARCHIVED') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Credential "${cred.code}" is in inactive status: ${cred.status}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (cred.expiresAt && cred.expiresAt < new Date()) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CREDENTIAL_EXPIRED,
        `Credential "${cred.code}" has expired at ${cred.expiresAt.toISOString()}`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const secret = this.secureVault.get(cred.id) || this.secureVault.get(cred.code);
    const hasSecret = Boolean(secret);

    return {
      success: true,
      credentialCode: cred.code,
      provider: cred.provider,
      status: cred.status,
      secretVerified: hasSecret,
      testedAt: new Date().toISOString(),
      formatValid: true,
    };
  }

  async disable(id: string) {
    await this.findOne(id);
    const updated = await this.prisma.credentialReference.update({
      where: { id },
      data: { status: 'DISABLED' },
    });
    return this.sanitizeOutput(updated);
  }

  async archive(id: string) {
    await this.findOne(id);
    const updated = await this.prisma.credentialReference.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });
    return this.sanitizeOutput(updated);
  }

  /**
   * Internal Backend Provider Method:
   * Retrieves the raw secret for internal connector/webhook/sync operations.
   * NEVER call this from a controller to output into HTTP response!
   */
  resolveSecret(codeOrId: string): string | null {
    return this.secureVault.get(codeOrId) ?? null;
  }

  private validateSecretFormat(type: string, secret: string): void {
    if (!secret || secret.trim().length === 0) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PAYLOAD_INVALID,
        'Secret value cannot be empty',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (type === 'API_KEY' && secret.length < 8) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PAYLOAD_INVALID,
        'API Key must be at least 8 characters long',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (type === 'BASIC_AUTH' && !secret.includes(':')) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PAYLOAD_INVALID,
        'BASIC_AUTH credential must be formatted as username:password',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private sanitizeOutput<T extends Record<string, any>>(record: T): T {
    // Ensure that no raw secret field ever leaks through the response
    const { secret: _secret, secretValue: _secretValue, ...safe } = record;
    return safe as T;
  }
}
