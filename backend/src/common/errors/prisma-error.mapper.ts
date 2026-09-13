import { HttpStatus } from '@nestjs/common';

import { ErrorCode } from './error-codes';

export interface MappedPrismaError {
  code: ErrorCode;
  message: string;
  statusCode: HttpStatus;
  details?: Record<string, unknown>;
}

interface PrismaErrorLike {
  code?: unknown;
  message?: unknown;
  meta?: unknown;
  cause?: unknown;
}

/**
 * Transforme les erreurs Prisma / PostgreSQL
 * en erreurs appartenant au contrat de notre API.
 *
 * Important :
 * Le frontend ne doit jamais dépendre des codes Prisma.
 */
export function mapPrismaError(exception: unknown): MappedPrismaError | null {
  console.error('========== DATABASE ERROR ==========');
  console.error(
    'name:',
    exception instanceof Error ? exception.name : undefined,
  );
  console.error('code:', isObject(exception) ? exception.code : undefined);
  console.error(
    'message:',
    exception instanceof Error ? exception.message : undefined,
  );
  console.error('meta:', isObject(exception) ? exception.meta : undefined);
  console.error('cause:', isObject(exception) ? exception.cause : undefined);
  console.error('full error:', exception);
  console.error('====================================');

  if (!isObject(exception)) {
    return null;
  }

  const error = exception as PrismaErrorLike;

  /*
   * PostgreSQL
   *
   * 22P02 = invalid_text_representation
   *
   * Exemple :
   * GET /api/applications/not-a-uuid
   */
  if (error.code === '22P02') {
    return {
      code: ErrorCode.INVALID_UUID,
      message: "L'identifiant fourni n'est pas un UUID valide.",
      statusCode: HttpStatus.BAD_REQUEST,
    };
  }

  /*
   * PostgreSQL peut parfois être encapsulé
   * dans une autre erreur.
   */
  if (isObject(error.cause)) {
    const cause = error.cause as PrismaErrorLike;

    if (cause.code === '22P02') {
      return {
        code: ErrorCode.INVALID_UUID,
        message: "L'identifiant fourni n'est pas un UUID valide.",
        statusCode: HttpStatus.BAD_REQUEST,
      };
    }
  }

  /*
   * Erreurs Prisma connues
   */
  if (typeof error.code === 'string') {
    switch (error.code) {
      /*
       * P2002
       * Unique constraint violation
       */
      case 'P2002': {
        const fields = extractTargetFields(error.meta);

        return {
          code: ErrorCode.DUPLICATE_RESOURCE,
          message: 'Une ressource avec cette valeur existe déjà.',
          statusCode: HttpStatus.CONFLICT,
          ...(fields.length > 0 && {
            details: {
              fields,
            },
          }),
        };
      }

      /*
       * P2025
       * Record not found
       */
      case 'P2025':
        return {
          code: ErrorCode.RESOURCE_NOT_FOUND,
          message: 'La ressource demandée est introuvable.',
          statusCode: HttpStatus.NOT_FOUND,
        };

      /*
       * P2023
       * Inconsistent column data
       *
       * Peut notamment apparaître lors
       * d'un problème de conversion/type.
       */
      case 'P2023':
        return {
          code: ErrorCode.INVALID_INPUT,
          message: 'Les données fournies sont invalides.',
          statusCode: HttpStatus.BAD_REQUEST,
        };

      /*
       * P2003
       * Foreign key constraint failed
       */
      case 'P2003':
        return {
          code: ErrorCode.INVALID_INPUT,
          message: 'La ressource référencée est invalide ou inexistante.',
          statusCode: HttpStatus.BAD_REQUEST,
        };

      /*
       * P2014
       * Required relation violation
       */
      case 'P2014':
        return {
          code: ErrorCode.INVALID_INPUT,
          message: 'Cette opération viole une contrainte de relation.',
          statusCode: HttpStatus.BAD_REQUEST,
        };

      /*
       * P2000
       * Value too long
       */
      case 'P2000':
        return {
          code: ErrorCode.INVALID_INPUT,
          message: 'Une des valeurs fournies dépasse la longueur autorisée.',
          statusCode: HttpStatus.BAD_REQUEST,
        };

      /*
       * P2011
       * Null constraint violation
       */
      case 'P2011':
        return {
          code: ErrorCode.INVALID_INPUT,
          message: 'Une valeur obligatoire est manquante.',
          statusCode: HttpStatus.BAD_REQUEST,
        };

      /*
       * Autre erreur Prisma Pxxxx
       *
       * On ne révèle surtout pas le message interne.
       */
      default:
        if (error.code.startsWith('P')) {
          return {
            code: ErrorCode.INTERNAL_ERROR,
            message:
              'Une erreur interne est survenue lors du traitement des données.',
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          };
        }
    }
  }

  /*
   * PrismaClientValidationError
   *
   * On le détecte sans importer une classe interne Prisma.
   */
  if (exception.constructor?.name === 'PrismaClientValidationError') {
    return {
      code: ErrorCode.INVALID_INPUT,
      message: 'Les données fournies sont invalides.',
      statusCode: HttpStatus.BAD_REQUEST,
    };
  }

  return null;
}

/**
 * Vérifie qu'une valeur est un objet.
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Extrait les champs concernés par P2002.
 */
function extractTargetFields(meta: unknown): string[] {
  if (!isObject(meta)) {
    return [];
  }

  const target = meta.target;

  if (Array.isArray(target)) {
    return target.filter((field): field is string => typeof field === 'string');
  }

  if (typeof target === 'string') {
    return [target];
  }

  return [];
}
