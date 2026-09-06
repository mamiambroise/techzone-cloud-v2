import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LockEnvironmentDto {
  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  lockedBy?: string;
}
