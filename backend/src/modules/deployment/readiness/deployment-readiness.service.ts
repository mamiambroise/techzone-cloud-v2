import { Inject, Injectable } from '@nestjs/common';
import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';

export type DeploymentReadinessSource = 'REAL' | 'SYNTHETIC' | 'UNKNOWN';

export type DeploymentReadinessDependency = {
  name: string;
  critical: boolean;
  status: string;
};

export type DeploymentReadinessProof = {
  kind?: string;
  source?: string;
  deploymentId?: string;
  releaseId?: string;
  environmentId?: string;
  tenantId?: string;
  traceId?: string;
  activationId?: string;
  appliedAt?: string;
  observedAt?: string;
  synthetic?: boolean;
};

export type DeploymentReadinessInput = {
  deploymentId: string;
  releaseId: string;
  environmentId: string;
  tenantId: string;
  traceId: string;
  /** Timestamp of the deployment attempt, used to reject a prior proof. */
  startedAt: string;
  environment: {
    code: string;
    type: string;
    baseUrl?: string | null;
  };
};

export type DeploymentReadinessEvidence = {
  ready: boolean;
  source: DeploymentReadinessSource;
  code?: DeploymentErrorCode;
  message: string;
  observedAt: string;
  endpoint?: string;
  latencyMs?: number;
  statusCode?: number;
  runtimeStatus?: string;
  proof?: DeploymentReadinessProof;
  dependencies?: DeploymentReadinessDependency[];
  retryable?: boolean;
};

/**
 * Boundary for the actual runtime probe. Production binds the HTTP
 * implementation below. Tests must provide an explicit double at this token;
 * deployment callers never submit readiness data themselves.
 */
export interface DeploymentRuntimeReadinessProbe {
  probe(input: DeploymentReadinessInput): Promise<DeploymentReadinessEvidence>;
}

export const DEPLOYMENT_RUNTIME_READINESS_PROBE = Symbol(
  'DEPLOYMENT_RUNTIME_READINESS_PROBE',
);

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeDependencies(value: unknown): DeploymentReadinessDependency[] | undefined {
  if (!Array.isArray(value)) return undefined;

  return value.map((item, index) => {
    const record = isRecord(item) ? item : {};
    return {
      name: stringValue(record.name) ?? `dependency-${index + 1}`,
      critical: record.critical === true,
      status: stringValue(record.status)?.toUpperCase() ?? 'UNKNOWN',
    };
  });
}

function normalizeProof(value: unknown): DeploymentReadinessProof | undefined {
  if (!isRecord(value)) return undefined;

  return {
    kind: stringValue(value.kind),
    source: stringValue(value.source),
    deploymentId: stringValue(value.deploymentId),
    releaseId: stringValue(value.releaseId),
    environmentId: stringValue(value.environmentId),
    tenantId: stringValue(value.tenantId),
    traceId: stringValue(value.traceId),
    activationId: stringValue(value.activationId),
    appliedAt: stringValue(value.appliedAt),
    observedAt: stringValue(value.observedAt),
    synthetic: value.synthetic === true,
  };
}

/**
 * HTTP adapter for a target runtime. It intentionally accepts a success only
 * when the target returns the documented, deployment-bound readiness proof.
 * A plain 200, generic /health response, or caller supplied value is not
 * proof of a ready runtime.
 */
