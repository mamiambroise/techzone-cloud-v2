import { Injectable, Logger } from '@nestjs/common';
import { ErpAdapterService } from '../erp-adapter.service';
import { IErpAdapter } from '../interfaces/erp-adapter.interface';
import { ErpError } from '../erp-error';
import { ErpRegistryService, TenantContext } from '../../erp-registry/erp-registry.service';
import { ExternalResourceLinkService } from '../../erp-registry/external-resource-link.service';
import { erpContractRegistry, ErpIntegrationContract } from '../contracts/erp-integration-contracts';
import { ExternalResourceLink } from '../../generated/prisma/client';

export interface ErpCommandRequest {
  operation: string;
  version?: number;
  payload: unknown;
}

export interface ErpCommandResult {
  success: boolean;
  contract: string;
  direction: string;
  connector: { id: string; code: string };
  result: unknown;
  outputValidation: { valid: boolean; errors: readonly unknown[] };
  link: { localId: string; externalId: string; externalRef: string | null } | null;
  idempotentReplay: boolean;
}

@Injectable()
export class ErpCommandService {
  private readonly logger = new Logger(ErpCommandService.name);

  constructor(
    private readonly adapterService: ErpAdapterService,
    private readonly erpRegistry: ErpRegistryService,
    private readonly linkService: ExternalResourceLinkService,
  ) {}

  async listContracts(connector: string | undefined): Promise<unknown> {
    const contracts = connector
      ? erpContractRegistry.listByConnector(connector)
      : erpContractRegistry.list();
    return contracts.map(c => ({
      operation: c.operation,
      version: c.version,
      key: c.key,
      connector: c.connector,
      direction: c.direction,
      resourceType: c.resourceType,
      requiredCapabilities: c.requiredCapabilities,
      inputFields: c.inputFields,
      outputFields: c.outputFields,
      idempotent: c.idempotent === true,
    }));
  }

  async execute(request: ErpCommandRequest, ctx: TenantContext): Promise<ErpCommandResult> {
    const tenantId = ctx?.tenantId;
    if (!tenantId) throw ErpError.tenantRequired();
    if (typeof request.operation !== 'string' || !request.operation.trim()) {
      throw new ErpError('operation est requise', 400, 'INTEGRATION_PAYLOAD_INVALID', { field: 'operation' });
    }

    const contract = erpContractRegistry.resolve(request.operation.trim(), request.version);
    if (!contract) {
      throw new ErpError(
        `Contrat d'integration inconnu: ${request.operation}${request.version ? '@' + request.version : ''}`,
        400,
        'INTEGRATION_CONTRACT_UNSUPPORTED',
        { operation: request.operation, version: request.version ?? null },
      );
    }

    const registry = await this.erpRegistry.getActiveForTenant({ tenantId, actorId: ctx?.actorId });
    const stored = (registry.capabilities || {}) as Record<string, unknown>;
    const capabilities = (stored.capabilities as Record<string, string>) || {};
    const missing = contract.requiredCapabilities.filter(c => capabilities[c] !== 'AVAILABLE');
    if (missing.length > 0) {
      throw new ErpError(
        `Capabilities ERP indisponibles pour cette operation: ${missing.join(', ')}`,
        502,
        'ERP_CAPABILITY_UNAVAILABLE',
        { contract: contract.key, missing, capabilities },
      );
    }

    const payload = (request.payload ?? {}) as Record<string, unknown>;
    const inputValidation = erpContractRegistry.validateInput(contract, payload);
    if (!inputValidation.valid) {
      throw new ErpError(
        'Payload invalide selon le contrat d integration',
        422,
        'INTEGRATION_PAYLOAD_INVALID',
        { contract: contract.key, errors: inputValidation.errors },
      );
    }

    if (contract.direction === 'COMMAND' && contract.idempotent) {
      const localRef = typeof payload.localRef === 'string' && payload.localRef.trim() ? payload.localRef.trim() : undefined;
      if (localRef) {
        const existing = await this.linkService.findByLocal(contract.resourceType, localRef, registry.id, ctx);
        if (existing) {
          this.logger.log(`Idempotent replay [tenant=${tenantId}] [contract=${contract.key}] [local=${localRef}] -> external ${existing.externalId}`);
          return {
            success: true,
            contract: contract.key,
            direction: contract.direction,
            connector: { id: registry.id, code: registry.code },
            result: { id: existing.externalId, ref: existing.externalRef },
            outputValidation: { valid: true, errors: [] },
            link: { localId: existing.localId, externalId: existing.externalId, externalRef: existing.externalRef },
            idempotentReplay: true,
          };
        }
      }
    }

    const adapter = await this.adapterService.resolveAdapterForTenant(tenantId, registry.id);
    const result = await this.invoke(adapter, contract, payload);

    const outputValidation = erpContractRegistry.validateOutput(contract, result);
    if (!outputValidation.valid) {
      throw new ErpError(
        'Reponse ERP non conforme au contrat d integration',
        502,
        'ERP_OPERATION_FAILED',
        { contract: contract.key, errors: outputValidation.errors },
      );
    }

    let link: ExternalResourceLink | null = null;
    if (contract.direction === 'COMMAND') {
      const normalized = result as Record<string, unknown>;
      const externalId = normalized.id != null ? String(normalized.id) : undefined;
      const localRef = typeof payload.localRef === 'string' && payload.localRef.trim() ? payload.localRef.trim() : externalId;
      if (externalId && localRef) {
        link = await this.linkService.record({
          connectorId: registry.id,
          resourceType: contract.resourceType,
          localId: localRef,
          externalId,
          externalRef: typeof normalized.ref === 'string' ? normalized.ref : (typeof normalized.nom === 'string' ? normalized.nom : null),
          metadata: { contract: contract.key, operation: contract.operation },
        }, ctx);
      }
    }

    this.logger.log(`ERP contract executed [tenant=${tenantId}] [contract=${contract.key}] [connector=${registry.code}]`);
    return {
      success: true,
      contract: contract.key,
      direction: contract.direction,
      connector: { id: registry.id, code: registry.code },
      result,
      outputValidation: { valid: outputValidation.valid, errors: [...outputValidation.errors] },
      link: link ? { localId: link.localId, externalId: link.externalId, externalRef: link.externalRef } : null,
      idempotentReplay: false,
    };
  }

