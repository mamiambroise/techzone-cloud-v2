import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { DataSource, ObjectLiteral } from 'typeorm';
import { ApplicationVersion } from '../entities/application-version.entity';
import { ContractArtifact } from '../entities/contract-artifact.entity';
import { DataModelDefinition } from '../entities/data-model.entity';
import { IntegrationBinding } from '../entities/integration-binding.entity';
import { IntegrationDefinition } from '../entities/integration-definition.entity';
import { RuntimeSnapshot } from '../entities/runtime-snapshot.entity';
import { VersionCapability } from '../entities/version-capability.entity';
import { VersionFeature } from '../entities/version-feature.entity';
import { VersionMenu } from '../entities/version-menu.entity';
import { ApplicationVersionStatus, VersionFeatureState } from '../../../common/enums';

export interface RuntimeIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message?: string;
  bindingId?: string;
}

@Injectable()
export class RuntimeBridgeService {
  constructor(@InjectDataSource() private readonly db: DataSource) { }

  private repo = <T extends ObjectLiteral>(t: any) => this.db.getRepository<T>(t);

  async manifest(versionId: string, environment = 'DEV', channel = 'WEB') {
    const version = await this.version(versionId);
    const [models, features, capabilities, menus, bindings] = await Promise.all([
      this.repo<DataModelDefinition>(DataModelDefinition).find({ where: { versionId } }),
      this.repo<VersionFeature>(VersionFeature).find({ where: { applicationVersionId: versionId }, relations: ['feature'] }),
      this.repo<VersionCapability>(VersionCapability).find({ where: { applicationVersionId: versionId }, relations: ['capability'] }),
      this.repo<VersionMenu>(VersionMenu).find({ where: { applicationVersionId: versionId, enabled: true } }),
      this.repo<IntegrationBinding>(IntegrationBinding).find({ where: { applicationVersionId: versionId, ...(environment ? { environment } : {}) } }),
    ]);

    const enabledFeatures = features.filter((x) => x.state !== VersionFeatureState.DISABLED).map((x) => ({ code: x.feature?.code, state: x.state })).sort((a, b) => String(a.code).localeCompare(String(b.code)));
    const enabledCapabilities = capabilities.filter((x) => x.enabled).map((x) => x.capability?.code).filter(Boolean).sort();
    const navigationItems = menus.map((x) => x.menuId).sort();
    const integrationEntries = bindings.filter((x) => x.status === 'ENABLED').map((x) => ({ id: x.id, targetId: x.targetId, required: x.required, environment: x.environment }));

    const payload = {
      manifestVersion: '2.0.0',
      applicationId: version.applicationId,
      applicationVersionId: versionId,
      application: { id: version.applicationId },
      applicationVersion: {
        id: versionId,
        applicationId: version.applicationId,
        versionNumber: version.versionNumber,
        lifecycleStatus: version.status,
        published: version.status === ApplicationVersionStatus.PUBLISHED,
        revision: version.version,
        snapshotId: version.id,
      },
      environment: environment ?? 'DEV',
      channel: channel ?? 'WEB',
      dataModel: {
        entities: models.map((x) => ({ id: x.id, name: x.name, schemaVersion: x.schemaVersion, fieldCount: Array.isArray(x.fields) ? x.fields.length : 0 })),
        fields: models.flatMap((x) => (Array.isArray(x.fields) ? x.fields.map((field: any) => ({ modelId: x.id, modelName: x.name, ...field })) : [])),
        relationships: models.flatMap((x) => Array.isArray(x.relationships) ? x.relationships : []),
        constraints: models.flatMap((x) => Array.isArray(x.constraints) ? x.constraints : []),
        schemaHash: this.hash(models),
      },
      features: {
        features: enabledFeatures,
        enabledFeatures: enabledFeatures.map((x) => x.code),
        requiredFeatures: enabledFeatures.filter((x) => x.state === 'ENABLED').map((x) => x.code),
        optionalFeatures: enabledFeatures.filter((x) => x.state === 'EXPERIMENTAL').map((x) => x.code),
        dependencies: [],
      },
      capabilities: {
        capabilities: enabledCapabilities,
        enabledCapabilities: enabledCapabilities,
        dependencies: [],
        requirements: [],
        restrictions: [],
      },
      navigation: {
        location: 'APP',
        items: navigationItems,
        routes: navigationItems,
        requirements: [],
        visibilityRules: [],
        navigationHash: this.hash(navigationItems),
      },
      configuration: {
        environment: environment ?? 'DEV',
        values: {},
        sources: [],
        runtimeMetadata: { environment, channel },
        schemaVersions: {},
        configurationHash: this.hash({ environment, channel }),
      },
      metadata: {
        application: { id: version.applicationId },
        version: { id: versionId, versionNumber: version.versionNumber },
        entities: models.map((x) => x.name),
        features: enabledFeatures.map((x) => x.code),
        custom: {},
      },
      integrations: integrationEntries,
      permissions: [],
      compatibility: { status: 'COMPATIBLE', manifestVersion: '2.0.0' },
      revisions: { bridgeRevision: '1', manifestRevision: '1' },
      generatedAt: new Date().toISOString(),
      version: version.versionNumber,
      dataModels: models.map((x) => ({ id: x.id, name: x.name, schemaVersion: x.schemaVersion })),
      featuresList: enabledFeatures,
      capabilitiesList: enabledCapabilities,
      menus: navigationItems,
      integrationsList: integrationEntries,
    };

    const normalized = this.normalize(payload) as Record<string, unknown>;
    return { ...normalized, manifestHash: this.hash(normalized) } as Record<string, unknown> & { manifestHash: string };
  }

