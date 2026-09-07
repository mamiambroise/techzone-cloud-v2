import { IsNotEmpty, IsString } from 'class-validator';

export class BypassGateDto {
  @IsString()
  @IsNotEmpty()
  bypassedBy: string;

  @IsString()
  @IsNotEmpty()
  justification: string;
}
