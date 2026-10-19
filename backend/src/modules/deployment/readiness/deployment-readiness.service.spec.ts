import { DeploymentErrorCode } from '../../../common/errors/deployment-error-code.enum';
import {
  DeploymentReadinessService,
  HttpDeploymentRuntimeReadinessProbe,
  type DeploymentReadinessEvidence,
  type DeploymentReadinessInput,
  type DeploymentRuntimeReadinessProbe,
} from './deployment-readiness.service';

const input = (): DeploymentReadinessInput => ({
  deploymentId: 'deployment-1',
  releaseId: 'release-1',
  environmentId: 'environment-1',
  tenantId: 'tenant-1',
  traceId: 'trc-deployment-1',
  startedAt: new Date().toISOString(),
  environment: {
    code: 'test',
    type: 'TEST',
    baseUrl: 'https://runtime.example.test',
  },
});

const realProof = (value: DeploymentReadinessInput = input()) => ({
  kind: 'RUNTIME_READINESS',
  source: 'RUNTIME',
  deploymentId: value.deploymentId,
  releaseId: value.releaseId,
  environmentId: value.environmentId,
  tenantId: value.tenantId,
  traceId: value.traceId,
  activationId: 'activation-1',
  appliedAt: new Date().toISOString(),
  observedAt: new Date().toISOString(),
});

const readyEvidence = (
  value: DeploymentReadinessInput = input(),
): DeploymentReadinessEvidence => ({
  ready: true,
  source: 'REAL',
  message: 'Runtime ready',
  observedAt: new Date().toISOString(),
  runtimeStatus: 'READY',
  proof: realProof(value),
  dependencies: [{ name: 'database', critical: true, status: 'UP' }],
});

function verifier(
  result: DeploymentReadinessEvidence | Error,
): DeploymentReadinessService {
  const probe: DeploymentRuntimeReadinessProbe = {
    probe: jest.fn(async () => {
      if (result instanceof Error) throw result;
      return result;
    }),
  };
  return new DeploymentReadinessService(probe);
}

