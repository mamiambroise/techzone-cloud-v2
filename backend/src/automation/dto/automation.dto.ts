import {
  IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber, IsArray, IsIn, ValidateNested, IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ConditionNodeDto {
  @ApiPropertyOptional({ enum: ['AND', 'OR'] })
  @IsOptional()
  @IsIn(['AND', 'OR'])
  logic?: 'AND' | 'OR';

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  conditions?: ConditionNodeDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  field?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  operator?: string;

  @ApiPropertyOptional()
  @IsOptional()
  value?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  not?: boolean;
}

export class EventPayloadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  eventType: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  source: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  timestamp?: string;
}

export class SimulateRuleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  ruleCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}

export class StartWorkflowDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  workflowCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

export class FireTriggerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  triggerCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;
}

export class WorkflowStepDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ enum: ['START', 'STEP', 'CONDITION', 'ACTION', 'BRANCH', 'END'] })
  @IsIn(['START', 'STEP', 'CONDITION', 'ACTION', 'BRANCH', 'END'])
  type: 'START' | 'STEP' | 'CONDITION' | 'ACTION' | 'BRANCH' | 'END';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actionRef?: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  condition?: Record<string, any>;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  @IsObject()
  transitions?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  next?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  retryable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxRetries?: number;
}

export class WorkflowDefinitionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'READY', 'ACTIVE', 'PAUSED', 'DEPRECATED', 'ARCHIVED'] })
  @IsOptional()
  @IsIn(['DRAFT', 'READY', 'ACTIVE', 'PAUSED', 'DEPRECATED', 'ARCHIVED'])
  lifecycle?: 'DRAFT' | 'READY' | 'ACTIVE' | 'PAUSED' | 'DEPRECATED' | 'ARCHIVED';

  @ApiPropertyOptional({ default: '1.0' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiProperty({ type: [WorkflowStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  maxSteps?: number;
}

export class WorkflowLifecycleDto {
  @ApiProperty({ enum: ['DRAFT', 'READY', 'ACTIVE', 'PAUSED', 'DEPRECATED', 'ARCHIVED'] })
  @IsIn(['DRAFT', 'READY', 'ACTIVE', 'PAUSED', 'DEPRECATED', 'ARCHIVED'])
  lifecycle: 'DRAFT' | 'READY' | 'ACTIVE' | 'PAUSED' | 'DEPRECATED' | 'ARCHIVED';
}
