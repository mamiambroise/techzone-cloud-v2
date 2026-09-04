import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export enum SynchronizationDirectionEnum {
  PULL = 'PULL',
  PUSH = 'PUSH',
  BIDIRECTIONAL = 'BIDIRECTIONAL',
}

export enum SynchronizationModeEnum {
  FULL = 'FULL',
  INCREMENTAL = 'INCREMENTAL',
}

export class CreateSynchronizationDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'code must be lowercase alphanumeric with hyphens',
  })
  code!: string;

  @IsNotEmpty()
  @IsUUID()
  connectorId!: string;

  @IsNotEmpty()
  @IsString()
  source!: string;

  @IsNotEmpty()
  @IsString()
  target!: string;

  @IsNotEmpty()
  @IsEnum(SynchronizationDirectionEnum)
  direction!: SynchronizationDirectionEnum;

  @IsNotEmpty()
  @IsEnum(SynchronizationModeEnum)
  mode!: SynchronizationModeEnum;

  @IsOptional()
  @IsString()
  schedule?: string;

  @IsOptional()
  @IsString()
  mappingRef?: string;

  @IsOptional()
  conflictPolicy?: {
    strategy: 'SOURCE_WINS' | 'TARGET_WINS' | 'NEWEST_WINS' | 'MANUAL_REVIEW';
    fallback?: string;
  };

  @IsOptional()
  @IsInt()
  @Min(1)
  batchSize?: number;
}
