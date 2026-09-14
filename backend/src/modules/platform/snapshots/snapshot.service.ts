import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';
import { createHash } from 'crypto';

@Injectable()
export class SnapshotsService {
  constructor(private readonly prisma: PrismaService) {}

  private buildHashPayload(data: {
    applicationId: string;
    applicationVersionId: string;
    environmentId: string;
    contracts: unknown;
    configuration: unknown;
    metadata: unknown;
  }) {
    return {
      applicationId: data.applicationId,
      applicationVersionId: data.applicationVersionId,
      environmentId: data.environmentId,
      contracts: data.contracts,
      configuration: data.configuration,
      metadata: data.metadata ?? {},
    };
  }

  private canonicalize(value: unknown): string {
    if (Array.isArray(value)) {
      return `[${value.map((item) => this.canonicalize(item)).join(',')}]`;
    }

    if (value !== null && typeof value === 'object') {
      const object = value as Record<string, unknown>;

      const sortedKeys = Object.keys(object).sort();

      return `{${sortedKeys
        .map(
          (key) => `${JSON.stringify(key)}:${this.canonicalize(object[key])}`,
        )
        .join(',')}}`;
    }

    return JSON.stringify(value);
  }

  async create(dto: CreateSnapshotDto, traceId?: string) {
    // 1. Vérifier l'application
    const application = await this.prisma.application.findUnique({
      where: {
        id: dto.applicationId,
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // 2. Vérifier la version de l'application
    const applicationVersion = await this.prisma.applicationVersion.findUnique({
      where: {
        id: dto.applicationVersionId,
      },
    });

    if (!applicationVersion) {
      throw new NotFoundException('Application version not found');
    }

    // Vérifier que la version appartient bien à l'application
    if (applicationVersion.applicationId !== application.id) {
      throw new BadRequestException(
        'Application version does not belong to this application',
      );
    }

    // 3. Vérifier l'environnement
    const environment = await this.prisma.environment.findUnique({
      where: {
        id: dto.environmentId,
      },
    });

    if (!environment) {
      throw new NotFoundException('Environment not found');
    }

    const contracts = await this.prisma.contract.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: [{ contractCode: 'asc' }, { contractVersion: 'asc' }],
    });

    const configurations = await this.prisma.configuration.findMany({
      where: {
        status: 'ACTIVE',
      },
      orderBy: [{ key: 'asc' }, { version: 'asc' }],
    });

    const snapshotData = {
      application: {
        id: application.id,
        code: application.code,
        name: application.name,
      },

      applicationVersion: {
        id: applicationVersion.id,
        version: applicationVersion.version,
        status: applicationVersion.status,
      },

      environment: {
        id: environment.id,
        code: environment.code,
        name: environment.name,
        type: environment.type,
        status: environment.status,
        region: environment.region,
        baseUrl: environment.baseUrl,
      },

      contracts: contracts.map((contract) => ({
        id: contract.id,
        contractCode: contract.contractCode,
        contractVersion: contract.contractVersion,
        ownerTeam: contract.ownerTeam,
        schema: contract.schema,
        compatibilityPolicy: contract.compatibilityPolicy,
        hash: contract.hash,
      })),

      configuration: configurations.map((config) => ({
        id: config.id,
        key: config.key,
        scope: config.scope,
        scopeId: config.scopeId,
        type: config.type,
        value: config.value,
        defaultValue: config.defaultValue,
        required: config.required,
        schema: config.schema,
        version: config.version,
      })),

      metadata: dto.metadata ?? {},
    };

    const hashPayload = this.buildHashPayload({
      applicationId: application.id,
      applicationVersionId: applicationVersion.id,
      environmentId: environment.id,
      contracts: snapshotData.contracts,
      configuration: snapshotData.configuration,
      metadata: snapshotData.metadata,
    });

    const canonicalRepresentation = this.canonicalize(hashPayload);

    const hash = createHash('sha256')
      .update(canonicalRepresentation)
      .digest('hex');

    const createdBy = 'system';

    const snapshot = await this.prisma.$transaction(async (tx) => {
      const createdSnapshot = await tx.snapshot.create({
        data: {
          applicationId: application.id,
          applicationVersionId: applicationVersion.id,
          environmentId: environment.id,

          contracts: snapshotData.contracts,
          configuration: snapshotData.configuration,
          metadata: snapshotData.metadata,

          createdBy,
          hash,
          status: 'DRAFT',
        },
      });

      await tx.snapshotHistory.create({
        data: {
          snapshotId: createdSnapshot.id,
          action: 'CREATED',
          createdBy,
          traceId,
          reason: 'Snapshot created',
        },
      });

      return createdSnapshot;
    });

    return snapshot;
  }

  async findAll() {
    return this.prisma.snapshot.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: {
        id,
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    return snapshot;
  }

  async getHistory(id: string) {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: {
        id,
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    return this.prisma.snapshotHistory.findMany({
      where: {
        snapshotId: id,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async compare(left: string, right: string) {
    const [leftSnapshot, rightSnapshot] = await Promise.all([
      this.prisma.snapshot.findUnique({
        where: {
          id: left,
        },
      }),
      this.prisma.snapshot.findUnique({
        where: {
          id: right,
        },
      }),
    ]);

    if (!leftSnapshot) {
      throw new NotFoundException('Left snapshot not found');
    }

    if (!rightSnapshot) {
      throw new NotFoundException('Right snapshot not found');
    }

    const leftConfigurations = Array.isArray(leftSnapshot.configuration)
      ? leftSnapshot.configuration
      : [];

    const rightConfigurations = Array.isArray(rightSnapshot.configuration)
      ? rightSnapshot.configuration
      : [];

    const leftContracts = Array.isArray(leftSnapshot.contracts)
      ? leftSnapshot.contracts
      : [];

    const rightContracts = Array.isArray(rightSnapshot.contracts)
      ? rightSnapshot.contracts
      : [];

    const leftMap = new Map(
      leftConfigurations.map((config: any) => [
        `${config.key}:${config.scope}:${config.scopeId ?? ''}`,
        config,
      ]),
    );

    const rightMap = new Map(
      rightConfigurations.map((config: any) => [
        `${config.key}:${config.scope}:${config.scopeId ?? ''}`,
        config,
      ]),
    );

    const leftContractMap = new Map(
      leftContracts.map((contract: any) => [contract.contractCode, contract]),
    );

    const rightContractMap = new Map(
      rightContracts.map((contract: any) => [contract.contractCode, contract]),
    );

    const added: any[] = [];
    const removed: any[] = [];
    const changed: any[] = [];
    const unchanged: any[] = [];

    const contractsAdded: any[] = [];
    const contractsRemoved: any[] = [];
    const contractsChanged: any[] = [];
    const contractsUnchanged: any[] = [];

    for (const [key, rightConfig] of rightMap) {
      const leftConfig = leftMap.get(key);

      if (!leftConfig) {
        added.push(rightConfig);
        continue;
      }

      if (JSON.stringify(leftConfig) !== JSON.stringify(rightConfig)) {
        changed.push({
          key,
          before: leftConfig,
          after: rightConfig,
        });
        continue;
      }

      unchanged.push(rightConfig);
    }

    for (const [key, leftConfig] of leftMap) {
      if (!rightMap.has(key)) {
        removed.push(leftConfig);
      }
    }

    for (const [key, rightContract] of rightContractMap) {
      const leftContract = leftContractMap.get(key);

      if (!leftContract) {
        contractsAdded.push(rightContract);
        continue;
      }

      if (JSON.stringify(leftContract) !== JSON.stringify(rightContract)) {
        contractsChanged.push({
          key,
          before: leftContract,
          after: rightContract,
        });
        continue;
      }

      contractsUnchanged.push(rightContract);
    }

    for (const [key, leftContract] of leftContractMap) {
      if (!rightContractMap.has(key)) {
        contractsRemoved.push(leftContract);
      }
    }

    return {
      left: {
        id: leftSnapshot.id,
        hash: leftSnapshot.hash,
        status: leftSnapshot.status,
      },

      right: {
        id: rightSnapshot.id,
        hash: rightSnapshot.hash,
        status: rightSnapshot.status,
      },

      configuration: {
        added,
        removed,
        changed,
        unchanged,
      },

      contracts: {
        added: contractsAdded,
        removed: contractsRemoved,
        changed: contractsChanged,
        unchanged: contractsUnchanged,
      },
    };
  }

  async validate(id: string, traceId?: string) {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: {
        id,
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    // Un snapshot déjà validé ou archivé est immuable
    if (snapshot.status === 'VALID' || snapshot.status === 'ACTIVE') {
      return snapshot;
    }

    if (snapshot.status === 'ARCHIVED') {
      throw new BadRequestException('Archived snapshot cannot be validated');
    }

    // Passage temporaire en VALIDATING
    await this.prisma.snapshot.update({
      where: {
        id,
      },
      data: {
        status: 'VALIDATING',
      },
    });

    try {
      // Vérifications minimales du contenu du snapshot
      if (!snapshot.applicationVersionId) {
        throw new Error('Application version is missing');
      }

      if (!snapshot.environmentId) {
        throw new Error('Environment is missing');
      }

      if (!snapshot.hash) {
        throw new Error('Snapshot hash is missing');
      }

      const hashPayload = this.buildHashPayload({
        applicationId: snapshot.applicationId,
        applicationVersionId: snapshot.applicationVersionId,
        environmentId: snapshot.environmentId,
        contracts: snapshot.contracts,
        configuration: snapshot.configuration,
        metadata: snapshot.metadata ?? {},
      });

      const canonicalRepresentation = this.canonicalize(hashPayload);

      const recalculatedHash = createHash('sha256')
        .update(canonicalRepresentation)
        .digest('hex');

      if (recalculatedHash !== snapshot.hash) {
        throw new Error('Snapshot integrity check failed');
      }

      // Validation réussie
      const validatedSnapshot = await this.prisma.$transaction(async (tx) => {
        const updatedSnapshot = await tx.snapshot.update({
          where: {
            id,
          },
          data: {
            status: 'VALID',
          },
        });

        await tx.snapshotHistory.create({
          data: {
            snapshotId: id,
            action: 'VALIDATED',
            createdBy: snapshot.createdBy,
            traceId,
            reason: 'Snapshot validated successfully',
          },
        });

        return updatedSnapshot;
      });

      return validatedSnapshot;
    } catch (error) {
      // Validation échouée
      await this.prisma.$transaction(async (tx) => {
        await tx.snapshot.update({
          where: {
            id,
          },
          data: {
            status: 'INVALID',
          },
        });

        await tx.snapshotHistory.create({
          data: {
            snapshotId: id,
            action: 'VALIDATED',
            createdBy: snapshot.createdBy,
            traceId,
            reason: `Snapshot validation failed: ${
              error instanceof Error ? error.message : 'Unknown error'
            }`,
          },
        });
      });

      throw new BadRequestException(
        error instanceof Error ? error.message : 'Snapshot validation failed',
      );
    }
  }

  async activate(id: string, traceId?: string) {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: {
        id,
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    if (snapshot.status === 'ACTIVE') {
      return snapshot;
    }

    if (snapshot.status !== 'VALID') {
      throw new BadRequestException('Only a valid snapshot can be activated');
    }

    const activatedSnapshot = await this.prisma.$transaction(async (tx) => {
      const updatedSnapshot = await tx.snapshot.update({
        where: {
          id,
        },
        data: {
          status: 'ACTIVE',
        },
      });

      await tx.snapshotHistory.create({
        data: {
          snapshotId: id,
          action: 'ACTIVATED',
          createdBy: snapshot.createdBy,
          traceId,
          reason: 'Snapshot activated',
        },
      });

      return updatedSnapshot;
    });

    return activatedSnapshot;
  }

  async archive(id: string, traceId?: string) {
    const snapshot = await this.prisma.snapshot.findUnique({
      where: {
        id,
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot not found');
    }

    if (snapshot.status === 'ARCHIVED') {
      return snapshot;
    }

    if (snapshot.status !== 'ACTIVE') {
      throw new BadRequestException('Only an active snapshot can be archived');
    }

    const archivedSnapshot = await this.prisma.$transaction(async (tx) => {
      const updatedSnapshot = await tx.snapshot.update({
        where: {
          id,
        },
        data: {
          status: 'ARCHIVED',
        },
      });

      await tx.snapshotHistory.create({
        data: {
          snapshotId: id,
          action: 'ARCHIVED',
          createdBy: snapshot.createdBy,
          traceId,
          reason: 'Snapshot archived',
        },
      });

      return updatedSnapshot;
    });

    return archivedSnapshot;
  }
}
