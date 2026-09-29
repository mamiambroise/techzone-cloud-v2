import { IsOptional, IsString, IsEnum, IsInt, IsObject, IsArray, MaxLength, IsBoolean } from 'class-validator';
import { BmqSeverity, BmqStatus, BmqGateResult } from '../../../../generated/prisma/enums';

export class RunQualityValidationDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  profileCodes?: string[];

  @IsOptional()
  @IsString()
  trigger?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;
}

export class CreateQualityRuleDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(BmqSeverity)
  severity: BmqSeverity;

  @IsEnum(BmqStatus)
  defaultStatus: BmqStatus;

  @IsOptional()
  @IsObject()
  definition?: Record<string, unknown>;
}

export class CreateQualityGateDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  blockOnFailure?: boolean;

  @IsOptional()
  rules?: Record<string, unknown>;
}

export class CreateTestResultDto {
  @IsString()
  @MaxLength(100)
  suiteCode: string;

  @IsString()
  @MaxLength(100)
  testCaseCode: string;

  @IsEnum(BmqStatus)
  status: BmqStatus;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsInt()
  durationMs?: number;

  @IsOptional()
  @IsObject()
  details?: Record<string, unknown>;
}
