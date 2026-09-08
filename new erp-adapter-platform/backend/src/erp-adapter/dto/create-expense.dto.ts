import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExpenseDto {
  @ApiProperty({ description: 'Libelle', example: 'Loyer Box 23' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Montant', example: 150000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Categorie', example: 'LOYER' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ description: 'ID du fournisseur', example: 'sup-1' })
  @IsString()
  @IsOptional()
  supplierId?: string;
}
