import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RotateCredentialDto {
  @IsNotEmpty()
  @IsString()
  newSecretValue!: string;

  @IsOptional()
  @IsDateString()
  newExpiresAt?: string;

  @IsOptional()
  reason?: string;
}