  async readiness(versionId: string, environment?: string) {
    const [manifest, bindings] = await Promise.all([
      this.manifest(versionId, environment ?? 'DEV', 'WEB'),
      this.repo<IntegrationBinding>(IntegrationBinding).find({ where: { applicationVersionId: versionId, ...(environment ? { environment } : {}) } }),
    ]);

    const issues: RuntimeIssue[] = [];
    const warnings: RuntimeIssue[] = [];
    const requiredInvalid = bindings.filter((binding: IntegrationBinding) => binding.required && binding.status !== 'ENABLED');
    for (const binding of requiredInvalid) {
      issues.push({ severity: 'ERROR', code: 'INTEGRATION_BINDING_INVALID', message: 'Required integration binding is not enabled.', bindingId: binding.id });
    }

    const capabilitiesList = Array.isArray((manifest as Record<string, unknown>).capabilitiesList) ? ((manifest as Record<string, unknown>).capabilitiesList as unknown[]) : [];
    if (!capabilitiesList.length) {
      warnings.push({ severity: 'WARNING', code: 'RUNTIME_NO_CAPABILITIES', message: 'No runtime capabilities are exposed for this version.' });
    }

    const blockingIssues = [...issues];
    const ready = !issues.length;
    const result = {
      ready,
      blockingIssues,
      warnings,
      issues: [...issues, ...warnings],
      contractStatus: ready ? 'VALID' : 'INVALID',
      snapshotStatus: 'READY',
      compatibilityStatus: 'COMPATIBLE',
      manifestHash: manifest.manifestHash,
      metadata: {
        applicationVersionId: versionId,
        environment: environment ?? 'DEV',
        channel: 'WEB',
      },
    } as const;
    return result;
  }

  async generateContracts(versionId: string) {
    const manifest = await this.manifest(versionId);
    const types = {
      application: { applicationId: manifest.applicationId, version: manifest.version, applicationVersion: manifest.applicationVersion },
      dataModel: manifest.dataModel,
      features: manifest.features,
      capabilities: manifest.capabilities,
      navigation: manifest.navigation,
      integrations: manifest.integrations,
      configuration: manifest.configuration,
      metadata: manifest.metadata,
    } as const;

    const r = this.repo<ContractArtifact>(ContractArtifact);
    return Promise.all(Object.entries(types).map(async ([contractType, content]) => {
      const contentHash = this.hash(content);
      const existing = await r.findOne({ where: { applicationVersionId: versionId, contractType, contentHash } });
      if (existing) return existing;
      return r.save(
        r.create({
          applicationId: String(manifest.applicationId),
          applicationVersionId: versionId,
          contractType,
          contentHash,
          content,
          contractVersion: '1.0.0',
          schemaVersion: 1,
          revision: 1,
          status: 'VALID',
        }),
      );
    }));
  }

  async contracts(versionId: string, type?: string) {
    return this.repo<ContractArtifact>(ContractArtifact).find({
      where: { applicationVersionId: versionId, ...(type ? { contractType: type } : {}) },
      order: { generatedAt: 'DESC' },
    });
  }

  async snapshot(versionId: string, environment?: string) {
    const version = await this.version(versionId);
    const manifest = await this.manifest(versionId, environment ?? 'DEV', 'WEB');
    const r = this.repo<RuntimeSnapshot>(RuntimeSnapshot);
    const payload = { snapshotVersion: '1.0.0', applicationId: version.applicationId, applicationVersionId: versionId, environment: environment ?? 'DEV', manifest, contributors: [], sourceHashes: [manifest.manifestHash], generatedAt: new Date().toISOString(), snapshotHash: manifest.manifestHash };
    const existing = await r.findOne({ where: { applicationVersionId: versionId, environment: environment ?? null as any, snapshotHash: manifest.manifestHash } });
    return existing ?? r.save(r.create({ applicationId: version.applicationId, applicationVersionId: versionId, environment, manifestVersion: '1.0.0', snapshotHash: manifest.manifestHash, manifest: payload, status: 'READY' }));
  }

