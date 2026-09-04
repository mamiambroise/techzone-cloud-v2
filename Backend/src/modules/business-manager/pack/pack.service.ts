import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pack } from '../entities/pack.entity';
import { PackVersion } from '../entities/pack-version.entity';

@Injectable()
export class PackService {
  constructor(
    @InjectRepository(Pack) private readonly packs: Repository<Pack>,
    @InjectRepository(PackVersion) private readonly versions: Repository<PackVersion>,
  ) {}

  listPacks() { return this.packs.find({ order: { createdAt: 'DESC' } }); }
  async getPack(id: string) { const pack = await this.packs.findOne({ where: { id } }); if (!pack) throw new NotFoundException('PACK_NOT_FOUND'); return pack; }

  async createPack(input: Partial<Pack>) {
    if (await this.packs.findOne({ where: { code: input.code } })) throw new ConflictException('PACK_CODE_EXISTS');
    return this.packs.save(this.packs.create({ code: String(input.code).trim(), name: String(input.name).trim(), description: input.description, status: input.status || 'DRAFT', metadata: input.metadata || {} }));
  }

  async updatePack(id: string, input: Partial<Pack>) {
    const pack = await this.getPack(id);
    return this.packs.save({ ...pack, ...input, id, code: pack.code });
  }

  async listVersions(packId: string) { await this.getPack(packId); return this.versions.find({ where: { packId }, order: { createdAt: 'DESC' } }); }

  async createVersion(packId: string, input: Partial<PackVersion>) {
    await this.getPack(packId);
    if (await this.versions.findOne({ where: { packId, versionNumber: input.versionNumber } })) throw new ConflictException('PACK_VERSION_EXISTS');
    return this.versions.save(this.versions.create({ packId, versionNumber: String(input.versionNumber), status: input.status || 'DRAFT', snapshot: input.snapshot || {}, modules: input.modules || [], features: input.features || [], capabilities: input.capabilities || [], dependencies: input.dependencies || [], rules: input.rules || [], validation: input.validation || {} }));
  }

  async getVersion(id: string) { const version = await this.versions.findOne({ where: { id } }); if (!version) throw new NotFoundException('PACK_VERSION_NOT_FOUND'); return version; }

  async updateVersion(id: string, input: Partial<PackVersion>) {
    const version = await this.getVersion(id);
    if (version.status === 'PUBLISHED' || version.status === 'DEPRECATED') throw new ConflictException('PACK_VERSION_IMMUTABLE');
    return this.versions.save({ ...version, ...input, id, packId: version.packId });
  }

  async replaceVersionState(id: string, state: Partial<PackVersion>) {
    return this.updateVersion(id, { ...state, validation: state.validation || {} });
  }
}
