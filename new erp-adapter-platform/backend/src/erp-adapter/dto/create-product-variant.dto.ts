import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductVariantDto {
  @ApiProperty({ description: 'ID du produit parent', example: 'prod-1' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Reference', example: 'PRD-001-40' })
  @IsString()
  @IsNotEmpty()
  ref: string;

  @ApiProperty({ description: 'Attribut', example: 'pointure' })
  @IsString()
  @IsNotEmpty()
  attribute: string;

  @ApiProperty({ description: 'Valeur', example: '40' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({ description: 'Prix', example: 49.99 })
  @IsNumber()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Stock', example: 12 })
  @IsNumber()
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({ description: 'Code-barres', example: '3760212345678' })
  @IsString()
  @IsOptional()
  barcode?: string;
}
