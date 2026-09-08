import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCashRegisterDto {
  @ApiProperty({ description: 'Libelle', example: 'Caisse Box 23' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Fond de caisse', example: 200000 })
  @IsNumber()
  @Min(0)
  openingCash: number;
}
