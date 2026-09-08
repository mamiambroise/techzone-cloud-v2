import { Injectable } from '@nestjs/common';

@Injectable()
export class RuntimeDiagnosticService {
  list(resolutionId: string, tenantId?: string) {
    return [
      {
        id: `diag-${resolutionId}-1`,
        resolutionId,
        severity: 'ERROR',
        category: 'CAPABILITY',
        code: 'RUNTIME_CAPABILITY_MISSING',
        message: 'Required capability payment.execute is unavailable.',
        source: 'runtime.capability-dependency-resolver',
        targetRef: 'payment.checkout',
        provider: 'integration-runtime',
        traceId: `trace-${resolutionId}`,
        createdAt: new Date().toISOString(),
        safeDetails: { provider: 'integration-runtime', reasonCode: 'CAPABILITY_MISSING', fallbackUsed: false },
      },
    ].filter((item) => !tenantId || item.resolutionId.startsWith(tenantId));
  }

  exportSafe(resolutionId: string) {
    return { resolutionId, exportedAt: new Date().toISOString(), redacted: true, items: this.list(resolutionId) };
  }

  explain(code: string) {
    return {
      code,
      what: 'Capability or dependency was not available during runtime resolution.',
      why: 'Provider failed or an entitlement/capability contract was not satisfied.',
      where: 'Runtime resolution pipeline.',
      impact: 'Feature or module may be blocked or degraded.',
      fallback: 'Explicit degraded mode or blocked executable manifest.',
      nextSafeAction: 'Retry provider, verify entitlement or capability registration, invalidate impacted caches.',
    };
  }
}
