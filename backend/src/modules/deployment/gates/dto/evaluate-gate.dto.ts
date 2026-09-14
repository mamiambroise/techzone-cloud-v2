import { IsOptional, IsString } from 'class-validator';

export class EvaluateGateDto {
  @IsOptional()
  @IsString()
  actor?: string;
}
