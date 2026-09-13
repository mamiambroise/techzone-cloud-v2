import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import type { EffectiveRuntimeManifest, RuntimeProjection } from './contracts/runtime.contracts';
import { RuntimeResolverService } from './runtime-resolver.service';

@Injectable()
export class EffectiveManifestService {
  constructor(private readonly resolver: RuntimeResolverService) {}

  getResolutionManifest(id: string) {
    const resolution = this.resolver.getResolution(id);
    return resolution.manifest;
  }

  getEffectiveManifestByResolution(id: string, projection: RuntimeProjection = 'FULL') {
    const manifest = this.getResolutionManifest(id);
    return this.project(manifest, projection);
  }

  getCurrentEffectiveManifest(applicationId: string, packCode: string, tenantId: string, projection: RuntimeProjection = 'FULL') {
    const records = this.resolver.listResolutions().filter((record) => {
      return record.context.tenantId === tenantId
        && record.context.applicationId === applicationId
        && record.manifest.sourceManifest.packCode === packCode;
    });
    const record = records.sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
    if (!record) throw new NotFoundException('RUNTIME_EFFECTIVE_MANIFEST_NOT_FOUND');
    return this.project(record.manifest, projection);
  }

  compare(left: string, right: string) {
    return this.resolver.compareResolutions(left, right);
  }

  validate(manifest: EffectiveRuntimeManifest) {
    if (manifest.contract !== 'techzone.effective-runtime-manifest') {
      throw new BadRequestException({ error: { code: 'RUNTIME_EFFECTIVE_MANIFEST_CONTRACT_UNSUPPORTED', message: 'Unsupported Effective Runtime Manifest contract.' } });
    }
    if (manifest.contractVersion !== '1.0') {
      throw new BadRequestException({ error: { code: 'RUNTIME_EFFECTIVE_MANIFEST_CONTRACT_UNSUPPORTED', message: 'Unsupported Effective Runtime Manifest contract version.' } });
    }
    if (!manifest.sourceManifest?.packCode || !manifest.sourceManifest?.packVersion || !manifest.resolution?.status) {
      throw new BadRequestException({ error: { code: 'RUNTIME_EFFECTIVE_MANIFEST_INVALID', message: 'Effective Runtime Manifest is incomplete.' } });
    }
    if (!manifest.effectiveManifestHash || !manifest.effectiveManifestHash.startsWith('sha256:')) {
      throw new BadRequestException({ error: { code: 'RUNTIME_EFFECTIVE_MANIFEST_HASH_MISMATCH', message: 'Effective Runtime Manifest hash is missing or invalid.' } });
    }
    const functionalHash = createHash('sha256').update(JSON.stringify({
      contract: manifest.contract,
      contractVersion: manifest.contractVersion,
      sourceManifest: manifest.sourceManifest,
      context: manifest.context,
      modules: manifest.modules,
      features: manifest.features,
      capabilities: manifest.capabilities,
      resolution: manifest.resolution,
      configuration: manifest.configuration,
    })).digest('hex');
    return {
      valid: true,
      contract: manifest.contract,
      contractVersion: manifest.contractVersion,
      effectiveManifestHash: manifest.effectiveManifestHash,
      effectiveConfigHash: `sha256:${functionalHash}`,
      projection: 'FULL',
      diagnostics: { warnings: 0, errors: 0, blockedItems: 0 },
    };
  }

  project(manifest: EffectiveRuntimeManifest, projection: RuntimeProjection = 'FULL') {
    switch (projection.toUpperCase()) {
      case 'UI':
        return {
          contract: manifest.contract,
          contractVersion: manifest.contractVersion,
          sourceManifest: manifest.sourceManifest,
          context: manifest.context,
          resolution: manifest.resolution,
          modules: manifest.modules.filter((item) => item.state === 'ACTIVE').map((item) => ({ code: item.code, state: item.state, order: item.order ?? 0, reasonCode: item.reasonCode })),
          features: manifest.features.filter((item) => item.state === 'ACTIVE').map((item) => ({ code: item.code, module: item.moduleCode, state: item.state, visibility: item.visibility, reasonCode: item.reasonCode })),
          capabilities: manifest.capabilities,
          configuration: manifest.configuration,
          permissions: manifest.permissions,
          restrictions: manifest.restrictions,
          integrity: manifest.integrity,
        };
      case 'API':
        return {
          contract: manifest.contract,
          contractVersion: manifest.contractVersion,
          sourceManifest: manifest.sourceManifest,
          context: manifest.context,
          resolution: manifest.resolution,
          capabilities: manifest.capabilities,
          dependencies: manifest.dependencies,
          restrictions: manifest.restrictions,
          permissions: manifest.permissions,
          integrity: manifest.integrity,
        };
      case 'DIAGNOSTIC':
        return {
          contract: manifest.contract,
          contractVersion: manifest.contractVersion,
          sourceManifest: manifest.sourceManifest,
          context: manifest.context,
          resolution: manifest.resolution,
          modules: manifest.modules,
          features: manifest.features,
          capabilities: manifest.capabilities,
          dependencies: manifest.dependencies,
          permissions: manifest.permissions,
          restrictions: manifest.restrictions,
          diagnostics: manifest.diagnostics,
          integrity: manifest.integrity,
        };
      case 'FULL':
      default:
        return manifest;
    }
  }
}
