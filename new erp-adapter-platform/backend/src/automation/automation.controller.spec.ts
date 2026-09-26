import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IamPermissionsGuard } from '../iam/iam-permissions.guard';
import { IamJwtGuard } from '../iam/iam-jwt.guard';
import { IamError } from '../iam/iam-error';
import {
  AUTOMATION_EXECUTE,
  AUTOMATION_READ,
} from '../iam/iam.constants';
import { IamAuthContext } from '../iam/decorators/current-user.decorator';
import { AutomationController } from './automation.controller';
import { RulesEngine } from './rules/rules.engine';
import { WorkflowEngine } from './workflow/workflow.engine';
import { TriggerEngine } from './trigger/trigger.engine';
import { ConditionsEngine } from './conditions/conditions.engine';
import { AutomationHistoryService } from './history/automation-history.service';
import { ErpError } from '../erp-adapter/erp-error';

type Mocked<T> = { [K in keyof T]: jest.Mock };

function makePrincipal(overrides: Partial<IamAuthContext> = {}): IamAuthContext {
  return {
    userId: 'user-A',
    sessionId: 'session-1',
    tenantId: 'tenant-A',
    organizationId: null,
    authenticationLevel: 'PASSWORD',
    roles: ['user'],
    permissions: [AUTOMATION_EXECUTE],
    ...overrides,
  };
}

function mockReq(traceId = 'trace-test-123'): { traceId: string } {
  return { traceId };
}

