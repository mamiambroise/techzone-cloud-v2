import { describe, expect, it, jest } from '@jest/globals';
import { HttpException } from '@nestjs/common';

import { AllExceptionsFilter } from './all-exceptions.filter';
import { DolibarrError } from '../../erp-adapter/dolibarr/dolibarr.error';
import { ErpError } from '../../erp-adapter/erp-error';

function hostFor(exception: unknown, traceId = 'trace-uuid-1') {
  const res = {
    status: jest.fn<any>().mockReturnThis(),
    json: jest.fn<any>(),
  };
  const req = { traceId };
  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => req,
    }),
  } as any;
  new AllExceptionsFilter().catch(exception, host);
  const status = res.status.mock.calls[0][0] as number;
  const body = res.json.mock.calls[0][0] as Record<string, unknown>;
  return { status, body };
}

describe('AllExceptionsFilter — contrat ERP structuré (mission 4 × 500)', () => {
  it('maps DolibarrError CONNECTION_ERROR → 503 ERP_UNAVAILABLE (injoignable)', () => {
    const { status, body } = hostFor(DolibarrError.CONNECTION_ERROR('Impossible de se connecter a Dolibarr'));
    expect(status).toBe(503);
    expect(body.code).toBe('ERP_UNAVAILABLE');
    expect(body.traceId).toBe('trace-uuid-1');
    expect(body.connector).toBe('DOLIBARR');
    expect(body.success).toBe(false);
  });

  it('maps DolibarrError TIMEOUT → 503 ERP_UNAVAILABLE (timeout)', () => {
    const { status, body } = hostFor(DolibarrError.TIMEOUT('Delai depasse'));
    expect(status).toBe(503);
    expect(body.code).toBe('ERP_UNAVAILABLE');
    expect(body.connector).toBe('DOLIBARR');
  });

  it('maps DolibarrError AUTH_ERROR → 401 UNAUTHENTICATED (auth)', () => {
    const { status, body } = hostFor(DolibarrError.AUTH_ERROR('Cle API invalide'));
    expect(status).toBe(401);
    expect(body.code).toBe('UNAUTHENTICATED');
    expect(body.connector).toBe('DOLIBARR');
  });

  it('maps DolibarrError NOT_FOUND → 404 NOT_FOUND', () => {
    const { status, body } = hostFor(DolibarrError.NOT_FOUND('Client'));
    expect(status).toBe(404);
    expect(body.code).toBe('NOT_FOUND');
  });

  it('maps DolibarrError FORBIDDEN → 403 (non-500)', () => {
    const { status, body } = hostFor(DolibarrError.FORBIDDEN());
    expect(status).toBe(403);
    expect(body.code).toBe('FORBIDDEN');
  });

  it('keeps ErpError ERP_INSTANCE_NOT_CONFIGURED → 503 (non configuré)', () => {
    const { status, body } = hostFor(ErpError.notConfigured('ERP non configure pour ce tenant'));
    expect(status).toBe(503);
    expect(body.code).toBe('ERP_INSTANCE_NOT_CONFIGURED');
    expect(body.traceId).toBe('trace-uuid-1');
  });

  it('keeps ErpError.unavailable → 503 ERP_UNAVAILABLE', () => {
    const { status, body } = hostFor(ErpError.unavailable('ERP actuellement indisponible'));
    expect(status).toBe(503);
    expect(body.code).toBe('ERP_UNAVAILABLE');
  });

  it('maps axios connectivity errors → 503 ERP_UNAVAILABLE', () => {
    const axiosErr = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:80'), {
      isAxiosError: true,
      code: 'ECONNREFUSED',
    });
    const { status, body } = hostFor(axiosErr);
    expect(status).toBe(503);
    expect(body.code).toBe('ERP_UNAVAILABLE');
  });

  it('maps axios timeout → 503 ERP_UNAVAILABLE', () => {
    const axiosErr = Object.assign(new Error('timeout of 15000ms exceeded'), {
      isAxiosError: true,
      code: 'ECONNABORTED',
    });
    const { status, body } = hostFor(axiosErr);
    expect(status).toBe(503);
    expect(body.code).toBe('ERP_UNAVAILABLE');
  });

  it('keeps genuinely internal errors at 500 with traceId', () => {
    const { status, body } = hostFor(new Error('boom interne'));
    expect(status).toBe(500);
    expect(body.message).toBe('Erreur interne du serveur');
    expect(body.traceId).toBe('trace-uuid-1');
  });

  it('extracts nested error.code from HttpException envelopes (PmException-like)', () => {
    const ex = new HttpException(
      { success: false, error: { code: 'PACK_NOT_FOUND', message: 'Pack introuvable.' }, statusCode: 404 },
      404,
    );
    const { status, body } = hostFor(ex);
    expect(status).toBe(404);
    expect(body.code).toBe('PACK_NOT_FOUND');
    expect(body.traceId).toBe('trace-uuid-1');
  });
});
