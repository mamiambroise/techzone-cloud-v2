import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { IntegrationException } from '../../../common/errors/integration-exception';
import { IntegrationErrorCode } from '../../../common/errors/integration-error-code';
import { CreateCredentialDto, UpdateCredentialDto, RotateCredentialDto, CredentialSafeView } from './dto/create-credential.dto';

@Injectable()
export class CredentialService {
  private readonly secretStore: Map<string, string> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCredentialDto): Promise<CredentialSafeView> {
    const existing = await this.prisma.credentialReference.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });

    if (existing) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_CONTRACT_UNSUPPORTED,
        `Credential reference with code "${dto.code}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    const credential = await this.prisma.credentialReference.create({
      data: {
        code: dto.code,
        type: dto.type,
        provider: dto.provider,
        status: 'ACTIVE',
        metadataSafe: dto.metadataSafe as Prisma.InputJsonValue,
      },
    });

    if (dto.secretValue) {
      this.secretStore.set(credential.id, dto.secretValue);
    }

    return this.toSafeView(credential, dto.secretValue);
  }

  async findAll() {
    const credentials = await this.prisma.credentialReference.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return credentials.map((c) => this.toSafeView(c, undefined));
  }

  async findOne(id: string): Promise<CredentialSafeView> {
    const credential = await this.prisma.credentialReference.findUnique({
      where: { id },
    });

    if (!credential) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Credential reference "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.toSafeView(credential, undefined);
  }

  async update(id: string, dto: UpdateCredentialDto): Promise<CredentialSafeView> {
    const credential = await this.prisma.credentialReference.findUnique({
      where: { id },
    });

    if (!credential) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Credential reference "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const existingSecret = this.secretStore.get(id);

    const updated = await this.prisma.credentialReference.update({
      where: { id },
      data: {
        status: dto.status,
        metadataSafe: dto.metadataSafe as Prisma.InputJsonValue | undefined,
        expiresAt: dto.expiresAt,
      },
    });

    if (dto.secretValue) {
      this.secretStore.set(id, dto.secretValue);
    }

    return this.toSafeView(updated, existingSecret);
  }

  async rotate(id: string, dto: RotateCredentialDto): Promise<CredentialSafeView> {
    const credential = await this.prisma.credentialReference.findUnique({
      where: { id },
    });

    if (!credential) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Credential reference "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (credential.status === 'ARCHIVED') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Credential reference "${credential.code}" is archived and cannot be rotated`,
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.prisma.credentialReference.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        lastRotatedAt: new Date(),
        expiresAt: dto.expiresAt ?? null,
      },
    });

    if (dto.secretValue) {
      this.secretStore.set(id, dto.secretValue);
    } else {
      this.secretStore.delete(id);
    }

    return this.toSafeView(updated, dto.secretValue);
  }

  async disable(id: string): Promise<CredentialSafeView> {
    const credential = await this.prisma.credentialReference.findUnique({
      where: { id },
    });

    if (!credential) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Credential reference "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (credential.status === 'ARCHIVED') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_INVALID_STATE,
        `Credential reference "${credential.code}" is archived`,
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.prisma.credentialReference.update({
      where: { id },
      data: { status: 'DISABLED' },
    });

    this.secretStore.delete(id);

    return this.toSafeView(updated, undefined);
  }

  async archive(id: string): Promise<CredentialSafeView> {
    const credential = await this.prisma.credentialReference.findUnique({
      where: { id },
    });

    if (!credential) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Credential reference "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const updated = await this.prisma.credentialReference.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    this.secretStore.delete(id);

    return this.toSafeView(updated, undefined);
  }

  async test(id: string): Promise<{ valid: boolean; message: string }> {
    const credential = await this.prisma.credentialReference.findUnique({
      where: { id },
    });

    if (!credential) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Credential reference "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (credential.status !== 'ACTIVE') {
      return {
        valid: false,
        message: `Credential is ${credential.status}, not ACTIVE`,
      };
    }

    const secret = this.secretStore.get(id);

    if (!secret) {
      return {
        valid: false,
        message: 'No secret value stored for this credential reference',
      };
    }

    return {
      valid: true,
      message: 'Credential reference is valid',
    };
  }

  async getSecret(id: string): Promise<string | null> {
    const credential = await this.prisma.credentialReference.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!credential) {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_PROVIDER_UNAVAILABLE,
        `Credential reference "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (credential.status !== 'ACTIVE') {
      throw new IntegrationException(
        IntegrationErrorCode.INTEGRATION_AUTH_FAILED,
        `Credential reference "${id}" is not ACTIVE`,
        HttpStatus.FORBIDDEN,
      );
    }

    return this.secretStore.get(id) ?? null;
  }

  associateToConnector(credentialId: string, connectorId: string) {
    return this.prisma.connector.update({
      where: { id: connectorId },
      data: {
        credentialRef: credentialId,
      },
    });
  }

  private toSafeView = (
    credential: {
      id: string;
      code: string;
      type: unknown;
      provider: string;
      status: unknown;
      lastRotatedAt: Date | null;
      expiresAt: Date | null;
      metadataSafe: unknown;
      createdAt: Date;
      updatedAt: Date;
    },
    secretValue?: string,
  ): CredentialSafeView => ({
    id: credential.id,
    code: credential.code,
    type: credential.type as CredentialSafeView['type'],
    provider: credential.provider,
    status: credential.status as CredentialSafeView['status'],
    lastRotatedAt: credential.lastRotatedAt,
    expiresAt: credential.expiresAt,
    metadataSafe: credential.metadataSafe as Record<string, unknown> | null,
    maskedSecret: this.maskSecret(secretValue ?? ''),
    createdAt: credential.createdAt,
    updatedAt: credential.updatedAt,
  });

  private maskSecret(secret: string): string {
    if (!secret) {
      return '••••••••';
    }

    if (secret.length <= 5) {
      return '••••';
    }

    return `••••••••${secret.slice(-5)}`;
  }
}
