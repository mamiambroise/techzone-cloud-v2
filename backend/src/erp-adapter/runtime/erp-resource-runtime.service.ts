import { Injectable } from '@nestjs/common';
import { hasPermission } from '../../iam/decorators/current-user.decorator';
import { ERP_READ, ERP_WRITE } from '../../iam/iam.constants';
import { TenantContext } from '../../erp-registry/erp-registry.service';
import { ErpError } from '../erp-error';
import { IErpAdapter } from '../interfaces/erp-adapter.interface';
import { ERP_ADAPTER_METHOD_BINDINGS, ErpOperation, getErpResourceDefinition } from '../catalog/erp-resource-catalog';
import { ErpResourceCatalogService } from '../catalog/erp-resource-catalog.service';

export interface ErpRuntimeAuthorization extends TenantContext {
  resourceKey: string;
  operation: ErpOperation;
  contractOperation?: string;
  mappingRequired?: boolean;
}

/**
 * Fail-closed execution boundary shared by REST routes and contract commands.
 * No adapter method is called until the effective tenant/provider policy has
 * produced AVAILABLE for the exact canonical operation.
 */
@Injectable()
export class ErpResourceRuntimeService {
  constructor(private readonly catalog: ErpResourceCatalogService) {}

  async assertAllowed(input: ErpRuntimeAuthorization) {
    const decision = await this.catalog.getOperationDecision(input);
    if (decision.allowed) return decision;
    throw new ErpError(decision.message, decision.statusCode, decision.code, {
      resourceKey: input.resourceKey,
      operation: input.operation,
      providerStatus: decision.providerStatus,
      requiredPermission: decision.requiredPermission,
    });
  }

  /** Wraps direct controller adapter calls so individual routes cannot bypass the gate. */
  guardAdapter(adapter: IErpAdapter, principal: TenantContext): IErpAdapter {
    return new Proxy(adapter, {
      get: (target, property, receiver) => {
        const value = Reflect.get(target, property, receiver);
        if (typeof property !== 'string' || typeof value !== 'function') return value;
        const binding = ERP_ADAPTER_METHOD_BINDINGS[property];
        if (!binding) return value.bind(target);
        return async (...args: unknown[]) => {
          await this.assertAllowed({ ...principal, ...binding });
          return value.apply(target, args);
        };
      },
    }) as IErpAdapter;
  }

  async assertContractAllowed(input: Omit<ErpRuntimeAuthorization, 'resourceKey' | 'operation'> & { contractOperation: string }) {
    const [resourceKey, action] = input.contractOperation.split('.', 2);
    const operation: ErpOperation = ['create', 'update', 'delete'].includes(action) ? action as ErpOperation : 'read';
    const definition = getErpResourceDefinition(resourceKey);
    if (!definition || !definition.contractOperations.includes(input.contractOperation)) {
      throw new ErpError('Contrat ERP indisponible pour cette ressource', 409, 'ERP_CONTRACT_UNAVAILABLE', { resourceKey, contract: input.contractOperation });
    }
    return this.assertAllowed({ ...input, resourceKey, operation, contractOperation: input.contractOperation });
  }

  static requiredPermission(operation: ErpOperation) {
    return operation === 'read' ? ERP_READ : ERP_WRITE;
  }

  static iamAllowed(input: TenantContext, operation: ErpOperation) {
    return hasPermission({ userId: input.actorId || '', sessionId: '', roles: [], permissions: input.permissions || [], isSuperAdmin: input.isSuperAdmin } as any, this.requiredPermission(operation));
  }
}
