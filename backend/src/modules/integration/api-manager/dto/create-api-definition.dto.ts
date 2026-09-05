import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  ApiAuthenticationType,
} from '../../../../generated/prisma/enums';

export class CreateApiDefinitionDto {
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  apiCode: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  version: string;

  @IsString()
  @MaxLength(255)
  basePath: string;

  @IsObject()
  operations: Record<string, unknown>;

  @IsEnum(ApiAuthenticationType)
  authentication: ApiAuthenticationType;

  @IsOptional()
  @IsObject()
  authorization?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  rateLimit?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  requestSchema?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  responseSchema?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  timeoutMs?: number;

  @IsOptional()
  @IsBoolean()
  corsEnabled?: boolean;
}

export class UpdateApiDefinitionDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  basePath?: string;

  @IsOptional()
  @IsObject()
  operations?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(ApiAuthenticationType)
  authentication?: ApiAuthenticationType;

  @IsOptional()
  @IsObject()
  authorization?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  rateLimit?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  requestSchema?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  responseSchema?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  timeoutMs?: number;

  @IsOptional()
  @IsBoolean()
  corsEnabled?: boolean;
}

export class CreateApiVersionDto {
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  apiCode: string;

  @IsString()
  @MaxLength(50)
  @IsNotEmpty()
  version: string;

  @IsString()
  @MaxLength(255)
  basePath: string;

  @IsObject()
  operations: Record<string, unknown>;

  @IsEnum(ApiAuthenticationType)
  authentication: ApiAuthenticationType;

  @IsOptional()
  @IsObject()
  authorization?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  rateLimit?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  requestSchema?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  responseSchema?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  corsEnabled?: boolean;

  @IsOptional()
  @IsString()
  breakingChangeReason?: string;
}

export interface PaginatedApiResponse {
  data: unknown[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ApiVersionLifecycle = {
  DRAFT: 'DRAFT',
  VALIDATING: 'VALIDATING',
  READY: 'READY',
  ACTIVE: 'ACTIVE',
  DEPRECATED: 'DEPRECATED',
  RETIRED: 'RETIRED',
} as const;

export type ApiVersionLifecycleStatus =
  (typeof ApiVersionLifecycle)[keyof typeof ApiVersionLifecycle];
