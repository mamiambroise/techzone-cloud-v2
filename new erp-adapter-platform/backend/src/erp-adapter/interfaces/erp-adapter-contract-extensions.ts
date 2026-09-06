/**
 * Extensions au contrat ERP Adapter existant.
 * Ce fichier n'AJOUTE que ce qui manque par rapport à ERP-CDC-00 et ERP-CDC-05.
 * Il ne redéfinit rien de ce qui existe déjà dans erp-adapter.interface.ts
 * (ErpClient, ErpProduct, ErpOrder, StockInfo, IErpAdapter restent inchangés).
 */

// ─────────────────────────────────────────────────────────────
// Error Contract standardisé (CDC-00 / CDC-05)
// À utiliser dans tous les catch/throw des adaptateurs (Mock, Dolibarr...)
// Jamais de secret, de SQL, ou de stack trace dans "details".
// ─────────────────────────────────────────────────────────────
export type ErpErrorCode =
  | 'ERP_PROVIDER_UNAVAILABLE'
  | 'ERP_AUTHENTICATION_FAILED'
  | 'ERP_RESOURCE_NOT_FOUND'
  | 'ERP_CAPABILITY_UNAVAILABLE'
  | 'ERP_MAPPING_INVALID'
  | 'ERP_FIELD_MISSING'
  | 'ERP_TYPE_MISMATCH'
  | 'ERP_TIMEOUT'
  | 'ERP_RATE_LIMITED'
  | 'ERP_CONTRACT_VERSION_UNSUPPORTED';

export interface ErpErrorContract {
  code: ErpErrorCode;
  message: string;
  traceId: string;
  details?: Record<string, unknown>;
}

// Exception NestJS prête à être levée par les adaptateurs et attrapée
// par un ExceptionFilter global (backend/src/filters/).
export class ErpAdapterException extends Error {
  constructor(public readonly contract: ErpErrorContract) {
    super(contract.message);
  }
}

// ─────────────────────────────────────────────────────────────
// Health Check enrichi (CDC-05) — étend votre HealthCheckResult existant
// sans le remplacer. Utilisable en plus, pour un endpoint de diagnostic détaillé.
// ─────────────────────────────────────────────────────────────
export type HealthStepStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

export interface DetailedHealthCheck {
  status: HealthStepStatus;
  mode: string;
  timestamp: string;
  steps: {
    connectivity: HealthStepStatus;
    authentication: HealthStepStatus;
    contract: HealthStepStatus;
  };
}