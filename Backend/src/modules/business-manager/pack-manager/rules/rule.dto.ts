import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { RuleEffect, RuleStatus, RuleTargetType, RuleType } from '../../../../common/enums';

export class CreateRuleDto {
  @IsString() @MaxLength(120) code: string;
  @IsString() @MaxLength(180) name: string;
  @IsOptional() @IsString() description?: string;
  @IsEnum(RuleType) ruleType: RuleType;
  @IsEnum(RuleTargetType) targetType: RuleTargetType;
  @IsString() targetId: string;
  @IsEnum(RuleEffect) effect: RuleEffect;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1000) priority?: number;
  @IsOptional() expression?: Record<string, unknown>;
  @IsOptional() metadata?: Record<string, unknown>;
}

export class UpdateRuleDto {
  @IsOptional() @IsString() @MaxLength(180) name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(RuleType) ruleType?: RuleType;
  @IsOptional() @IsEnum(RuleTargetType) targetType?: RuleTargetType;
  @IsOptional() @IsString() targetId?: string;
  @IsOptional() @IsEnum(RuleEffect) effect?: RuleEffect;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1000) priority?: number;
  @IsOptional() expression?: Record<string, unknown>;
  @IsOptional() metadata?: Record<string, unknown>;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) rowVersion?: number;
}

export class RuleQueryDto {
  @IsOptional() @IsEnum(RuleType) ruleType?: RuleType;
  @IsOptional() @IsEnum(RuleTargetType) targetType?: RuleTargetType;
  @IsOptional() @IsEnum(RuleStatus) status?: RuleStatus;
  @IsOptional() @Type(() => Boolean) @IsBoolean() enabled?: boolean;
  @IsOptional() @IsString() search?: string;
}

export class SimulateRuleDto { context: Record<string, unknown>; }
export class CreateRuleTestCaseDto { @IsString() name: string; context: Record<string, unknown>; @IsBoolean() expectedMatch: boolean; @IsOptional() @IsString() expectedEffect?: string; }