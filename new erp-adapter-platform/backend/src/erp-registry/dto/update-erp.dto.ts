import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateErpDto {
  @ApiPropertyOptional({ description: 'Nom de l\'ERP' })
  @IsString()
  @IsOptional()
  nom?: string;

  @ApiPropertyOptional({ description: 'Type d\'ERP' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'URL de connexion' })
  @IsString()
  @IsOptional()
  url?: string;

  @ApiPropertyOptional({ description: 'Statut de l\'ERP' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Environnement' })
  @IsString()
  @IsOptional()
  environment?: string;
}
