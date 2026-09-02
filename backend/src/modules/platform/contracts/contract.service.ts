import { HttpStatus, Injectable } from '@nestjs/common';

import { createHash } from 'crypto';

import { Prisma } from '../../../generated/prisma/client';

import { PrismaService } from '../../../prisma/prisma.service';

import { PlatformErrorCode } from '../../../common/errors/platform-error-code.enum';
import { PlatformException } from '../../../common/errors/platform.exception';

import {
  ContractHistoryAction,
  ContractStatus,
} from '../../../generated/prisma/enums';

import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateContractDto) {
    const contractCode = dto.contractCode.trim();
    const contractVersion = dto.contractVersion.trim();
    const ownerTeam = dto.ownerTeam.trim();

    /*
     * Une combinaison contractCode + contractVersion
     * représente une version unique d'un contrat.
     */
    const existing = await this.prisma.contract.findUnique({
      where: {
        contractCode_contractVersion: {
          contractCode,
          contractVersion,
        },
      },
    });

    if (existing) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_EXISTS,
        `Contract "${contractCode}" version "${contractVersion}" already exists`,
        HttpStatus.CONFLICT,
      );
    }

    /*
     * Représentation canonique du contrat.
     *
     * Le même contenu produit le même hash.
     */
    const canonicalContract = {
      contractCode,
      contractVersion,
      ownerTeam,
      schema: dto.schema,
      compatibilityPolicy: dto.compatibilityPolicy,
    };

    const canonicalJson = JSON.stringify(canonicalContract);

    const hash = createHash('sha256')
      .update(canonicalJson, 'utf8')
      .digest('hex');

    /*
     * Création du contrat et de son historique
     * dans une seule transaction.
     */
    return this.prisma.$transaction(async (tx) => {
      const contract = await tx.contract.create({
        data: {
          contractCode,
          contractVersion,
          ownerTeam,
          status: ContractStatus.DRAFT,

          schema: dto.schema as Prisma.InputJsonValue,

          compatibilityPolicy: dto.compatibilityPolicy as Prisma.InputJsonValue,

          hash,
        },
      });

      await tx.contractHistory.create({
        data: {
          contractId: contract.id,
          action: ContractHistoryAction.CREATED,
          actor: null,

          changes: {
            contractCode: contract.contractCode,
            contractVersion: contract.contractVersion,
            ownerTeam: contract.ownerTeam,
            status: contract.status,
            hash: contract.hash,
          },

          metadata: {
            source: 'CONTRACT_REGISTRY',
          },
        },
      });

      return contract;
    });
  }

  async findAll() {
    return this.prisma.contract.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: {
        id,
      },
      include: {
        providers: true,
        consumers: true,
        history: {
          orderBy: {
            createdAt: 'desc',
          },
        },
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

  async validate(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: {
        id,
      },
    });

    if (!contract) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_NOT_FOUND,
        `Contract "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Un contrat verrouillé ou actif ne doit plus être revalidé/modifié
    if (
      contract.status === ContractStatus.LOCKED ||
      contract.status === ContractStatus.ACTIVE ||
      contract.status === ContractStatus.DEPRECATED ||
      contract.status === ContractStatus.RETIRED
    ) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_LOCKED,
        `Contract "${id}" is already immutable`,
        HttpStatus.CONFLICT,
      );
    }

    // La validation doit commencer depuis DRAFT
    if (contract.status !== ContractStatus.DRAFT) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_INVALID_STATUS,
        `Contract "${id}" cannot be validated from status "${contract.status}"`,
        HttpStatus.CONFLICT,
      );
    }

    // Validation minimale du schema
    if (
      !contract.schema ||
      typeof contract.schema !== 'object' ||
      Array.isArray(contract.schema)
    ) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_COMPATIBILITY_ERROR,
        `Contract "${id}" has an invalid schema`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validation minimale de la politique de compatibilité
    if (
      !contract.compatibilityPolicy ||
      typeof contract.compatibilityPolicy !== 'object' ||
      Array.isArray(contract.compatibilityPolicy)
    ) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_COMPATIBILITY_ERROR,
        `Contract "${id}" has an invalid compatibility policy`,
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedContract = await tx.contract.update({
        where: {
          id: contract.id,
        },
        data: {
          status: ContractStatus.VALIDATING,
        },
      });

      await tx.contractHistory.create({
        data: {
          contractId: contract.id,
          action: ContractHistoryAction.VALIDATED,
          actor: null,
          changes: {
            previousStatus: ContractStatus.DRAFT,
            newStatus: ContractStatus.VALIDATING,
          },
          metadata: {
            source: 'CONTRACT_REGISTRY',
          },
        },
      });

      return updatedContract;
    });
  }

  async lock(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: {
        id,
      },
    });

    if (!contract) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_NOT_FOUND,
        `Contract "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Seul un contrat en cours de validation peut être verrouillé
    if (contract.status !== ContractStatus.VALIDATING) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_INVALID_STATUS,
        `Contract "${id}" cannot be locked from status "${contract.status}"`,
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const lockedContract = await tx.contract.update({
        where: {
          id: contract.id,
        },
        data: {
          status: ContractStatus.LOCKED,
          publishedAt: new Date(),
        },
      });

      await tx.contractHistory.create({
        data: {
          contractId: contract.id,
          action: ContractHistoryAction.LOCKED,
          actor: null,
          changes: {
            previousStatus: ContractStatus.VALIDATING,
            newStatus: ContractStatus.LOCKED,
          },
          metadata: {
            source: 'CONTRACT_REGISTRY',
            reason: 'CONTRACT_VERSION_LOCKED',
          },
        },
      });

      return lockedContract;
    });
  }

  async getCompatibility(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: {
        id,
      },
      include: {
        consumers: true,
        providers: true,
      },
    });

    if (!contract) {
      throw new PlatformException(
        PlatformErrorCode.CONTRACT_NOT_FOUND,
        `Contract "${id}" not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    // Récupérer la version précédente du même contrat
    const previousContract = await this.prisma.contract.findFirst({
      where: {
        contractCode: contract.contractCode,
        contractVersion: {
          not: contract.contractVersion,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let breakingChange = false;

    if (previousContract) {
      breakingChange = this.detectBreakingChange(
        previousContract.schema,
        contract.schema,
      );
    }

    const consumerCompatibility = contract.consumers.map((consumer) => ({
      consumerCode: consumer.consumerCode,
      supportedVersion: consumer.supportedVersion,
      compatible:
        !consumer.supportedVersion ||
        consumer.supportedVersion === contract.contractVersion,
    }));

    const allConsumersCompatible = consumerCompatibility.every(
      (consumer) => consumer.compatible,
    );

    return {
      contractId: contract.id,
      contractCode: contract.contractCode,
      contractVersion: contract.contractVersion,
      status: contract.status,

      previousVersion: previousContract?.contractVersion ?? null,

      breakingChange,

      providerCompatibility: true,

      consumerCompatibility,
      allConsumersCompatible,

      deprecated: contract.status === ContractStatus.DEPRECATED,

      compatible:
        !breakingChange &&
        allConsumersCompatible &&
        contract.status !== ContractStatus.RETIRED,
    };
  }

  private detectBreakingChange(
    previousSchema: Prisma.JsonValue,
    currentSchema: Prisma.JsonValue,
  ): boolean {
    if (
      typeof previousSchema !== 'object' ||
      previousSchema === null ||
      Array.isArray(previousSchema) ||
      typeof currentSchema !== 'object' ||
      currentSchema === null ||
      Array.isArray(currentSchema)
    ) {
      return false;
    }

    const previous = previousSchema as Record<string, any>;
    const current = currentSchema as Record<string, any>;

    const previousProperties = previous.properties ?? {};
    const currentProperties = current.properties ?? {};

    const previousRequired = previous.required ?? [];
    const currentRequired = current.required ?? [];

    // Une propriété existante supprimée = breaking change
    for (const property of Object.keys(previousProperties)) {
      if (!(property in currentProperties)) {
        return true;
      }
    }

    // Une nouvelle propriété obligatoire = breaking change
    for (const property of currentRequired) {
      if (!previousRequired.includes(property)) {
        return true;
      }
    }

    // Une propriété obligatoire supprimée n'est pas breaking
    // car les anciens consommateurs peuvent toujours l'envoyer.

    return false;
  }
}
