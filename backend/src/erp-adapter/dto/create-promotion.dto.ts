import { IsString, IsNotEmpty, IsNumber, IsIn, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromotionDto {
  @ApiProperty({ description: 'Libelle', example: 'Promo ete' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Type', enum: ['PERCENTAGE', 'FIXE', 'BUY_X_GET_Y'] })
  @IsIn(['PERCENTAGE', 'FIXE', 'BUY_X_GET_Y'])
  type: 'PERCENTAGE' | 'FIXE' | 'BUY_X_GET_Y';

  @ApiProperty({ description: 'Valeur', example: 20 })
  @IsNumber()
  value: number;

  @ApiProperty({ description: 'Applique a', example: 'PRODUIT' })
  @IsString()
  @IsNotEmpty()
  appliesTo: string;

  @ApiPropertyOptional({ description: 'Produits concernes', type: [String] })
  @IsArray()
  @IsOptional()
  productIds?: string[];

  @ApiProperty({ description: 'Date de debut', example: '2026-06-01' })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Date de fin', example: '2026-06-30' })
  @IsString()
  @IsNotEmpty()
  endDate: string;
}