@Injectable()
export class HttpDeploymentRuntimeReadinessProbe
  implements DeploymentRuntimeReadinessProbe
{
  async probe(
    input: DeploymentReadinessInput,
  ): Promise<DeploymentReadinessEvidence> {
    const target = this.readinessEndpoint(input.environment.baseUrl);
    const observedAt = new Date().toISOString();

    if (!target) {
      return {
        ready: false,
        source: 'UNKNOWN',
        code: DeploymentErrorCode.DEP_READINESS_UNVERIFIED,
        message: 'The environment has no valid runtime readiness endpoint',
        observedAt,
      };
    }

    const startedAt = Date.now();
    try {
      const response = await fetch(target.requestUrl, {
        method: 'GET',
        redirect: 'error',
        headers: {
          accept: 'application/json',
          'x-deployment-id': input.deploymentId,
          'x-release-id': input.releaseId,
          'x-environment-id': input.environmentId,
          'x-tenant-id': input.tenantId,
          'x-deployment-trace-id': input.traceId,
        },
        signal: AbortSignal.timeout(this.timeoutMs()),
      });
      const latencyMs = Date.now() - startedAt;

      if (!response.ok) {
        return {
          ready: false,
          source: 'REAL',
          code: DeploymentErrorCode.DEP_RUNTIME_UNAVAILABLE,
          message: 'The runtime readiness endpoint did not return a successful response',
          observedAt: new Date().toISOString(),
          endpoint: target.auditEndpoint,
          latencyMs,
          statusCode: response.status,
          retryable: response.status >= 500,
        };
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return {
          ready: false,
          source: 'REAL',
          code: DeploymentErrorCode.DEP_READINESS_UNVERIFIED,
          message: 'The runtime readiness endpoint returned no verifiable JSON proof',
          observedAt: new Date().toISOString(),
          endpoint: target.auditEndpoint,
          latencyMs,
          statusCode: response.status,
        };
      }

      const body = isRecord(payload) ? payload : {};
      const proof = normalizeProof(body.proof);
      const source: DeploymentReadinessSource =
        proof?.synthetic || proof?.source?.toUpperCase() === 'SYNTHETIC'
          ? 'SYNTHETIC'
          : proof?.source?.toUpperCase() === 'RUNTIME'
            ? 'REAL'
            : 'UNKNOWN';
      const runtime = isRecord(body.runtime) ? body.runtime : {};
      const runtimeStatus = stringValue(runtime.status ?? runtime.state)?.toUpperCase();
      const ready = body.ready === true || body.readiness === 'READY';

      return {
        ready,
        source,
        code: ready
          ? undefined
          : DeploymentErrorCode.DEP_HEALTHCHECK_FAILED,
        message: ready
          ? 'Runtime returned a readiness response'
          : 'Runtime reported that it is not ready',
        observedAt: new Date().toISOString(),
        endpoint: target.auditEndpoint,
        latencyMs,
        statusCode: response.status,
        runtimeStatus,
        proof,
        dependencies: normalizeDependencies(body.dependencies),
      };
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      const timeout = name === 'TimeoutError' || name === 'AbortError';
      return {
        ready: false,
        source: 'UNKNOWN',
        code: timeout
          ? DeploymentErrorCode.DEP_READINESS_TIMEOUT
          : DeploymentErrorCode.DEP_RUNTIME_TRANSIENT_ERROR,
        message: timeout
          ? 'Runtime readiness probe timed out'
          : 'Runtime readiness probe encountered a transient error',
        observedAt: new Date().toISOString(),
        endpoint: target.auditEndpoint,
        latencyMs: Date.now() - startedAt,
        retryable: true,
      };
    }
  }

  private timeoutMs(): number {
    const configured = Number(process.env.DEPLOYMENT_READINESS_TIMEOUT_MS);
    return Number.isFinite(configured) && configured >= 100 && configured <= 120_000
      ? configured
      : 10_000;
  }

  private readinessEndpoint(baseUrl: string | null | undefined): {
    requestUrl: string;
    auditEndpoint: string;
  } | null {
    if (!baseUrl?.trim()) return null;

    try {
      const base = new URL(baseUrl.trim());
      if (
        !['http:', 'https:'].includes(base.protocol) ||
        base.username ||
        base.password ||
        base.search ||
        base.hash ||
        (base.pathname !== '/' && base.pathname !== '') ||
        !this.isAllowedOrigin(base.origin)
      ) {
        return null;
      }

      const root = new URL(base.toString());
      root.pathname = root.pathname.endsWith('/')
        ? root.pathname
        : `${root.pathname}/`;
      const readiness = new URL('health/ready', root);
      return {
        requestUrl: readiness.toString(),
        // Do not retain credentials, query strings, or fragments in audit data.
        auditEndpoint: `${readiness.protocol}//${readiness.host}${readiness.pathname}`,
      };
    } catch {
      return null;
    }
  }

  /**
   * Environment.baseUrl is tenant-owned data, not an unrestricted egress
   * destination. A process-level allowlist is required; an empty allowlist
   * deliberately leaves REAL readiness unverified.
   */
  private isAllowedOrigin(origin: string): boolean {
    const configured = process.env.DEPLOYMENT_RUNTIME_ALLOWED_ORIGINS;
    if (!configured?.trim()) return false;

    return configured
      .split(',')
      .map((candidate) => candidate.trim())
      .filter(Boolean)
      .some((candidate) => {
        try {
          const allowed = new URL(candidate);
          return (
            ['http:', 'https:'].includes(allowed.protocol) &&
            !allowed.username &&
            !allowed.password &&
            allowed.origin === origin
          );
        } catch {
          return false;
        }
      });
  }
}

/**
 * Validates runtime evidence independently from the transport. This is the
 * sole authority used by DeploymentService to allow a SUCCEEDED transition.
 */
@Injectable()
export class DeploymentReadinessService {
  constructor(
    @Inject(DEPLOYMENT_RUNTIME_READINESS_PROBE)
    private readonly probe: DeploymentRuntimeReadinessProbe,
  ) {}

  async verify(
    input: DeploymentReadinessInput,
  ): Promise<DeploymentReadinessEvidence> {
    const verificationStartedAt = Date.now();
    try {
      const evidence = await this.probe.probe(input);
      return this.validate(evidence, input, verificationStartedAt);
    } catch {
      return {
        ready: false,
        source: 'UNKNOWN',
        code: DeploymentErrorCode.DEP_RUNTIME_TRANSIENT_ERROR,
        message: 'Runtime readiness verifier failed before producing evidence',
        observedAt: new Date().toISOString(),
        retryable: true,
      };
    }
  }

