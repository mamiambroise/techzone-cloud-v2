import {
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
  SynchronizationDirection,
  SynchronizationMode,
  SynchronizationStatus,
} from '../../../../generated/prisma/enums';

export class CreateSynchronizationDto {
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  code: string;

  @IsString()
  connectorId: string;

  @IsString()
  @MaxLength(255)
  source: string;

  @IsString()
  @MaxLength(255)
  target: string;

  @IsEnum(SynchronizationDirection)
  direction: SynchronizationDirection;

  @IsEnum(SynchronizationMode)
  mode: SynchronizationMode;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  schedule?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mappingRef?: string;

  @IsOptional()
  @IsObject()
  conflictPolicy?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  batchSize?: number;
}

export class UpdateSynchronizationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  source?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  target?: string;

  @IsOptional()
  @IsEnum(SynchronizationDirection)
  direction?: SynchronizationDirection;

  @IsOptional()
  @IsEnum(SynchronizationMode)
  mode?: SynchronizationMode;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  schedule?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  mappingRef?: string;

  @IsOptional()
  @IsObject()
  conflictPolicy?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  batchSize?: number;

  @IsOptional()
  @IsEnum(SynchronizationStatus)
  status?: SynchronizationStatus;
}

export interface SyncPipelineResult {
  traceId: string;
  status: SynchronizationStatus;
  read: number;
  written: number;
  conflicts: number;
  checkpoints: number;
  duration: number;
  error?: string;
  errorCode?: string;
}

export interface SyncCheckpoint {
  step: string;
  position: number;
  timestamp: Date;
  data: Record<string, unknown>;
}
