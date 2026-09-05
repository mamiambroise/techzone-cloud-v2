import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveGateDto {
  @IsString()
  @IsNotEmpty()
  approvedBy: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
