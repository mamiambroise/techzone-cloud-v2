import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiPropertyOptional({ description: 'Reference', example: 'PROJ-001' })
  @IsString()
  @IsOptional()
  ref?: string;

  @ApiProperty({ description: 'Libelle', example: 'Amenagement Box 23' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiPropertyOptional({ description: 'ID du client', example: 'client-1' })
  @IsString()
  @IsOptional()
  clientId?: string;

  @ApiPropertyOptional({ description: 'Statut', example: 'EN_COURS' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Date de debut', example: '2026-06-10' })
  @IsString()
  @IsOptional()
  startDate?: string;
}
