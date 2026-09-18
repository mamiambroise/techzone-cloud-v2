export class DolibarrError extends Error {
  code: string;
  httpStatus: number;
  details?: any;

  constructor(code: string, message: string, httpStatus = 500, details?: any) {
    super(message);
    this.name = 'DolibarrError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }

  static AUTH_ERROR(message = 'Cle API invalide'): DolibarrError {
    return new DolibarrError('AUTH_ERROR', message, 401);
  }

  static NOT_FOUND(resource = 'Ressource'): DolibarrError {
    return new DolibarrError('NOT_FOUND', `${resource} non trouvee`, 404);
  }

  static DUPLICATE(message = 'Doublon detecte'): DolibarrError {
    return new DolibarrError('DUPLICATE', message, 409);
  }

  static BAD_REQUEST(message = 'Requete invalide'): DolibarrError {
    return new DolibarrError('BAD_REQUEST', message, 400);
  }

  static TIMEOUT(message = 'Delai depasse'): DolibarrError {
    return new DolibarrError('TIMEOUT', message, 408);
  }

  static CONNECTION_ERROR(message = 'Impossible de se connecter a Dolibarr'): DolibarrError {
    return new DolibarrError('CONNECTION_ERROR', message, 503);
  }

  static ERP_ERROR(message = 'Erreur interne Dolibarr'): DolibarrError {
    return new DolibarrError('ERP_ERROR', message, 500);
  }

  static RATE_LIMIT(message = 'Trop de requetes'): DolibarrError {
    return new DolibarrError('RATE_LIMIT', message, 429);
  }

  /**
   * Traduit une erreur HTTP Dolibarr en DolibarrError
   */
  static fromHttpError(status: number, data?: any): DolibarrError {
    const msg = data?.error || data?.message || 'Erreur inconnue';
    switch (status) {
      case 401:
        return DolibarrError.AUTH_ERROR(msg);
      case 404:
        return DolibarrError.NOT_FOUND(msg);
      case 409:
        return DolibarrError.DUPLICATE(msg);
      case 408:
        return DolibarrError.TIMEOUT(msg);
      case 429:
        return DolibarrError.RATE_LIMIT(msg);
      default:
        return DolibarrError.ERP_ERROR(`[${status}] ${msg}`);
    }
  }
}
