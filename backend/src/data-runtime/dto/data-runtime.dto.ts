import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsArray, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  FilterOperator,
  FilterGroup,
  QueryContract,
  SortOption,
} from '../interfaces/query.contract';
import type {
  ExecutionRequest,
  ExecutionOperation,
} from '../interfaces/execution.contract';
import type { RuntimeContext } from '../interfaces';

export class FilterConditionDto {
  @ApiProperty({ description: 'Nom du champ' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ description: 'Operateur', enum: ['EQ','NE','GT','GTE','LT','LTE','IN','NOT_IN','CONTAINS','STARTS_WITH','ENDS_WITH','IS_NULL'] })
  @IsIn(['EQ','NE','GT','GTE','LT','LTE','IN','NOT_IN','CONTAINS','STARTS_WITH','ENDS_WITH','IS_NULL'])
  operator: FilterOperator;

  @ApiPropertyOptional()
  @IsOptional()
  value?: any;
}

export class SortOptionDto {
  @ApiProperty({ description: 'Champ de tri' })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({ description: 'Direction', enum: ['ASC', 'DESC'] })
  @IsIn(['ASC', 'DESC'])
  direction: 'ASC' | 'DESC';
}

export class QueryContractDto implements QueryContract {
  @ApiProperty({ description: 'Nom de la ressource canonique (ex: Product)' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiPropertyOptional({ description: 'Champs a selectionner', type: [String] })
  @IsOptional()
  @IsArray()
  select?: string[];

  @ApiPropertyOptional({ description: 'Filtres' })
  @IsOptional()
  filter?: FilterGroup;

  @ApiPropertyOptional({ type: [SortOptionDto] })
  @IsOptional()
  @IsArray()
  sort?: SortOption[];

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  pageSize?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  relations?: string[];
}

export class ExecutionRequestDto implements ExecutionRequest {
  @ApiProperty({ description: 'Ressource canonique' })
  @IsString()
  @IsNotEmpty()
  resource: string;

  @ApiProperty({ description: 'Operation', enum: ['CREATE','UPDATE','DELETE','EXECUTE','BATCH'] })
  @IsIn(['CREATE','UPDATE','DELETE','EXECUTE','BATCH'])
  operation: ExecutionOperation;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  input?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class RuntimeContextDto implements RuntimeContext {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  applicationId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  environmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  erpCode?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  requestId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  traceId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  permissions: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  locale?: string;
}
