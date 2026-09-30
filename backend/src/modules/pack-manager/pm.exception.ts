/**
 * Erreurs métier Pack Manager — réponse contractuelle PM-CDC-00.
 * Enveloppe identique au reste de la plateforme (success/error/statusCode).
 */
import { HttpException, HttpStatus } from '@nestjs/common';

import { PmErrorCodeValue } from './pm.constants';

export interface PmExceptionDetails {
  field?: string;
  value?: unknown;
  resource?: string;
  id?: string;
  expected?: string;
  [key: string]: unknown;
}

export class PmException extends HttpException {
  readonly code: PmErrorCodeValue;

  constructor(
    code: PmErrorCodeValue,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: PmExceptionDetails,
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

export const pmError = {
  packNotFound: (id?: string) =>
    new PmException('PACK_NOT_FOUND', 'Pack introuvable.', HttpStatus.NOT_FOUND, { id }),
  packCodeExists: (code: string) =>
    new PmException('PACK_CODE_ALREADY_EXISTS', 'Un pack utilise déjà ce code.', HttpStatus.CONFLICT, { code }),
  versionNotFound: (id?: string) =>
    new PmException('PACK_VERSION_NOT_FOUND', 'Version de pack introuvable.', HttpStatus.NOT_FOUND, { id }),
  versionImmutable: (id: string) =>
    new PmException(
      'PACK_VERSION_IMMUTABLE',
      'Version publiée immuable : clonez-la pour évoluer.',
      HttpStatus.CONFLICT,
      { id },
    ),
  versionConflict: (id: string) =>
    new PmException('PACK_VERSION_CONFLICT', 'Conflit de concurrence : la version a été modifiée.', HttpStatus.CONFLICT, { id }),
  versionNumberTaken: (version: string) =>
    new PmException('PACK_VERSION_CONFLICT', 'Ce numéro de version existe déjà pour ce pack.', HttpStatus.CONFLICT, { version }),
  validationOutdated: () =>
    new PmException('PACK_VALIDATION_OUTDATED', 'Validation obsolète : relancez la validation.', HttpStatus.CONFLICT),
  publicationDenied: (reason: string) =>
    new PmException('PACK_PUBLICATION_DENIED', 'Publication refusée.', HttpStatus.CONFLICT, { reason }),
  manifestInvalid: (reason: string) =>
    new PmException('PACK_MANIFEST_INVALID', 'Manifest invalide.', HttpStatus.UNPROCESSABLE_ENTITY, { reason }),
  manifestNotGenerated: () =>
    new PmException('PACK_MANIFEST_NOT_GENERATED', 'Manifest non généré.', HttpStatus.CONFLICT),
  dependencyMissing: (code: string) =>
    new PmException('PACK_DEPENDENCY_MISSING', 'Dépendance requise introuvable.', HttpStatus.CONFLICT, { code }),
} as const;
