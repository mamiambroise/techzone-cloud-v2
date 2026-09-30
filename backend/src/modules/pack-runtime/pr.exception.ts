/**
 * Error Contract Runtime (PR-CDC-00 §23) :
 * { success:false, error:{ code, message, details }, statusCode }.
 */
import { HttpException, HttpStatus } from '@nestjs/common';

import { PrErrorCodeValue } from './pr.constants';

export class PrException extends HttpException {
  readonly code: PrErrorCodeValue;

  constructor(
    code: PrErrorCodeValue,
    message: string,
    status: HttpStatus = HttpStatus.CONFLICT,
    details?: Record<string, unknown>,
  ) {
    const response = {
      success: false,
      error: { code, message, ...(details ? { details } : {}) },
      statusCode: status,
    };
    super(response, status);
    this.code = code;
  }
}

export const prError = {
  manifestNotFound: (packCode?: string, version?: string) =>
    new PrException('RUNTIME_MANIFEST_NOT_FOUND', 'Aucun manifest publié pour ce pack/version.', HttpStatus.NOT_FOUND, { packCode, version }),
  manifestInvalid: (reason: string) =>
    new PrException('RUNTIME_MANIFEST_INVALID', 'Manifest invalide.', HttpStatus.UNPROCESSABLE_ENTITY, { reason }),
  hashInvalid: () =>
    new PrException('RUNTIME_MANIFEST_HASH_INVALID', 'Empreinte du manifest invalide.', HttpStatus.UNPROCESSABLE_ENTITY),
  contractUnsupported: (version: string) =>
    new PrException('RUNTIME_CONTRACT_UNSUPPORTED', `Version de contrat non supportée : ${version}.`, HttpStatus.UNPROCESSABLE_ENTITY, { version }),
  contextInvalid: (reason: string) =>
    new PrException('RUNTIME_CONTEXT_INVALID', 'Contexte de résolution invalide.', HttpStatus.BAD_REQUEST, { reason }),
  tenantMismatch: () =>
    new PrException('RUNTIME_TENANT_MISMATCH', 'Le manifest demandé appartient à un autre tenant.', HttpStatus.FORBIDDEN),
  capabilityMissing: (code: string) =>
    new PrException('RUNTIME_CAPABILITY_MISSING', `Capability requise indisponible : ${code}.`, HttpStatus.CONFLICT, { code }),
  dependencyMissing: (code: string) =>
    new PrException('RUNTIME_DEPENDENCY_MISSING', `Dépendance requise non résolue : ${code}.`, HttpStatus.CONFLICT, { code }),
  resolutionBlocked: (reasons: string[]) =>
    new PrException('RUNTIME_RESOLUTION_BLOCKED', 'Résolution bloquée.', HttpStatus.CONFLICT, { reasons }),
} as const;
