import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ApproveReleaseDto {
  @IsString()
  @IsNotEmpty()
  approvedBy: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
