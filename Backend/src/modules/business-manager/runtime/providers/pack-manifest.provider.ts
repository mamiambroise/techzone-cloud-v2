import { Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PackManagerService } from '../../pack-manager/pack-manager.service';
import { PackVersionStatus } from '../../../../common/enums';
import type { PackManifest } from '../contracts/runtime.contracts';

export interface ManifestLookup {
  tenantId: string;
  applicationId: string;
  packCode?: string;
  packVersion?: string;
  manifestId?: string;
  manifestHash?: string;
  environment: string;
  preview?: boolean;
}

export interface PublishedManifest {
  manifest: PackManifest;
  publicationStatus: string;
  sourceRef: string;
}

@Injectable()
export class PackManifestProvider {
  constructor(private readonly packManager: PackManagerService) {}

  async getPublishedManifest(request: ManifestLookup): Promise<PublishedManifest> {
    if (!request.manifestId && !request.manifestHash && (!request.packCode || !request.packVersion)) {
      throw new NotFoundException('RUNTIME_MANIFEST_NOT_FOUND');
    }

    const version = request.manifestId
      ? await this.packManager.getVersion(request.tenantId, request.manifestId)
      : request.manifestHash
        ? await this.packManager.getVersionByManifestHash(request.tenantId, request.manifestHash)
        : await this.packManager.getVersionByPackCode(request.tenantId, request.packCode as string, request.packVersion as string);
    if (!version || (request.manifestHash && version.manifestHash !== request.manifestHash)) {
      throw new NotFoundException('RUNTIME_MANIFEST_NOT_FOUND');
    }
    if (![PackVersionStatus.PUBLISHED, PackVersionStatus.SUPERSEDED, PackVersionStatus.DEPRECATED].includes(version.status) && !request.preview) {
      throw new NotFoundException('RUNTIME_PACK_NOT_PUBLISHED');
    }
    if (request.preview && request.environment === 'PROD') {
      throw new NotFoundException('RUNTIME_PREVIEW_FORBIDDEN');
    }
    if (!version.manifest) throw new NotFoundException('RUNTIME_MANIFEST_NOT_FOUND');

    const source = version.manifest as Record<string, unknown>;
    const manifest: PackManifest = {
      contract: String(source.contract ?? 'techzone.pack-manifest') as PackManifest['contract'],
      contractVersion: String(source.contractVersion ?? '1.0'),
      pack: { code: String((source.pack as any)?.code ?? version.pack?.code), version: version.versionNumber },
      modules: Array.isArray(source.modules) ? source.modules.map((item: any) => typeof item === 'string' ? { code: item } : item) : [],
      features: Array.isArray(source.features) ? source.features.map((item: any) => typeof item === 'string' ? { code: item } : item) : [],
      capabilities: Array.isArray(source.capabilities) ? { pack: source.capabilities as string[] } : (source.capabilities as Record<string, string[]> ?? {}),
      dependencies: Array.isArray(source.dependencies) ? source.dependencies as PackManifest['dependencies'] : [],
      rules: Array.isArray(source.rules) ? source.rules as PackManifest['rules'] : (Array.isArray(source.activationRules) ? source.activationRules as PackManifest['rules'] : []),
      manifestHash: '',
    };
    manifest.manifestHash = this.hash({ ...manifest, manifestHash: undefined });
    return { manifest, publicationStatus: version.status, sourceRef: version.id };
  }

  private hash(value: unknown) {
    return `sha256:${createHash('sha256').update(JSON.stringify(this.sortObject(value))).digest('hex')}`;
  }

  private sortObject(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.sortObject(item));
    if (value && typeof value === 'object') return Object.keys(value as Record<string, unknown>).sort().reduce((result, key) => ({ ...result, [key]: this.sortObject((value as Record<string, unknown>)[key]) }), {});
    return value;
  }
}