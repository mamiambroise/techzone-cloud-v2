import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export enum DeploymentStrategy {
  STANDARD = 'STANDARD',
  ROLLING = 'ROLLING',
  BLUE_GREEN = 'BLUE_GREEN',
  CANARY = 'CANARY',
}

export class CreateDeploymentDto {
  @IsString()
  @IsNotEmpty()
  releaseId: string;

  @IsString()
  @IsNotEmpty()
  environmentId: string;

  @IsOptional()
  @IsEnum(DeploymentStrategy)
  strategy?: DeploymentStrategy = DeploymentStrategy.STANDARD;

  @IsOptional()
  @IsString()
  @MaxLength(113)
  idempotencyKey?: string;

  @IsString()
  @IsNotEmpty()
  startedBy: string;
}