  /** A minimal, safe subset intended for DeploymentHistory.metadata. */
  auditMetadata(evidence: DeploymentReadinessEvidence): Record<string, unknown> {
    return {
      source: evidence.source,
      ready: evidence.ready,
      code: evidence.code,
      observedAt: evidence.observedAt,
      endpoint: evidence.endpoint,
      latencyMs: evidence.latencyMs,
      statusCode: evidence.statusCode,
      runtimeStatus: evidence.runtimeStatus,
      retryable: evidence.retryable === true,
      proof: evidence.proof
        ? {
            kind: evidence.proof.kind,
            source: evidence.proof.source,
            deploymentId: evidence.proof.deploymentId,
            releaseId: evidence.proof.releaseId,
            environmentId: evidence.proof.environmentId,
            tenantId: evidence.proof.tenantId,
            traceId: evidence.proof.traceId,
            activationId: evidence.proof.activationId,
            appliedAt: evidence.proof.appliedAt,
            observedAt: evidence.proof.observedAt,
            synthetic: evidence.proof.synthetic === true,
          }
        : undefined,
      dependencies: evidence.dependencies?.map((dependency) => ({
        name: dependency.name,
        critical: dependency.critical,
        status: dependency.status,
      })),
    };
  }

  private validate(
    evidence: DeploymentReadinessEvidence,
    input: DeploymentReadinessInput,
    verificationStartedAt: number,
  ): DeploymentReadinessEvidence {
    if (!evidence.ready) {
      return {
        ...evidence,
        ready: false,
        code: evidence.code ?? DeploymentErrorCode.DEP_HEALTHCHECK_FAILED,
      };
    }

    const testMode =
      process.env.NODE_ENV === 'test' &&
      process.env.DEPLOYMENT_READINESS_MODE?.trim().toUpperCase() === 'TEST';
    if (evidence.source !== 'REAL' && !testMode) {
      return this.unverified(
        evidence,
        DeploymentErrorCode.DEP_SYNTHETIC_READINESS_REJECTED,
        'Synthetic or unknown readiness evidence is rejected in REAL mode',
      );
    }

    const proof = evidence.proof;
    if (
      !proof ||
      proof.synthetic ||
      proof.kind !== 'RUNTIME_READINESS' ||
      proof.source?.toUpperCase() !== 'RUNTIME' ||
      proof.deploymentId !== input.deploymentId ||
      proof.releaseId !== input.releaseId ||
      proof.environmentId !== input.environmentId ||
      proof.tenantId !== input.tenantId ||
      proof.traceId !== input.traceId ||
      !proof.activationId ||
      !this.isFreshTimestamp(proof.observedAt, verificationStartedAt) ||
      !this.isAppliedForAttempt(proof.appliedAt, input.startedAt)
    ) {
      return this.unverified(
        evidence,
        DeploymentErrorCode.DEP_READINESS_UNVERIFIED,
        'Runtime readiness proof is missing, stale, or not bound to this deployment',
      );
    }

    if (!['READY', 'HEALTHY'].includes(evidence.runtimeStatus ?? '')) {
      return this.unverified(
        evidence,
        DeploymentErrorCode.DEP_HEALTHCHECK_FAILED,
        'Runtime did not report a ready runtime state',
      );
    }

    if (
      !Array.isArray(evidence.dependencies) ||
      !evidence.dependencies.some((dependency) => dependency.critical)
    ) {
      return this.unverified(
        evidence,
        DeploymentErrorCode.DEP_DEPENDENCY_UNAVAILABLE,
        'Runtime readiness proof does not include critical dependency results',
      );
    }

    const unavailable = evidence.dependencies.find(
      (dependency) => dependency.critical && dependency.status !== 'UP',
    );
    if (unavailable) {
      return this.unverified(
        evidence,
        DeploymentErrorCode.DEP_DEPENDENCY_UNAVAILABLE,
        'A critical runtime dependency is not available',
      );
    }

    return { ...evidence, ready: true, code: undefined };
  }

  private unverified(
    evidence: DeploymentReadinessEvidence,
    code: DeploymentErrorCode,
    message: string,
  ): DeploymentReadinessEvidence {
    return { ...evidence, ready: false, code, message };
  }

  private isFreshTimestamp(
    value: string | undefined,
    verificationStartedAt: number,
  ): boolean {
    if (!value) return false;
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return false;
    const now = Date.now();
    const maxAge = 60_000;
    return (
      timestamp <= now + 30_000 &&
      timestamp >= now - maxAge &&
      timestamp >= verificationStartedAt - 1_000
    );
  }

  private isAppliedForAttempt(
    value: string | undefined,
    deploymentStartedAt: string,
  ): boolean {
    if (!value) return false;
    const appliedAt = Date.parse(value);
    const startedAt = Date.parse(deploymentStartedAt);
    return (
      Number.isFinite(appliedAt) &&
      Number.isFinite(startedAt) &&
      appliedAt >= startedAt - 1_000 &&
      appliedAt <= Date.now() + 30_000
    );
  }
}
