import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class QuoteLineDto {
  @ApiProperty({ description: 'ID du produit', example: 'prod-1' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Libelle', example: 'Ordinateur portable' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ description: 'Quantite', example: 2 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Prix unitaire', example: 999.99 })
  @IsNumber()
  price: number;
}

export class CreateQuoteDto {
  @ApiProperty({ description: 'ID du client', example: 'client-1' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'Lignes du devis', type: [QuoteLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines: QuoteLineDto[];

  @ApiPropertyOptional({ description: 'Statut', example: 'EN_ATTENTE' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Date de validite', example: '2026-12-31' })
  @IsString()
  @IsOptional()
  validUntil?: string;
}
