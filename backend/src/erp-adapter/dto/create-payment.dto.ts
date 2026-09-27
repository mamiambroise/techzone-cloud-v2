import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID de la facture', example: 'inv-1' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ description: 'Montant du paiement', example: 499.99 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ description: 'Mode de paiement', example: 'CB' })
  @IsString()
  @IsNotEmpty()
  method: string;

  @ApiPropertyOptional({ description: 'Statut', example: 'EFFECTUE' })
  @IsString()
  @IsOptional()
  status?: string;
}