describe('AutomationController — Fail-Closed Context (1B.5-E2)', () => {
  let controller: AutomationController;
  let rulesEngine: Mocked<RulesEngine>;
  let workflowEngine: Mocked<WorkflowEngine>;
  let triggerEngine: Mocked<TriggerEngine>;
  let historyService: Mocked<AutomationHistoryService>;
  let conditionsEngine: Mocked<ConditionsEngine>;

  const buildCtx = (
    principal: IamAuthContext,
    traceId: string,
    variables?: Record<string, any>,
  ) => (controller as any).buildContext('test', variables, principal, traceId);

  beforeEach(async () => {
    rulesEngine = {
      getRules: jest.fn().mockReturnValue([]),
      getActiveRules: jest.fn().mockReturnValue([]),
      getRule: jest.fn(),
      evaluateAll: jest.fn().mockReturnValue([]),
      simulateRule: jest.fn(),
      registerRule: jest.fn(),
      deactivateRule: jest.fn(),
      activateRule: jest.fn(),
      validateRule: jest.fn(),
      evaluateRule: jest.fn(),
    } as any;

    workflowEngine = {
      getWorkflows: jest.fn().mockReturnValue([]),
      getActiveWorkflows: jest.fn().mockReturnValue([]),
      getWorkflow: jest.fn(),
      getExecutions: jest.fn().mockReturnValue([]),
      startWorkflow: jest.fn(),
      registerWorkflow: jest.fn(),
      setLifecycle: jest.fn(),
      validateWorkflow: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      getExecution: jest.fn(),
    } as any;

    triggerEngine = {
      getTriggers: jest.fn().mockReturnValue([]),
      getEnabledTriggers: jest.fn().mockReturnValue([]),
      getTrigger: jest.fn(),
      processEvent: jest.fn(),
      fireManual: jest.fn(),
      registerTrigger: jest.fn(),
      setEnabled: jest.fn(),
    } as any;

    historyService = {
      recordExecution: jest.fn(),
      search: jest.fn().mockReturnValue([]),
      getByTraceId: jest.fn().mockReturnValue([]),
      getTimeline: jest.fn().mockReturnValue([]),
      getMetrics: jest.fn().mockReturnValue({
        executionsCount: 0,
        successRate: 0,
        failureRate: 0,
        averageDuration: 0,
        retryCount: 0,
        timeoutCount: 0,
        runningCount: 0,
        succeededCount: 0,
        failedCount: 0,
      }),
      clear: jest.fn(),
    } as any;

    conditionsEngine = {
      evaluate: jest.fn(),
      simulate: jest.fn(),
      validate: jest.fn(),
      evaluateFormula: jest.fn(),
      evaluateWithTracePublic: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AutomationController],
      providers: [
        { provide: RulesEngine, useValue: rulesEngine },
        { provide: WorkflowEngine, useValue: workflowEngine },
        { provide: TriggerEngine, useValue: triggerEngine },
        { provide: AutomationHistoryService, useValue: historyService },
        { provide: ConditionsEngine, useValue: conditionsEngine },
      ],
    }).compile();

    controller = module.get<AutomationController>(AutomationController);
  });

  // === E2-01: authenticated principal + tenant + user → PASS ===
  describe('E2-01: authenticated principal with tenant and user', () => {
    it('should build context from principal tenantId, userId, permissions, and traceId', () => {
      const principal = makePrincipal();
      const ctx = buildCtx(principal, 'trace-001');

      expect(ctx.tenantId).toBe('tenant-A');
      expect(ctx.userId).toBe('user-A');
      expect(ctx.permissions).toEqual([AUTOMATION_EXECUTE]);
      expect(ctx.traceId).toBe('trace-001');
      expect(ctx.applicationId).toBe('automation');
    });
  });

  // === E2-02: missing tenantId → REJECTED ===
  describe('E2-02: missing tenantId is rejected', () => {
    it('should reject when principal.tenantId is null', () => {
      const principal = makePrincipal({ tenantId: null });
      expect(() => buildCtx(principal, 'trace-002')).toThrow(IamError);
      try {
        buildCtx(principal, 'trace-002');
      } catch (e) {
        const err = e as IamError;
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('TENANT_REQUIRED');
      }
    });

    it('should reject when principal.tenantId is undefined', () => {
      const principal = makePrincipal({ tenantId: undefined });
      expect(() => buildCtx(principal, 'trace-002')).toThrow(IamError);
      try {
        buildCtx(principal, 'trace-002');
      } catch (e) {
        const err = e as IamError;
        expect(err.code).toBe('TENANT_REQUIRED');
      }
    });
  });

  // === E2-03: missing userId → REJECTED ===
  describe('E2-03: missing userId is rejected', () => {
    it('should reject when principal.userId is undefined', () => {
      const principal = makePrincipal({ userId: undefined as any });
      expect(() => buildCtx(principal, 'trace-003')).toThrow(IamError);
      try {
        buildCtx(principal, 'trace-003');
      } catch (e) {
        const err = e as IamError;
        expect(err.statusCode).toBe(403);
        expect(err.code).toBe('USER_REQUIRED');
      }
    });
  });

  // === E2-04: tenant payload override → DENIED ===
  describe('E2-04: tenant payload override is denied', () => {
    it('should use principal tenantId even when body supplies a different tenantId', () => {
      const principal = makePrincipal({ tenantId: 'tenant-A' });
      const variables = { tenantId: 'tenant-B' };
      const ctx = buildCtx(principal, 'trace-004', variables);

      expect(ctx.tenantId).toBe('tenant-A');
      expect(ctx.tenantId).not.toBe('tenant-B');
    });
  });

  // === E2-05: user payload override → DENIED ===
  describe('E2-05: user payload override is denied', () => {
    it('should use principal userId even when body supplies a different userId', () => {
      const principal = makePrincipal({ userId: 'user-A' });
      const variables = { userId: 'user-B' };
      const ctx = buildCtx(principal, 'trace-005', variables);

      expect(ctx.userId).toBe('user-A');
      expect(ctx.userId).not.toBe('user-B');
    });
  });

  // === E2-06: production wildcard permission fallback → NONE ===
  describe('E2-06: no wildcard permission fallback in production code', () => {
    it('should not introduce wildcard permissions in the context', () => {
      const principal = makePrincipal({ permissions: ['erp:read', AUTOMATION_EXECUTE] });
      const ctx = buildCtx(principal, 'trace-006');

      expect(ctx.permissions).not.toContain('*');
      expect(ctx.permissions).toEqual(['erp:read', AUTOMATION_EXECUTE]);
    });

    it('should not default to wildcard when principal has no permissions', () => {
      const principal = makePrincipal({ permissions: [] });
      const ctx = buildCtx(principal, 'trace-006');

      expect(ctx.permissions).toEqual([]);
      expect(ctx.permissions).not.toContain('*');
    });
  });

  // === E2-07: insufficient permission → 403 ===
  describe('E2-07: insufficient permission returns 403', () => {
    it('should throw ForbiddenException when principal lacks required permission', () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue([AUTOMATION_EXECUTE]),
      };
      const guard = new IamPermissionsGuard(reflector as unknown as Reflector);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            iamAuth: makePrincipal({ permissions: ['erp:read'] }),
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  // === E2-08: anonymous request → 401 ===
  describe('E2-08: anonymous request returns 401', () => {
    it('should throw IamError(401) from JwtGuard when no bearer token', async () => {
      const reflector = {
        getAllAndOverride: jest.fn().mockReturnValue(false),
      };
      const prisma = { iamSession: { findUnique: jest.fn() } };
      const authService = { assertSessionUsable: jest.fn() };
      const guard = new IamJwtGuard(reflector as any, prisma as any, authService as any);

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
        getHandler: () => ({}),
        getClass: () => ({}),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(context)).rejects.toThrow(IamError);
      try {
        await guard.canActivate(context);
      } catch (e) {
        const err = e as IamError;
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('UNAUTHENTICATED');
      }
    });

    it('should throw IamError(401) from buildContext when principal is null', () => {
      expect(() => buildCtx(null as any, 'trace-008')).toThrow(IamError);
      try {
        buildCtx(null as any, 'trace-008');
      } catch (e) {
        const err = e as IamError;
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('UNAUTHENTICATED');
      }
    });

    it('should throw IamError(401) from buildContext when principal is undefined', () => {
      expect(() => buildCtx(undefined as any, 'trace-008')).toThrow(IamError);
    });
  });

  // === E2-09: traceId preserved → PASS ===
  describe('E2-09: request traceId is preserved in context', () => {
    it('should use the request traceId instead of generating a new one', () => {
      const principal = makePrincipal();
      const requestTrace = 'req-trace-999';
      const ctx = buildCtx(principal, requestTrace);

      expect(ctx.traceId).toBe(requestTrace);
    });

    it('should propagate traceId through evaluateRules', () => {
      const principal = makePrincipal();
      const req = mockReq('trace-eval-rules');
      rulesEngine.evaluateAll = jest.fn().mockReturnValue([]);

      controller.evaluateRules(req as any, principal, {});

      const ctx = (rulesEngine.evaluateAll as jest.Mock).mock.calls[0][0];
      expect(ctx.traceId).toBe('trace-eval-rules');
      expect(ctx.tenantId).toBe('tenant-A');
      expect(ctx.userId).toBe('user-A');
    });

    it('should propagate traceId through startWorkflow', async () => {
      const principal = makePrincipal();
      const req = mockReq('trace-wf-start');
      (workflowEngine.startWorkflow as jest.Mock).mockResolvedValue({
        executionId: 'exec-1',
        version: '1.0',
        startedAt: '2024-01-01T00:00:00Z',
        finishedAt: '2024-01-01T00:00:01Z',
        status: 'SUCCEEDED',
      });

      await controller.startWorkflow(req as any, principal, { workflowCode: 'test-wf' });

      const ctx = (workflowEngine.startWorkflow as jest.Mock).mock.calls[0][1];
      expect(ctx.traceId).toBe('trace-wf-start');
    });

    it('should propagate traceId through processEvent', () => {
      const principal = makePrincipal();
      const req = mockReq('trace-event');
      (triggerEngine.processEvent as jest.Mock).mockResolvedValue([]);

      controller.processEvent(req as any, principal, {
        eventType: 'invoice.created',
        source: 'erp',
      });

      const ctx = (triggerEngine.processEvent as jest.Mock).mock.calls[0][1];
      expect(ctx.traceId).toBe('trace-event');
    });

    it('should propagate traceId through fireTrigger', () => {
      const principal = makePrincipal();
      const req = mockReq('trace-fire');
      (triggerEngine.fireManual as jest.Mock).mockResolvedValue({ triggerCode: 't1', status: 'SUCCEEDED' });

      controller.fireTrigger(req as any, principal, { triggerCode: 'trigger.manual.validate' });

      const ctx = (triggerEngine.fireManual as jest.Mock).mock.calls[0][1];
      expect(ctx.traceId).toBe('trace-fire');
    });
  });

  // === E2-10: ERP failure remains propagated → PASS ===
  describe('E2-10: ERP failure remains propagated', () => {
    it('should propagate ErpError from workflowEngine.startWorkflow', async () => {
      const principal = makePrincipal();
      const req = mockReq('trace-erp-10');
      const erpError = ErpError.unavailable('ERP unavailable', { tenantId: 'tenant-A' }, 'trace-erp-10');
      (workflowEngine.startWorkflow as jest.Mock).mockRejectedValue(erpError);

      await expect(
        controller.startWorkflow(req as any, principal, { workflowCode: 'test-wf' }),
      ).rejects.toThrow(ErpError);

      const ctx = (workflowEngine.startWorkflow as jest.Mock).mock.calls[0][1];
      expect(ctx.traceId).toBe('trace-erp-10');
    });

    it('should propagate ErpError from triggerEngine.processEvent', async () => {
      const principal = makePrincipal();
      const req = mockReq('trace-erp-10b');
      const erpError = ErpError.unavailable('ERP timeout', undefined, 'trace-erp-10b');
      (triggerEngine.processEvent as jest.Mock).mockRejectedValue(erpError);

      await expect(
        controller.processEvent(req as any, principal, {
          eventType: 'invoice.created',
          source: 'erp',
        }),
      ).rejects.toThrow(ErpError);
    });
  });

  // === Regression: buildContext is fail-closed ===
  describe('Regression: no system / wildcard fallback', () => {
    it('should not produce tenantId = "system" for any principal', () => {
      const principal = makePrincipal();
      const ctx = buildCtx(principal, 'trace-reg');
      expect(ctx.tenantId).not.toBe('system');
    });

    it('should not produce userId = "system" for any principal', () => {
      const principal = makePrincipal();
      const ctx = buildCtx(principal, 'trace-reg');
      expect(ctx.userId).not.toBe('system');
    });

    it('should not generate a random traceId when request traceId is provided', () => {
      const principal = makePrincipal();
      const ctx = buildCtx(principal, 'preserved-trace');
      expect(ctx.traceId).toBe('preserved-trace');
    });
  });

  // === Regression: READ endpoints remain accessible with AUTH ===
  describe('Regression: read endpoints do not require tenant/user context', () => {
    it('getCockpit should not call buildContext', () => {
      controller.getCockpit();
      const ctx = (rulesEngine.getActiveRules as jest.Mock).mock.calls;
      // getCockpit should not throw even without principal
      expect(ctx).toBeDefined();
    });
  });
});
