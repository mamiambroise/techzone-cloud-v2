import { IsOptional, IsString } from 'class-validator';

export class VerifyDeploymentDto {
  @IsOptional()
  @IsString()
  verifiedBy?: string;
}