  async getSnapshot(versionId: string, environment?: string) {
    const item = await this.repo<RuntimeSnapshot>(RuntimeSnapshot).findOne({ where: { applicationVersionId: versionId, ...(environment ? { environment } : {}) }, order: { generatedAt: 'DESC' } });
    if (!item) throw new NotFoundException('RUNTIME_SNAPSHOT_NOT_FOUND');
    return item;
  }

  async createIntegration(data: Partial<IntegrationDefinition>) {
    const code = String(data.code ?? '').trim().toLowerCase();
    if (!code || !data.name || !data.type || !data.adapterKey) throw new ConflictException('INTEGRATION_DEFINITION_INVALID');
    const r = this.repo<IntegrationDefinition>(IntegrationDefinition);
    if (await r.findOne({ where: { code } })) throw new ConflictException('INTEGRATION_CODE_EXISTS');
    return r.save(r.create({ ...data, code }));
  }

  async listIntegrations() {
    return this.repo<IntegrationDefinition>(IntegrationDefinition).find({ order: { code: 'ASC' } });
  }

  async listBindings(applicationVersionId: string) {
    return this.repo<IntegrationBinding>(IntegrationBinding).find({ where: { applicationVersionId }, order: { createdAt: 'DESC' } });
  }

  async bind(versionId: string, data: Partial<IntegrationBinding>) {
    const version = await this.editable(versionId);
    if (!data.integrationDefinitionId || !await this.repo<IntegrationDefinition>(IntegrationDefinition).findOne({ where: { id: data.integrationDefinitionId } })) {
      throw new NotFoundException('INTEGRATION_NOT_FOUND');
    }
    const r = this.repo<IntegrationBinding>(IntegrationBinding);
    const existing = await r.findOne({ where: { applicationVersionId: versionId, integrationDefinitionId: data.integrationDefinitionId, environment: data.environment ?? null as any } });
    if (existing) throw new ConflictException('INTEGRATION_BINDING_EXISTS');
    return r.save(r.create({ ...data, applicationId: version.applicationId, applicationVersionId: versionId, version: 1 }));
  }

  async updateBinding(id: string, data: Partial<IntegrationBinding> & { expectedVersion?: number }) {
    const item = await this.binding(id);
    await this.editable(item.applicationVersionId);
    if (data.expectedVersion !== undefined && data.expectedVersion !== item.version) throw new ConflictException('VERSION_CONFLICT');
    const { id: _id, applicationId: _a, applicationVersionId: _v, expectedVersion: _e, ...changes } = data;
    return this.repo<IntegrationBinding>(IntegrationBinding).save({ ...item, ...changes, version: item.version + 1 });
  }

  async validateBinding(id: string) {
    const item = await this.binding(id);
    const valid = !!item.targetId && !!item.integrationDefinitionId;
    return { valid, issues: valid ? [] : [{ severity: 'ERROR', code: 'INTEGRATION_BINDING_INVALID' }] };
  }

  async testBinding(id: string) {
    const check = await this.validateBinding(id);
    return { ...check, testedAt: new Date().toISOString(), adapterCalled: false };
  }

  async resolveContract(versionId: string, contractType: string) {
    const items = await this.contracts(versionId, contractType);
    if (!items.length) throw new NotFoundException('CONTRACT_NOT_FOUND');
    return items[0];
  }

  private normalize(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((item) => this.normalize(item));
    if (value && typeof value === 'object') {
      const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
      return Object.fromEntries(entries.map(([key, item]) => [key, this.normalize(item)]));
    }
    return value;
  }

  private hash(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }

  private async version(id: string) {
    const item = await this.repo<ApplicationVersion>(ApplicationVersion).findOne({ where: { id } });
    if (!item) throw new NotFoundException('VERSION_NOT_FOUND');
    return item;
  }

  private async editable(id: string) {
    const item = await this.version(id);
    if ([ApplicationVersionStatus.PUBLISHED, ApplicationVersionStatus.ARCHIVED, ApplicationVersionStatus.SUPERSEDED].includes(item.status)) {
      throw new ConflictException('VERSION_NOT_EDITABLE');
    }
    return item;
  }

  private async binding(id: string) {
    const item = await this.repo<IntegrationBinding>(IntegrationBinding).findOne({ where: { id } });
    if (!item) throw new NotFoundException('INTEGRATION_BINDING_NOT_FOUND');
    return item;
  }
}
