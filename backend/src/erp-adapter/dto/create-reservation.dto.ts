import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReservationDto {
  @ApiProperty({ description: 'ID du client', example: 'client-1' })
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @ApiPropertyOptional({ description: 'Produits reserves', type: [String], example: ['prod-2'] })
  @IsArray()
  @IsOptional()
  productIds?: string[];

  @ApiProperty({ description: 'Debut', example: '2026-06-05T10:00:00Z' })
  @IsString()
  @IsNotEmpty()
  startAt: string;

  @ApiProperty({ description: 'Fin', example: '2026-06-07T10:00:00Z' })
  @IsString()
  @IsNotEmpty()
  endAt: string;
}
