import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ReturnLineDto {
  @ApiProperty({ description: 'ID du produit', example: 'prod-1' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantite', example: 1 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Montant', example: 49.99 })
  @IsNumber()
  amount: number;
}

export class CreateReturnDto {
  @ApiProperty({ description: 'ID de la commande', example: 'order-3' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'ID du client', example: 'client-3' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'Motif', example: 'Article defectueux' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Type', enum: ['RETOUR', 'ECHANGE'] })
  @IsIn(['RETOUR', 'ECHANGE'])
  type: 'RETOUR' | 'ECHANGE';

  @ApiProperty({ description: 'Lignes du retour', type: [ReturnLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnLineDto)
  lines: ReturnLineDto[];
}
