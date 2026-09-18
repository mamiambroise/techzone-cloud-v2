import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ description: 'Reference', example: 'DOC-001' })
  @IsString()
  @IsOptional()
  ref?: string;

  @ApiProperty({ description: 'Type de document', example: 'FACTURE' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Titre', example: 'Contrat de maintenance' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Element lie', example: 'inv-1' })
  @IsString()
  @IsOptional()
  relatedTo?: string;

  @ApiPropertyOptional({ description: 'Taille en octets', example: 204800 })
  @IsNumber()
  @IsOptional()
  size?: number;
}
