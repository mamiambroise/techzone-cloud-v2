import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class InvoiceLineDto {
  @ApiProperty({ description: 'ID du produit', example: 'prod-1' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Libelle', example: 'Souris sans fil' })
  @IsString()
  @IsOptional()
  label?: string;

  @ApiProperty({ description: 'Quantite', example: 5 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Prix unitaire', example: 29.99 })
  @IsNumber()
  price: number;
}

export class CreateInvoiceDto {
  @ApiProperty({ description: 'ID du client', example: 'client-2' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'Lignes de la facture', type: [InvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];

  @ApiPropertyOptional({ description: 'Statut', example: 'EN_ATTENTE' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Date d echeance', example: '2026-10-01' })
  @IsString()
  @IsOptional()
  dueDate?: string;
}
