import { IsString, IsNotEmpty, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStockMovementDto {
  @ApiProperty({ description: 'ID du produit', example: 'prod-1' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Type de mouvement', enum: ['ENTREE', 'SORTIE', 'TRANSFERT', 'AJUSTEMENT', 'RETOUR', 'INVENTAIRE'] })
  @IsIn(['ENTREE', 'SORTIE', 'TRANSFERT', 'AJUSTEMENT', 'RETOUR', 'INVENTAIRE'])
  type: 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'AJUSTEMENT' | 'RETOUR' | 'INVENTAIRE';

  @ApiProperty({ description: 'Quantite', example: 5 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Motif', example: 'Reception de commande' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
