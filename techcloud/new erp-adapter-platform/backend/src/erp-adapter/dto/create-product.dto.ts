import { IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ description: 'Reference du produit', example: 'PRD-001' })
  @IsString()
  @IsNotEmpty()
  ref: string;

  @ApiProperty({ description: 'Libelle du produit', example: 'Ordinateur portable' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Prix du produit', example: 999.99 })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiPropertyOptional({ description: 'Stock disponible', example: 50 })
  @IsNumber()
  @IsOptional()
  stock?: number;
}
