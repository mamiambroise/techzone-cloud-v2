import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';
import { BmContractStatus } from '../../../generated/prisma/enums';
import { CreateContractDto, UpdateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureApplicationVersionExists(applicationVersionId: string, tenantId: string | null) {
    const version = await this.prisma.applicationVersion.findFirst({
      where: {
        id: applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
    });

    if (!version) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_NOT_FOUND,
        `Application version "${applicationVersionId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return version;
  }

  async createContract(applicationVersionId: string, dto: CreateContractDto, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    const code = dto.code.trim().toLowerCase();
    const version = dto.version || '1.0.0';

    const appVersion = await this.prisma.applicationVersion.findUnique({
      where: { id: applicationVersionId },
      include: { application: true },
    });

    if (!appVersion) {
      throw new PlatformException(
        PlatformErrorCode.VERSION_NOT_FOUND,
        `Application version "${applicationVersionId}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.prisma.bmBusinessContract.findFirst({
      where: {
        applicationVersionId,
        code,
        version,
        tenantId: tenantId ?? undefined,
      },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_EXISTS,
        `Contract with code "${code}" version "${version}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    const contract = await this.prisma.bmBusinessContract.create({
      data: {
        applicationId: appVersion.applicationId,
        applicationVersionId,
        code,
        name: dto.name,
        description: dto.description,
        version,
        status: BmContractStatus.DRAFT,
        contractHash: this.computeHash(dto.manifest || {}),
        manifest: (dto.manifest || undefined) as any,
        tenantId: tenantId ?? undefined,
      },
    });

    await this.prisma.bmContractVersion.create({
      data: {
        contractId: contract.id,
        versionNumber: version,
        content: (dto.manifest || undefined) as any,
        hash: this.computeHash(dto.manifest || {}),
        status: BmContractStatus.DRAFT,
        tenantId: tenantId ?? undefined,
      },
    });

    return contract;
  }

  async findAllContracts(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    return this.prisma.bmBusinessContract.findMany({
      where: {
        applicationVersionId,
        tenantId: tenantId ?? undefined,
      },
      include: {
        contractVersions: true,
      },
    });
  }

  async findOneContract(id: string, tenantId: string | null) {
    const contract = await this.prisma.bmBusinessContract.findFirst({
      where: {
        id,
        tenantId: tenantId ?? undefined,
      },
      include: {
        contractVersions: true,
      },
    });

    if (!contract) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_NOT_FOUND,
        `Contract "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    return contract;
  }

  async updateContract(id: string, dto: UpdateContractDto, tenantId: string | null) {
    const contract = await this.findOneContract(id, tenantId);

    if (contract.status === BmContractStatus.LOCKED || contract.status === BmContractStatus.ACTIVE) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_LOCKED,
        `Contract cannot be modified in status ${contract.status}`,
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.prisma.bmBusinessContract.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        manifest: dto.manifest as any,
        contractHash: this.computeHash(dto.manifest || {}),
      },
    });

    return updated;
  }

  async validateContract(id: string, tenantId: string | null) {
    const contract = await this.findOneContract(id, tenantId);

    if (contract.status === BmContractStatus.LOCKED) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_LOCKED,
        'Contract is already locked',
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.bmBusinessContract.update({
      where: { id },
      data: {
        status: BmContractStatus.LOCKED,
      },
    });
  }

  async checkCompatibility(contractId: string, targetContractId: string, tenantId: string | null) {
    const [contract, target] = await Promise.all([
      this.findOneContract(contractId, tenantId),
      this.findOneContract(targetContractId, tenantId),
    ]);

    const sourceManifest = contract.manifest as any;
    const targetManifest = target.manifest as any;

    const differences: string[] = [];

    if (sourceManifest?.entities && targetManifest?.entities) {
      const sourceEntities = Object.keys(sourceManifest.entities);
      const targetEntities = Object.keys(targetManifest.entities);
      for (const entity of sourceEntities) {
        if (!targetEntities.includes(entity)) {
          differences.push(`Entity "${entity}" missing in target`);
        }
      }
    }

    return {
      contract: { id: contract.id, code: contract.code, version: contract.version },
      target: { id: target.id, code: target.code, version: target.version },
      compatible: differences.length === 0,
      differences,
    };
  }

  async assembleContracts(applicationVersionId: string, tenantId: string | null) {
    await this.ensureApplicationVersionExists(applicationVersionId, tenantId);

    const contracts = await this.prisma.bmBusinessContract.findMany({
      where: {
        applicationVersionId,
        status: { in: [BmContractStatus.LOCKED, BmContractStatus.ACTIVE] },
        tenantId: tenantId ?? undefined,
      },
    });

    return {
      applicationVersionId,
      assembledAt: new Date().toISOString(),
      contracts: contracts.map(c => ({
        id: c.id,
        code: c.code,
        version: c.version,
        status: c.status,
        hash: c.contractHash,
      })),
    };
  }

  private computeHash(data: unknown): string {
    const json = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
