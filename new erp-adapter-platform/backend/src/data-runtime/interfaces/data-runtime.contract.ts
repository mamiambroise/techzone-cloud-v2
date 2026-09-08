// DATA-CDC-00 : Data Runtime Contract v1
// Socle, Architecture & Data Runtime Contract

export const DATA_RUNTIME_CONTRACT_VERSION = '1.0';

// === CANONICAL RESOURCE TYPES ===
export type CanonicalFieldType =
  | 'STRING'
  | 'TEXT'
  | 'INTEGER'
  | 'DECIMAL'
  | 'BOOLEAN'
  | 'DATE'
  | 'DATETIME'
  | 'ENUM'
  | 'REFERENCE'
  | 'OBJECT'
  | 'ARRAY';

export type RelationType = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

export type OperationType = 'READ' | 'LIST' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXECUTE' | 'SEARCH';

export type CapabilityAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'DEGRADED' | 'UNKNOWN';

export type ExecutionStatus = 'SUCCESS' | 'FAILED' | 'DENIED' | 'TIMEOUT' | 'CANCELLED' | 'DEGRADED';

export type BindingState = 'IDLE' | 'LOADING' | 'SUCCESS' | 'EMPTY' | 'ERROR' | 'REFRESHING';

export type HealthState = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

// === RUNTIME CONTEXT ===
export interface RuntimeContext {
  tenantId: string;
  userId: string;
  applicationId?: string;
  environmentId?: string;
  requestId: string;
  traceId: string;
  permissions: string[];
  locale?: string;
}

// === CANONICAL FIELD ===
export interface CanonicalField {
  code: string;
  displayName: string;
  type: CanonicalFieldType;
  required: boolean;
  nullable: boolean;
  defaultValue?: any;
  enumValues?: string[];
  maxLength?: number;
  format?: string;
}

// === CANONICAL RELATION ===
export interface CanonicalRelation {
  code: string;
  displayName: string;
  targetResource: string;
  type: RelationType;
  foreignKey?: string;
}

// === RESOURCE DESCRIPTOR ===
export interface ResourceDescriptor {
  resourceCode: string;
  displayName: string;
  fields: CanonicalField[];
  relations: CanonicalRelation[];
  operations: OperationType[];
  provider: string;
  instance: string;
}

// === CAPABILITY ===
export interface Capability {
  code: string;
  provider: string;
  resource: string;
  operation: OperationType;
  availability: CapabilityAvailability;
  contractVersion: string;
  constraints?: CapabilityConstraints;
  metadata?: Record<string, any>;
}

export interface CapabilityConstraints {
  pagination?: boolean;
  sorting?: boolean;
  filtering?: boolean;
  maxPageSize?: number;
  batch?: boolean;
  transactions?: boolean;
  readOnly?: boolean;
  rateLimit?: number;
}

// === DATA RUNTIME CONTRACT ===
export interface DataRuntimeContract {
  contract: string;
  contractVersion: string;
  provider: string;
  instance: string;
  resources: ResourceDescriptor[];
  capabilities: Capability[];
  health: { status: HealthState };
}

// === ERROR CONTRACT ===
export type DataErrorCode =
  | 'DATA_RESOURCE_NOT_FOUND'
  | 'DATA_FIELD_NOT_FOUND'
  | 'DATA_QUERY_INVALID'
  | 'DATA_OPERATION_NOT_ALLOWED'
  | 'DATA_CAPABILITY_UNAVAILABLE'
  | 'DATA_VALIDATION_FAILED'
  | 'DATA_PERMISSION_DENIED'
  | 'DATA_TENANT_VIOLATION'
  | 'DATA_PROVIDER_UNAVAILABLE'
  | 'DATA_TIMEOUT'
  | 'DATA_CONTRACT_VERSION_UNSUPPORTED';

export interface DataError {
  code: DataErrorCode;
  message: string;
  traceId: string;
  details?: Record<string, any>;
}

// === HEALTH CHECK ===
export interface DataHealthCheck {
  provider: string;
  connectivity: boolean;
  authentication: boolean;
  contract: boolean;
  capabilities: boolean;
  mappings: boolean;
  status: HealthState;
  timestamp: string;
}
