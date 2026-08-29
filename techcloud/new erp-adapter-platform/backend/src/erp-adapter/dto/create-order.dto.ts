import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OrderLineDto {
  @ApiProperty({ description: 'ID du produit', example: 'prod-1' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantite', example: 2 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: 'Prix unitaire', example: 999.99 })
  @IsNumber()
  @IsPositive()
  price: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'ID du client', example: 'client-1' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiProperty({ description: 'Lignes de la commande', type: [OrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  lines: OrderLineDto[];
}
