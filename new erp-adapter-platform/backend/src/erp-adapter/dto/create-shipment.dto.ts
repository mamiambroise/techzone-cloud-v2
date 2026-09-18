import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShipmentDto {
  @ApiProperty({ description: 'ID de la commande', example: 'order-1' })
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @ApiProperty({ description: 'Transporteur', example: 'DHL Express' })
  @IsString()
  @IsNotEmpty()
  carrier: string;

  @ApiPropertyOptional({ description: 'Statut', example: 'PREPARATION' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Numero de suivi', example: 'JD01-2345-6789' })
  @IsString()
  @IsOptional()
  trackingNumber?: string;
}