  private async invoke(adapter: IErpAdapter, contract: ErpIntegrationContract, payload: Record<string, unknown>): Promise<unknown> {
    const limit = typeof payload.limit === 'number' ? Math.min(Math.max(payload.limit, 1), 100) : 20;
    switch (contract.key) {
      case 'customer.list@1':
        return adapter.getClients({ limit });
      case 'customer.get@1':
        return adapter.getClientById(String(payload.id));
      case 'customer.create@1':
        return adapter.createClient({
          nom: String(payload.nom),
          email: typeof payload.email === 'string' ? payload.email : '',
          telephone: typeof payload.phone === 'string' ? payload.phone : undefined,
        });
      case 'customer.update@1':
        return adapter.updateClient(String(payload.id), {
          ...(typeof payload.nom === 'string' ? { nom: payload.nom } : {}),
          ...(typeof payload.email === 'string' ? { email: payload.email } : {}),
          ...(typeof payload.phone === 'string' ? { telephone: payload.phone } : {}),
        });
      case 'product.list@1':
        return adapter.getProducts({ limit });
      case 'product.get@1':
        return adapter.getProductById(String(payload.id));
      case 'product.create@1':
        return adapter.createProduct({
          ref: String(payload.ref),
          label: String(payload.label),
          price: Number(payload.price ?? 0),
          stock: 0,
        });
      case 'product.update@1':
        return adapter.updateProduct(String(payload.id), {
          ...(typeof payload.ref === 'string' ? { ref: payload.ref } : {}),
          ...(typeof payload.label === 'string' ? { label: payload.label } : {}),
          ...(typeof payload.price === 'number' ? { price: payload.price } : {}),
        });
      case 'order.list@1':
        return adapter.getOrders({ limit });
      case 'order.get@1':
        return adapter.getOrderById(String(payload.id));
      case 'order.create@1': {
        let lines: unknown;
        try {
          lines = JSON.parse(String(payload.lines));
        } catch {
          throw new ErpError('lines doit etre un JSON encode valide', 422, 'INTEGRATION_PAYLOAD_INVALID', { field: 'lines' });
        }
        return adapter.createOrder({ clientId: String(payload.clientId), lines: lines as any });
      }
      case 'agenda.read@1':
        return adapter.getAgenda();
      default:
        throw new ErpError(`Aucun adaptateur ne peut executer le contrat ${contract.key}`, 400, 'INTEGRATION_CONTRACT_UNSUPPORTED', { contract: contract.key });
    }
  }
}