describe('DeploymentReadinessService', () => {
  const previousMode = process.env.DEPLOYMENT_READINESS_MODE;
  const previousOrigins = process.env.DEPLOYMENT_RUNTIME_ALLOWED_ORIGINS;

  beforeEach(() => {
    process.env.DEPLOYMENT_READINESS_MODE = 'REAL';
    delete process.env.DEPLOYMENT_RUNTIME_ALLOWED_ORIGINS;
  });

  afterAll(() => {
    if (previousMode === undefined) {
      delete process.env.DEPLOYMENT_READINESS_MODE;
    } else {
      process.env.DEPLOYMENT_READINESS_MODE = previousMode;
    }
    if (previousOrigins === undefined) {
      delete process.env.DEPLOYMENT_RUNTIME_ALLOWED_ORIGINS;
    } else {
      process.env.DEPLOYMENT_RUNTIME_ALLOWED_ORIGINS = previousOrigins;
    }
  });

  it('accepts a fresh REAL readiness proof bound to this deployment', async () => {
    const value = input();
    await expect(verifier(readyEvidence(value)).verify(value)).resolves.toMatchObject({
      ready: true,
      source: 'REAL',
      runtimeStatus: 'READY',
    });
  });

  it.each([
    [
      'runtime unavailable',
      DeploymentErrorCode.DEP_RUNTIME_UNAVAILABLE,
      'Runtime is unavailable',
    ],
    [
      'readiness timeout',
      DeploymentErrorCode.DEP_READINESS_TIMEOUT,
      'Runtime readiness probe timed out',
    ],
    [
      'failed health check',
      DeploymentErrorCode.DEP_HEALTHCHECK_FAILED,
      'Runtime reported unhealthy',
    ],
  ])('%s never becomes ready', async (_name, code, message) => {
    const evidence: DeploymentReadinessEvidence = {
      ready: false,
      source: 'REAL',
      code,
      message,
      observedAt: new Date().toISOString(),
    };

    await expect(verifier(evidence).verify(input())).resolves.toMatchObject({
      ready: false,
      code,
    });
  });

  it('rejects a synthetic readiness result in REAL mode', async () => {
    const value = input();
    const evidence: DeploymentReadinessEvidence = {
      ...readyEvidence(value),
      source: 'SYNTHETIC',
      proof: { ...realProof(value), source: 'SYNTHETIC', synthetic: true },
    };

    await expect(verifier(evidence).verify(value)).resolves.toMatchObject({
      ready: false,
      code: DeploymentErrorCode.DEP_SYNTHETIC_READINESS_REJECTED,
    });
  });

  it.each([
    [
      'a proof for a different deployment',
      (value: DeploymentReadinessInput) => ({
        ...readyEvidence(value),
        proof: { ...realProof(value), deploymentId: 'another-deployment' },
      }),
    ],
    [
      'a stale proof',
      (value: DeploymentReadinessInput) => ({
        ...readyEvidence(value),
        proof: {
          ...realProof(value),
          appliedAt: new Date(Date.now() - 120_000).toISOString(),
          observedAt: new Date(Date.now() - 120_000).toISOString(),
        },
      }),
    ],
    [
      'a proof with the wrong source',
      (value: DeploymentReadinessInput) => ({
        ...readyEvidence(value),
        proof: { ...realProof(value), source: 'CACHE' },
      }),
    ],
  ])('%s is not a verifiable readiness proof', async (_name, makeEvidence) => {
    const value = input();
    await expect(verifier(makeEvidence(value)).verify(value)).resolves.toMatchObject({
      ready: false,
      code: DeploymentErrorCode.DEP_READINESS_UNVERIFIED,
    });
  });

  it('rejects a candidate when a critical dependency is unavailable', async () => {
    const value = input();
    const evidence: DeploymentReadinessEvidence = {
      ...readyEvidence(value),
      dependencies: [{ name: 'database', critical: true, status: 'DOWN' }],
    };

    await expect(verifier(evidence).verify(value)).resolves.toMatchObject({
      ready: false,
      code: DeploymentErrorCode.DEP_DEPENDENCY_UNAVAILABLE,
    });
  });

  it('rejects a proof with no critical dependency evidence', async () => {
    const value = input();
    const evidence: DeploymentReadinessEvidence = {
      ...readyEvidence(value),
      dependencies: [],
    };

    await expect(verifier(evidence).verify(value)).resolves.toMatchObject({
      ready: false,
      code: DeploymentErrorCode.DEP_DEPENDENCY_UNAVAILABLE,
    });
  });

  it('turns a transient probe exception into a controlled failed result', async () => {
    await expect(verifier(new Error('transport reset')).verify(input())).resolves.toMatchObject({
      ready: false,
      code: DeploymentErrorCode.DEP_RUNTIME_TRANSIENT_ERROR,
      retryable: true,
    });
  });

  it('fails closed before networking when the environment has no valid runtime URL', async () => {
    const probe = new HttpDeploymentRuntimeReadinessProbe();
    const value = input();
    value.environment.baseUrl = 'not-a-url';

    await expect(probe.probe(value)).resolves.toMatchObject({
      ready: false,
      code: DeploymentErrorCode.DEP_READINESS_UNVERIFIED,
    });
  });

  it('fails closed for a tenant-configured URL that is not process-allowlisted', async () => {
    const probe = new HttpDeploymentRuntimeReadinessProbe();

    await expect(probe.probe(input())).resolves.toMatchObject({
      ready: false,
      code: DeploymentErrorCode.DEP_READINESS_UNVERIFIED,
    });
  });

  it('accepts a deployment-bound HTTP readiness response from an allowlisted runtime', async () => {
    const value = input();
    process.env.DEPLOYMENT_RUNTIME_ALLOWED_ORIGINS = 'https://runtime.example.test';
    const originalFetch = globalThis.fetch;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        ready: true,
        runtime: { status: 'READY' },
        proof: realProof(value),
        dependencies: [{ name: 'database', critical: true, status: 'UP' }],
      }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    try {
      const service = new DeploymentReadinessService(
        new HttpDeploymentRuntimeReadinessProbe(),
      );
      await expect(service.verify(value)).resolves.toMatchObject({ ready: true });
      expect(fetchMock).toHaveBeenCalledWith(
        'https://runtime.example.test/health/ready',
        expect.objectContaining({ method: 'GET' }),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('maps an HTTP 5xx readiness response to an unavailable runtime', async () => {
    const value = input();
    process.env.DEPLOYMENT_RUNTIME_ALLOWED_ORIGINS = 'https://runtime.example.test';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;
    try {
      await expect(new HttpDeploymentRuntimeReadinessProbe().probe(value)).resolves.toMatchObject({
        ready: false,
        code: DeploymentErrorCode.DEP_RUNTIME_UNAVAILABLE,
        retryable: true,
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('maps an aborted HTTP probe to a readiness timeout', async () => {
    const value = input();
    process.env.DEPLOYMENT_RUNTIME_ALLOWED_ORIGINS = 'https://runtime.example.test';
    const timeout = new Error('timed out');
    timeout.name = 'TimeoutError';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockRejectedValue(timeout) as unknown as typeof fetch;
    try {
      await expect(new HttpDeploymentRuntimeReadinessProbe().probe(value)).resolves.toMatchObject({
        ready: false,
        code: DeploymentErrorCode.DEP_READINESS_TIMEOUT,
        retryable: true,
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fails closed when the runtime response is not JSON evidence', async () => {
    const value = input();
    process.env.DEPLOYMENT_RUNTIME_ALLOWED_ORIGINS = 'https://runtime.example.test';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockRejectedValue(new SyntaxError('invalid JSON')),
    }) as unknown as typeof fetch;
    try {
      await expect(new HttpDeploymentRuntimeReadinessProbe().probe(value)).resolves.toMatchObject({
        ready: false,
        code: DeploymentErrorCode.DEP_READINESS_UNVERIFIED,
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
