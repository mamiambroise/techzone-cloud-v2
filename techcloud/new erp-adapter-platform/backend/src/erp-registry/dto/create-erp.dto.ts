import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateErpDto {
  @ApiProperty({ description: 'Code unique de l\'ERP', example: 'SAP_B1' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Nom de l\'ERP', example: 'SAP Business One' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Type d\'ERP', example: 'ERP' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'URL de connexion', example: 'https://sap.example.com/api' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ description: 'Environnement', example: 'production' })
  @IsString()
  @IsOptional()
  environment?: string;
}
