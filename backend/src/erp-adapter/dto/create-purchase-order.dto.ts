import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PurchaseOrderLineDto {
  @ApiProperty({ description: 'ID du produit', example: 'prod-2' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Quantite', example: 50 })
  @IsNumber()
  @IsPositive()
  quantity: number;

  @ApiProperty({ description: 'Prix unitaire', example: 12.0 })
  @IsNumber()
  @IsPositive()
  price: number;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'ID du fournisseur', example: 'sup-1' })
  @IsString()
  @IsNotEmpty()
  supplierId: string;

  @ApiProperty({ description: 'Lignes', type: [PurchaseOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderLineDto)
  lines: PurchaseOrderLineDto[];
}
