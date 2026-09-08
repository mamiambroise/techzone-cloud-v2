import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateWarehouseDto {
  @ApiProperty({ description: 'Reference', example: 'ENT-001' })
  @IsString()
  @IsOptional()
  ref?: string;

  @ApiProperty({ description: 'Nom de lentrepot', example: 'Entrepot central' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({ description: 'Ville', example: 'Antananarivo' })
  @IsString()
  @IsOptional()
  ville?: string;

  @ApiPropertyOptional({ description: 'Adresse', example: 'Zone industrielle' })
  @IsString()
  @IsOptional()
  adresse?: string;

  @ApiPropertyOptional({ description: 'Capacite', example: 1000 })
  @IsNumber()
  @IsOptional()
  capacite?: number;

  @ApiPropertyOptional({ description: 'Utilisation', example: 400 })
  @IsNumber()
  @IsOptional()
  utilisation?: number;
}
