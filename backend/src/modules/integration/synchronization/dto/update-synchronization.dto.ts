import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  SynchronizationDirectionEnum,
  SynchronizationModeEnum,
} from './create-synchronization.dto';

export class UpdateSynchronizationDto {
  @IsOptional()
  @IsString()
  source?: string;

  @IsOptional()
  @IsString()
  target?: string;

  @IsOptional()
  @IsEnum(SynchronizationDirectionEnum)
  direction?: SynchronizationDirectionEnum;

  @IsOptional()
  @IsEnum(SynchronizationModeEnum)
  mode?: SynchronizationModeEnum;

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
