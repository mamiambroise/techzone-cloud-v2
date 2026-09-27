import { IsString, IsNotEmpty, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStockTransferDto {
  @ApiProperty({ description: 'ID du produit', example: 'prod-1' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantite', example: 10 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: 'Entrepot source', example: 'wh-1' })
  @IsString()
  @IsNotEmpty()
  fromWarehouseId: string;

  @ApiProperty({ description: 'Entrepot destination', example: 'wh-2' })
  @IsString()
  @IsNotEmpty()
  toWarehouseId: string;
}
