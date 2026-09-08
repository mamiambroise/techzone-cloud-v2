import { Controller, Get, Post, Body, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
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

@ApiTags('data-runtime')
@Controller('data-runtime')
export class DataRuntimeController {
  private readonly logger = new Logger(DataRuntimeController.name);

  constructor(
    private readonly queryEngine: QueryEngine,
    private readonly executionEngine: ExecutionEngine,
    private readonly dataAccess: DataAccessManager,
    private readonly bindingService: DataBindingService,
    private readonly historyService: HistoryService,
    private readonly validationService: ValidationService,
  ) {}

  // === CONTRACT ===

  @Get('contract')
  @ApiOperation({ summary: 'Data Runtime Contract v1' })
  @ApiResponse({ status: 200, description: 'Contrat complet' })
  async getContract() {
    return this.dataAccess.getContract();
  }

  @Get('resources')
  @ApiOperation({ summary: 'Lister les ressources canoniques' })
  async getResources() {
    return this.dataAccess.getResources();
  }

  // === QUERY ===

  @Post('query')
  @ApiOperation({ summary: 'Executer une query declarative' })
  @ApiBody({ type: QueryContractDto })
  @ApiResponse({ status: 200, description: 'Resultat pagine' })
  async executeQuery(
    @Body() query: QueryContractDto,
    @Body('ctx') ctx?: RuntimeContextDto,
  ) {
    this.logger.log(`POST /data-runtime/query resource=${query.resource}`);
    const context = ctx || this.buildContext(query.resource);
    return this.queryEngine.execute(query, context);
  }

  @Get('resources/:resource/:id')
  @ApiOperation({ summary: 'Obtenir un element canonique' })
  async getResource(@Param('resource') resource: string, @Param('id') id: string) {
    const ctx = this.buildContext(resource);
    return this.dataAccess.get(resource, id, ctx);
  }

  @Get('resources/:resource')
  @ApiOperation({ summary: 'Lister une ressource canonique' })
  async listResource(@Param('resource') resource: string) {
    const ctx = this.buildContext(resource);
    return this.dataAccess.list(resource, ctx);
  }

  // === EXECUTION ===

  @Post('execute')
  @ApiOperation({ summary: 'Executer une operation (create/update/delete/execute)' })
  @ApiBody({ type: ExecutionRequestDto })
  @ApiResponse({ status: 201, description: 'Resultat de laction' })
  async executeOperation(@Body() request: ExecutionRequestDto) {
    this.logger.log(`POST /data-runtime/execute ${request.operation} ${request.resource}`);
    const ctx = this.buildContext(request.resource);
    return this.executionEngine.execute(request, ctx);
  }

  // === VALIDATION ===

  @Post('validate')
  @ApiOperation({ summary: 'Valider des donnees contre un schema canonique' })
  async validateData(
    @Body('resource') resource: string,
    @Body('data') data: Record<string, any>,
  ) {
    return this.validationService.validate(resource, data);
  }

  // === HISTORY & DIAGNOSTICS ===

  @Get('history')
  @ApiOperation({ summary: 'Historique des operations' })
  async getHistory() {
    return this.historyService.searchHistory();
  }

  @Get('history/:traceId')
  @ApiOperation({ summary: 'Historique par traceId' })
  async getHistoryByTrace(@Param('traceId') traceId: string) {
    return {
      records: this.historyService.getHistoryByTraceId(traceId),
      timeline: this.historyService.buildTimeline(traceId),
      diagnostics: this.historyService.getDiagnostics(traceId),
    };
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Metriques du Data Runtime' })
  async getMetrics() {
    return this.historyService.getMetrics();
  }

  // === BINDING ===

  @Post('bindings/:bindingId/resolve')
  @ApiOperation({ summary: 'Resoudre un binding' })
  async resolveBinding(@Param('bindingId') bindingId: string, @Body('ctx') ctx?: RuntimeContextDto) {
    const context = ctx || this.buildContext('default');
    return this.bindingService.resolve(bindingId, context);
  }

  @Get('bindings/:bindingId/state')
  @ApiOperation({ summary: 'Etat dun binding' })
  async getBindingState(@Param('bindingId') bindingId: string) {
    return { state: this.bindingService.getBindingState(bindingId) };
  }

  private buildContext(resource: string): RuntimeContextDto {
    return {
      tenantId: 'system',
      userId: 'system',
      applicationId: 'data-runtime',
      environmentId: process.env.NODE_ENV || 'development',
      requestId: `req-${Date.now()}`,
      traceId: `trace-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      permissions: ['*'],
      locale: 'fr',
    };
  }
}
