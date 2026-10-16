import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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
  idempotencyKey?: string;

  /**
   * Deprecated compatibility field. The server records the authenticated
   * principal as the deployment actor and never trusts this body value.
   */
  @IsOptional()
  @IsString()
  startedBy?: string;
}
