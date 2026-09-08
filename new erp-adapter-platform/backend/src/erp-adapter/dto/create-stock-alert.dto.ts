import { IsString, IsNotEmpty, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStockAlertDto {
  @ApiProperty({ description: 'ID du produit', example: 'prod-4' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Niveau', enum: ['LOW', 'OUT', 'CRITICAL'] })
  @IsIn(['LOW', 'OUT', 'CRITICAL'])
  level: 'LOW' | 'OUT' | 'CRITICAL';

  @ApiProperty({ description: 'Stock actuel', example: 3 })
  @IsNumber()
  current: number;

  @ApiProperty({ description: 'Seuil', example: 10 })
  @IsNumber()
  threshold: number;
}
