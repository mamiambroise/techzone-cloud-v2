import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAgendaEventDto {
  @ApiProperty({ description: 'Titre', example: 'Reunion fournisseur' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Debut', example: '2026-06-08T09:00:00Z' })
  @IsString()
  @IsNotEmpty()
  startAt: string;

  @ApiProperty({ description: 'Fin', example: '2026-06-08T10:00:00Z' })
  @IsString()
  @IsNotEmpty()
  endAt: string;

  @ApiProperty({ description: 'Type', example: 'REUNION' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'Element lie', example: 'client-1' })
  @IsString()
  @IsOptional()
  relatedTo?: string;
}
