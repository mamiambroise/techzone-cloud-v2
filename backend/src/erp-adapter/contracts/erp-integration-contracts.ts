// ERP Integration Contracts — stable, versioned, capability-aware.
// CDC §7 / §10 : le code consommateur dépend d'un contrat stable,
// jamais des détails internes de Dolibarr. Aucune logique Dolibarr ici.

export type ErpContractDirection = 'QUERY' | 'COMMAND';

export type ErpContractFieldType = 'string' | 'number' | 'boolean' | 'date' | 'money';

export interface ErpContractField {
  readonly name: string;
  readonly type: ErpContractFieldType;
  readonly required?: boolean;
  readonly maxLength?: number;
  readonly min?: number;
  readonly max?: number;
}

export interface ErpIntegrationContract {
  /** Operation stable, e.g. 'customer.create'. */
  readonly operation: string;
  /** Version sémantique du contrat. */
  readonly version: number;
  /** Clé complète 'customer.create@1'. */
  readonly key: string;
  /** Connecteur cible, e.g. 'dolibarr'. */
  readonly connector: string;
  readonly direction: ErpContractDirection;
  /** Type de ressource Techzone, e.g. 'customer'. */
  readonly resourceType: string;
  /** Capabilities Dolibarr requises pour exécuter ce contrat. */
  readonly requiredCapabilities: readonly string[];
  readonly inputFields: readonly ErpContractField[];
  readonly outputFields: readonly ErpContractField[];
  /** Les commandes sensibles rejouables doivent être idempotentes (RG-INT-012). */
  readonly idempotent?: boolean;
}

export interface ContractValidationError {
  readonly field: string;
  readonly rule: string;
}

export interface ContractValidationResult {
  readonly valid: boolean;
  readonly errors: readonly ContractValidationError[];
}

function contract(
  operation: string,
  version: number,
  connector: string,
  direction: ErpContractDirection,
  resourceType: string,
  requiredCapabilities: readonly string[],
  inputFields: readonly ErpContractField[],
  outputFields: readonly ErpContractField[],
  idempotent = false,
): ErpIntegrationContract {
  return {
    operation,
    version,
    key: `${operation}@${version}`,
    connector,
    direction,
    resourceType,
    requiredCapabilities,
    inputFields,
    outputFields,
    idempotent,
  };
}

// Champs de sortie normalisés Techzone (indépendants de Dolibarr).
const CUSTOMER_OUTPUT: readonly ErpContractField[] = [
  { name: 'id', type: 'string', required: true },
  { name: 'nom', type: 'string', required: true, maxLength: 255 },
  { name: 'email', type: 'string' },
  { name: 'phone', type: 'string' },
  { name: 'externalId', type: 'string' },
];
const PRODUCT_OUTPUT: readonly ErpContractField[] = [
  { name: 'id', type: 'string', required: true },
  { name: 'ref', type: 'string', required: true, maxLength: 255 },
  { name: 'label', type: 'string', required: true, maxLength: 255 },
  { name: 'price', type: 'money' },
  { name: 'externalId', type: 'string' },
];
const ORDER_OUTPUT: readonly ErpContractField[] = [
  { name: 'id', type: 'string', required: true },
  { name: 'ref', type: 'string', required: true, maxLength: 255 },
  { name: 'clientId', type: 'string', required: true },
  { name: 'status', type: 'string' },
  { name: 'total', type: 'money' },
  { name: 'externalId', type: 'string' },
];

/**
 * Contrats ERP v1 consommables par Business Manager, UI Builder,
 * Automation et Data Runtime. Chaque contrat est lié aux capabilities
 * Dolibarr réellement requises — une capability indisponible bloque
 * l'exécution (CONNECTOR_CAPABILITY_MISSING).
 */
