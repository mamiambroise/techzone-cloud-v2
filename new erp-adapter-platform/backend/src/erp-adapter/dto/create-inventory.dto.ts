import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInventoryDto {
  @ApiProperty({ description: 'Libelle', example: 'Inventaire mensuel' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Type', enum: ['PARTIEL', 'GLOBAL'] })
  @IsIn(['PARTIEL', 'GLOBAL'])
  type: 'PARTIEL' | 'GLOBAL';
}
