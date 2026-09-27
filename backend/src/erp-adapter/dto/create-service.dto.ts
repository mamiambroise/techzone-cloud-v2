import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiPropertyOptional({ description: 'Reference', example: 'SRV-001' })
  @IsString()
  @IsOptional()
  ref?: string;

  @ApiProperty({ description: 'Libelle', example: 'Installation reseau' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Prix', example: 150.0 })
  @IsNumber()
  price: number;

  @ApiPropertyOptional({ description: 'Duree en minutes', example: 60 })
  @IsNumber()
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({ description: 'Description', example: 'Installation et configuration' })
  @IsString()
  @IsOptional()
  description?: string;
}
