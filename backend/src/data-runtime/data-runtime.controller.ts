import { RuntimeExecutionService } from '../modules/pack-runtime/runtime-execution.service';
import { Controller, Get, Post, Body, Param, Logger, Req, ConflictException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import type { Request } from 'express';
import { QueryEngine } from './query-engine/query-engine';
import { ExecutionEngine } from './execution-engine/execution-engine';
import { DataAccessManager } from './data-access/data-access-manager';
import { DataBindingService } from './binding/data-binding.service';
import { HistoryService } from './history/history.service';
import { ValidationService } from './validation/validation.service';
import {
  QueryContractDto,
  ExecutionRequestDto,
  RuntimeContextDto,
} from './dto/data-runtime.dto';
import { CurrentUser } from '../iam/decorators/current-user.decorator';
import type { IamAuthContext } from '../iam/decorators/current-user.decorator';
import { Permissions } from '../iam/iam-permissions.guard';
import { PrismaService } from '../prisma/prisma.service';
import {
  DATA_RUNTIME_EXECUTE,
  DATA_RUNTIME_QUERY,
  DATA_RUNTIME_READ,
  ROLES,
} from '../iam/iam.constants';

@ApiTags('data-runtime')
@Controller('api/data-runtime')
export class DataRuntimeController {
  private readonly logger = new Logger(DataRuntimeController.name);

  constructor(
    private readonly queryEngine: QueryEngine,
    private readonly executionEngine: ExecutionEngine,
    private readonly dataAccess: DataAccessManager,
    private readonly bindingService: DataBindingService,
    private readonly historyService: HistoryService,
    private readonly validationService: ValidationService,
    private readonly prisma: PrismaService = null as any,
    private readonly runtimeExecution: RuntimeExecutionService = new RuntimeExecutionService(prisma),
  ) {}

  // === CONTRACT ===

  @Get('contract')
  @Permissions(DATA_RUNTIME_READ)
  @ApiOperation({ summary: 'Data Runtime Contract v1' })
  @ApiResponse({ status: 200, description: 'Contrat complet' })
  async getContract() {
    return this.dataAccess.getContract();
  }

  @Get('resources')
  @Permissions(DATA_RUNTIME_READ)
  @ApiOperation({ summary: 'Lister les ressources canoniques' })
  async getResources() {
    return this.dataAccess.getResources();
  }

  // === QUERY ===

  @Post('query')
  @Permissions(DATA_RUNTIME_QUERY)
  @ApiOperation({ summary: 'Executer une query declarative' })
  @ApiBody({ type: QueryContractDto })
  @ApiResponse({ status: 200, description: 'Resultat pagine' })
  async executeQuery(
    @Req() req: Request,
    @CurrentUser() principal: IamAuthContext,
    @Body() query: QueryContractDto,
  ) {
    this.logger.log(`POST /data-runtime/query resource=${query.resource}`);
    await this.assertPublishedRuntimeGuard(req, principal, query as Record<string, any>);
    const context = this.buildContext(query.resource, principal, req);
    return this.queryEngine.execute(query, context);
  }
  @Get('resources/:resource/:id')
  @Permissions(DATA_RUNTIME_READ)
  @ApiOperation({ summary: 'Obtenir un element canonique' })
  async getResource(
    @Req() req: Request,
    @CurrentUser() principal: IamAuthContext,
    @Param('resource') resource: string,
    @Param('id') id: string,
  ) {
    await this.assertPublishedRuntimeGuard(req, principal, { resource, id, applicationId: (req as any)?.body?.applicationId });
    const ctx = this.buildContext(resource, principal, req);
    return this.dataAccess.get(resource, id, ctx);
  }

  @Get('resources/:resource')
  @Permissions(DATA_RUNTIME_READ)
  @ApiOperation({ summary: 'Lister une ressource canonique' })
  async listResource(
    @Req() req: Request,
    @CurrentUser() principal: IamAuthContext,
    @Param('resource') resource: string,
  ) {
    await this.assertPublishedRuntimeGuard(req, principal, { resource, applicationId: (req as any)?.body?.applicationId });
    const ctx = this.buildContext(resource, principal, req);
    return this.dataAccess.list(resource, ctx);
  }

  // === EXECUTION ===

  @Post('execute')
  @Permissions(DATA_RUNTIME_EXECUTE)
  @ApiOperation({ summary: 'Executer une operation (create/update/delete/execute)' })
  @ApiBody({ type: ExecutionRequestDto })
  @ApiResponse({ status: 201, description: 'Resultat de laction' })
  async executeOperation(@Req() req: Request, @CurrentUser() principal: IamAuthContext, @Body() request: ExecutionRequestDto) {
    this.logger.log(`POST /data-runtime/execute ${request.operation} ${request.resource}`);
    await this.assertPublishedRuntimeGuard(req, principal, request as Record<string, any>);
    const ctx = this.buildContext(request.resource, principal, req);
    return this.executionEngine.execute(request, ctx);
  }

  // === VALIDATION ===

  @Post('validate')
  @Permissions(DATA_RUNTIME_READ)
  @ApiOperation({ summary: 'Valider des donnees contre un schema canonique' })
  async validateData(
    @Body('resource') resource: string,
    @Body('data') data: Record<string, any>,
  ) {
    return this.validationService.validate(resource, data);
  }

  // === HISTORY & DIAGNOSTICS ===

  @Get('history')
  @Permissions(DATA_RUNTIME_READ)
  @ApiOperation({ summary: 'Historique des operations' })
  async getHistory(@CurrentUser() principal: IamAuthContext) {
    return this.historyService.searchHistoryByTenant(principal.tenantId ?? '');
  }

  @Get('history/:traceId')
  @Permissions(DATA_RUNTIME_READ)
  @ApiOperation({ summary: 'Historique par traceId' })
  async getHistoryByTrace(
    @Param('traceId') traceId: string,
    @CurrentUser() principal: IamAuthContext,
  ) {
    return {
      records: this.historyService.getHistoryByTraceId(traceId, principal.tenantId ?? ''),
      timeline: this.historyService.buildTimeline(traceId, principal.tenantId ?? ''),
      diagnostics: this.historyService.getDiagnostics(traceId, principal.tenantId ?? ''),
    };
  }

  @Get('metrics')
  @Permissions(DATA_RUNTIME_READ)
  @ApiOperation({ summary: 'Metriques du Data Runtime' })
  async getMetrics(@CurrentUser() principal: IamAuthContext) {
    if (!principal?.tenantId) {
      throw new ForbiddenException('TENANT_REQUIRED');
    }
    return this.historyService.getMetrics(principal.tenantId);
  }

  // === BINDING ===

  @Post('bindings/:bindingId/resolve')
  @Permissions(DATA_RUNTIME_EXECUTE)
  @ApiOperation({ summary: 'Resoudre un binding' })
  async resolveBinding(
    @Req() req: Request,
    @CurrentUser() principal: IamAuthContext,
    @Param('bindingId') bindingId: string,
  ) {
    await this.assertPublishedRuntimeGuard(req, principal, { bindingId, applicationId: (req as any)?.body?.applicationId, requireResolution: true });
    const context = this.buildContext('default', principal, req);
    return this.bindingService.resolve(bindingId, context);
  }

  @Get('bindings/:bindingId/state')
  @Permissions(DATA_RUNTIME_QUERY)
  @ApiOperation({ summary: 'Etat dun binding' })
  async getBindingState(@Param('bindingId') bindingId: string) {
    return { state: this.bindingService.getBindingState(bindingId) };
  }

  private async assertPublishedRuntimeGuard(req: Request | undefined, principal: IamAuthContext, payload: Record<string, any> = {}) {
    if (!principal?.tenantId) {
      throw new ForbiddenException('TENANT_REQUIRED');
    }
    const resolutionId = payload.resolutionId || (req as any)?.body?.resolutionId || (req as any)?.query?.resolutionId || (req as any)?.headers?.['x-runtime-resolution-id'];
    const resource = typeof payload.resource === 'string' ? payload.resource : '';
    const isBusinessManagerResource = resource.toLowerCase().startsWith('bm:');
    if (!resolutionId) {
      if (isBusinessManagerResource || payload.requireResolution === true) {
        throw new ForbiddenException('RUNTIME_RESOLUTION_REQUIRED');
      }
      return;
    }
    if (!this.prisma?.runtimeResolution) {
      throw new ForbiddenException('RUNTIME_RESOLUTION_GUARD_UNAVAILABLE');
    }
    const published = version?.status === 'PUBLISHED' || req?.headers?.['x-runtime-origin'] === 'published' || Boolean(version && await this.prisma.packVersion.count({ where: { tenantId: principal.tenantId, applicationVersionId: version.id, status: 'PUBLISHED' } }));
    if (!resolutionId && !published) return;
    if (!resolutionId) throw new BadRequestException('RUNTIME_RESOLUTION_ID_REQUIRED');
    const item = await this.runtimeExecution.assertExecutable({
      resolutionId: String(resolutionId), tenantId: principal.tenantId,
      applicationId: version?.applicationId || payload.applicationId,
      applicationVersionId: version?.id || payload.applicationVersionId,
      environmentId: payload.environmentId,
    });
    if (!item) {
      throw new NotFoundException('RUNTIME_RESOLUTION_NOT_FOUND');
    }
    const runtimeStatus = item.status === 'RESOLVED' ? 'EXECUTABLE' : item.status;
    if (
      runtimeStatus !== 'EXECUTABLE' ||
      item.effectiveManifest?.tenantId !== principal.tenantId ||
      item.effectiveManifest?.applicationId !== item.applicationId ||
      item.effectiveManifest?.environment !== item.environment ||
      item.effectiveManifest?.status !== 'VALID' ||
      item.effectiveManifest?.executable !== true
    ) {
      throw new ConflictException('RUNTIME_RESOLUTION_BLOCKED');
    }
    const effective = item.effectiveManifest.content as Record<string, any> | null;
    const scope = effective?.scope;
    if (
      scope?.tenantId !== principal.tenantId ||
      scope?.applicationId !== item.applicationId ||
      scope?.environment !== item.environment
    ) {
      throw new ConflictException('RUNTIME_RESOLUTION_SCOPE_INVALID');
    }
    if (payload.applicationId && item.applicationId !== String(payload.applicationId)) {
      throw new BadRequestException('RUNTIME_APPLICATION_MISMATCH');
    }
    if (payload.environmentId && item.environment !== String(payload.environmentId)) {
      throw new BadRequestException('RUNTIME_ENVIRONMENT_MISMATCH');
    }
    if (isBusinessManagerResource) {
      const applicationVersionId = resource.split(':')[1];
      const resolvedVersionId = scope?.businessVersionId
        ?? effective?.businessConfiguration?.versionId
        ?? effective?.businessConfiguration?.applicationVersionId;
      if (!applicationVersionId || !resolvedVersionId) {
        throw new ConflictException('RUNTIME_APPLICATION_VERSION_UNVERIFIABLE');
      }
      if (String(resolvedVersionId) !== applicationVersionId) {
        throw new BadRequestException('RUNTIME_APPLICATION_VERSION_MISMATCH');
      }
      if (!this.prisma?.applicationVersion?.findFirst) {
        throw new ForbiddenException('RUNTIME_RESOLUTION_GUARD_UNAVAILABLE');
      }
      const version = await this.prisma.applicationVersion.findFirst({
        where: { id: applicationVersionId, tenantId: principal.tenantId },
        select: { applicationId: true },
      });
      if (!version) {
        throw new NotFoundException('APPLICATION_VERSION_NOT_FOUND');
      }
      if (String(version.applicationId) !== item.applicationId) {
        throw new BadRequestException('RUNTIME_APPLICATION_MISMATCH');
      }
    } else if (payload.applicationVersionId) {
      const observed = scope?.businessVersionId ?? effective?.businessConfiguration?.versionId ?? effective?.businessConfiguration?.applicationVersionId;
      if (observed && String(observed) !== String(payload.applicationVersionId)) {
        throw new BadRequestException('RUNTIME_APPLICATION_VERSION_MISMATCH');
      }
    }
    if (req) (req as any).runtimeResolution = item;
    return item;
  }

  private buildContext(resource: string, principal: IamAuthContext, req?: Request): RuntimeContextDto {
    if (!principal.tenantId) {
      throw new Error('TENANT_REQUIRED: tenantId manquant dans le principal IAM');
    }
    const traceId = (req as any)?.traceId || `tr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 10)}`;
    return {
      tenantId: principal.tenantId,
      userId: principal.userId,
      applicationId: (req as any)?.runtimeResolution?.applicationId ?? 'data-runtime',
      environmentId: (req as any)?.runtimeResolution?.environment ?? process.env.NODE_ENV ?? 'development',
      requestId: `req-${Date.now()}`,
      traceId,
      // The IAM guard derives ADMIN from the persisted user, never request JSON.
      // Its static catalogue cannot enumerate dynamically authored BM capabilities.
      // Resource ownership is still verified by the provider before authorization.
      permissions: principal.roles.includes(ROLES.ADMIN) ? [...principal.permissions, '*'] : principal.permissions,
      erpCode: principal.organizationId ?? undefined,
      locale: 'fr',
    };
  }
}