export const ERP_CONTRACTS: readonly ErpIntegrationContract[] = [
  // --- Customers (ThirdParty) ---
  contract('customer.read', 1, 'dolibarr', 'QUERY', 'customer', ['customer.read'], [], CUSTOMER_OUTPUT),
  contract('customer.list', 1, 'dolibarr', 'QUERY', 'customer', ['customer.read'], [], CUSTOMER_OUTPUT),
  contract('customer.get', 1, 'dolibarr', 'QUERY', 'customer', ['customer.read'], [
    { name: 'id', type: 'string', required: true },
  ], CUSTOMER_OUTPUT),
  contract('customer.create', 1, 'dolibarr', 'COMMAND', 'customer', ['customer.create'], [
    { name: 'nom', type: 'string', required: true, maxLength: 255 },
    { name: 'email', type: 'string', maxLength: 255 },
    { name: 'phone', type: 'string', maxLength: 64 },
    { name: 'address', type: 'string', maxLength: 500 },
    { name: 'town', type: 'string', maxLength: 255 },
  ], CUSTOMER_OUTPUT, true),
  contract('customer.update', 1, 'dolibarr', 'COMMAND', 'customer', ['customer.update'], [
    { name: 'id', type: 'string', required: true },
    { name: 'nom', type: 'string', maxLength: 255 },
    { name: 'email', type: 'string', maxLength: 255 },
    { name: 'phone', type: 'string', maxLength: 64 },
  ], CUSTOMER_OUTPUT),

  // --- Products ---
  contract('product.read', 1, 'dolibarr', 'QUERY', 'product', ['product.read'], [], PRODUCT_OUTPUT),
  contract('product.list', 1, 'dolibarr', 'QUERY', 'product', ['product.read'], [], PRODUCT_OUTPUT),
  contract('product.get', 1, 'dolibarr', 'QUERY', 'product', ['product.read'], [
    { name: 'id', type: 'string', required: true },
  ], PRODUCT_OUTPUT),
  contract('product.create', 1, 'dolibarr', 'COMMAND', 'product', ['product.create'], [
    { name: 'ref', type: 'string', required: true, maxLength: 255 },
    { name: 'label', type: 'string', required: true, maxLength: 255 },
    { name: 'price', type: 'money', min: 0 },
    { name: 'description', type: 'string', maxLength: 1000 },
  ], PRODUCT_OUTPUT, true),
  contract('product.update', 1, 'dolibarr', 'COMMAND', 'product', ['product.update'], [
    { name: 'id', type: 'string', required: true },
    { name: 'ref', type: 'string', maxLength: 255 },
    { name: 'label', type: 'string', maxLength: 255 },
    { name: 'price', type: 'money', min: 0 },
  ], PRODUCT_OUTPUT),

  // --- Orders ---
  contract('order.read', 1, 'dolibarr', 'QUERY', 'order', ['order.read'], [], ORDER_OUTPUT),
  contract('order.list', 1, 'dolibarr', 'QUERY', 'order', ['order.read'], [], ORDER_OUTPUT),
  contract('order.get', 1, 'dolibarr', 'QUERY', 'order', ['order.read'], [
    { name: 'id', type: 'string', required: true },
  ], ORDER_OUTPUT),
  contract('order.create', 1, 'dolibarr', 'COMMAND', 'order', ['order.create'], [
    { name: 'clientId', type: 'string', required: true },
    { name: 'lines', type: 'string', required: true }, // JSON encodé : [{productId, quantity, price}]
  ], ORDER_OUTPUT, true),

  // --- Agenda (disponible sur l'instance de recette) ---
  contract('agenda.read', 1, 'dolibarr', 'QUERY', 'agenda', ['agenda.read'], [], [
    { name: 'id', type: 'string', required: true },
    { name: 'title', type: 'string' },
    { name: 'startAt', type: 'date' },
    { name: 'endAt', type: 'date' },
  ]),
];

/**
 * Registry des contrats ERP : résolution par clé versionnée,
 * validation d'entrée/sortie contrôlée (aucun JS arbitraire, RG-INT-012).
 */
export class ErpContractRegistry {
  private readonly byKey = new Map<string, ErpIntegrationContract>();
  private readonly byOperation = new Map<string, ErpIntegrationContract[]>();

