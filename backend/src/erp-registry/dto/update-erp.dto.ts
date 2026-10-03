import { IsString, IsOptional, MaxLength, IsInt, Min, Max, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateErpDto {
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  apiKey?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  entity?: number;
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
  @IsIn(['ACTIVE', 'INACTIVE', 'active', 'inactive', 'DISABLED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Environnement' })
  @IsString()
  @IsOptional()
  environment?: string;
}
