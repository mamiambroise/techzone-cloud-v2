import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateErpDto } from './dto/create-erp.dto';
import { UpdateErpDto } from './dto/update-erp.dto';
import { ERPRegistry } from '@prisma/client';

@Injectable()
export class ErpRegistryService {
  private readonly logger = new Logger(ErpRegistryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateErpDto): Promise<ERPRegistry> {
    this.logger.log(`Creation ERP: ${dto.code}`);

    const existing = await this.prisma.eRPRegistry.findUnique({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException(`Code ERP "${dto.code}" deja existant`);
    }

    const data: any = {
      code: dto.code,
      nom: dto.nom,
      type: dto.type,
      url: dto.url,
    };
    if (dto.environment) {
      data.capabilities = { environment: dto.environment };
    }

    const erp = await this.prisma.eRPRegistry.create({ data });
    this.logger.log(`ERP cree: ${erp.id}`);
    return erp;
  }

  async getAll(): Promise<ERPRegistry[]> {
    this.logger.log('Liste de tous les ERP');
    return this.prisma.eRPRegistry.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: string): Promise<ERPRegistry> {
    this.logger.log(`Recuperation ERP: ${id}`);
    const erp = await this.prisma.eRPRegistry.findUnique({
      where: { id },
      include: { entityMappings: true },
    });
    if (!erp) {
      throw new NotFoundException(`ERP "${id}" non trouve`);
    }
    return erp;
  }

  async getByCode(code: string): Promise<ERPRegistry> {
    this.logger.log(`Recuperation ERP par code: ${code}`);
    const erp = await this.prisma.eRPRegistry.findUnique({
      where: { code },
    });
    if (!erp) {
      throw new NotFoundException(`ERP avec le code "${code}" non trouve`);
    }
    return erp;
  }

  async update(id: string, dto: UpdateErpDto): Promise<ERPRegistry> {
    this.logger.log(`Mise a jour ERP: ${id}`);
    await this.getOne(id);

    const data: any = {};
    if (dto.nom !== undefined) data.nom = dto.nom;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.url !== undefined) data.url = dto.url;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.environment !== undefined) data.capabilities = { environment: dto.environment };

    const erp = await this.prisma.eRPRegistry.update({
      where: { id },
      data,
    });
    this.logger.log(`ERP mis a jour: ${erp.id}`);
    return erp;
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Suppression ERP: ${id}`);
    await this.getOne(id);
    await this.prisma.eRPRegistry.delete({ where: { id } });
    this.logger.log(`ERP supprime: ${id}`);
  }
}
