import { IsString, IsNotEmpty, IsOptional, MaxLength, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateErpDto {
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  apiKey?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2147483647)
  entity?: number;
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