  constructor(contracts: readonly ErpIntegrationContract[] = ERP_CONTRACTS) {
    for (const c of contracts) {
      if (this.byKey.has(c.key)) {
        throw new Error(`Duplicate ERP contract key: ${c.key}`);
      }
      this.byKey.set(c.key, c);
      const list = this.byOperation.get(c.operation) ?? [];
      list.push(c);
      this.byOperation.set(c.operation, list);
    }
  }

  getByKey(key: string): ErpIntegrationContract | undefined {
    return this.byKey.get(key);
  }

  /** Résout la version exacte, ou la plus récente si version omise. */
  resolve(operation: string, version?: number): ErpIntegrationContract | undefined {
    if (version != null) return this.byKey.get(`${operation}@${version}`);
    const list = this.byOperation.get(operation);
    if (!list || list.length === 0) return undefined;
    return list.reduce((latest, c) => (c.version > latest.version ? c : latest));
  }

  list(): readonly ErpIntegrationContract[] {
    return [...this.byKey.values()];
  }

  listByConnector(connector: string): readonly ErpIntegrationContract[] {
    return this.list().filter(c => c.connector === connector);
  }

  /** Valide un payload d'entrée contre les champs déclarés du contrat. */
  validateInput(c: ErpIntegrationContract, payload: unknown): ContractValidationResult {
    const errors: ContractValidationError[] = [];
    if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
      return { valid: false, errors: [{ field: '$', rule: 'payload must be an object' }] };
    }
    const input = payload as Record<string, unknown>;
    for (const field of c.inputFields) {
      const value = input[field.name];
      if (value === undefined || value === null || value === '') {
        if (field.required) errors.push({ field: field.name, rule: 'required' });
        continue;
      }
      const typeError = this.checkType(field, value);
      if (typeError) errors.push({ field: field.name, rule: typeError });
    }
    return { valid: errors.length === 0, errors };
  }

  /** Valide une réponse normalisée contre les champs de sortie requis. */
  validateOutput(c: ErpIntegrationContract, payload: unknown): ContractValidationResult {
    if (Array.isArray(payload)) {
      const errors: ContractValidationError[] = [];
      payload.forEach((item, index) => {
        for (const e of this.validateOutput(c, item).errors) {
          errors.push({ field: `[${index}].${e.field}`, rule: e.rule });
        }
      });
      return { valid: errors.length === 0, errors };
    }
    const errors: ContractValidationError[] = [];
    if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) {
      return { valid: false, errors: [{ field: '$', rule: 'response must be an object' }] };
    }
    const output = payload as Record<string, unknown>;
    for (const field of c.outputFields) {
      if (!field.required) continue;
      const value = output[field.name];
      if (value === undefined || value === null) {
        errors.push({ field: field.name, rule: 'required' });
        continue;
      }
      const typeError = this.checkType(field, value);
      if (typeError) errors.push({ field: field.name, rule: typeError });
    }
    return { valid: errors.length === 0, errors };
  }

  private checkType(field: ErpContractField, value: unknown): string | null {
    switch (field.type) {
      case 'string':
        if (typeof value !== 'string') return 'must be a string';
        if (field.maxLength != null && value.length > field.maxLength) return `maxLength ${field.maxLength}`;
        return null;
      case 'number':
      case 'money':
        if (typeof value !== 'number' || Number.isNaN(value)) return 'must be a number';
        if (field.min != null && value < field.min) return `min ${field.min}`;
        if (field.max != null && value > field.max) return `max ${field.max}`;
        return null;
      case 'boolean':
        if (typeof value !== 'boolean') return 'must be a boolean';
        return null;
      case 'date':
        if (typeof value !== 'string' || Number.isNaN(Date.parse(value))) return 'must be an ISO date';
        return null;
      default:
        return null;
    }
  }
}

/** Registry singleton partagé par le Hub, l'adapter et le Runtime. */
export const erpContractRegistry = new ErpContractRegistry();
