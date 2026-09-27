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
