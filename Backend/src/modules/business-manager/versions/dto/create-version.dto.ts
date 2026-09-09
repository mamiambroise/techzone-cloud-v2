import { IsString, IsNotEmpty, IsOptional, IsUUID, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVersionDto {
  @ApiProperty({
    example: '1.1.0',
    description: 'Numéro de version (MAJOR.MINOR.PATCH)',
    pattern: '^\\d+\\.\\d+\\.\\d+$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'Version number must be in format MAJOR.MINOR.PATCH',
  })
  versionNumber: string;

  @ApiProperty({
    example: 'Ajout de la gestion des réservations',
    description: 'Commentaire sur la version',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    example: 'version-uuid',
    description: 'ID de la version source (optionnel)',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  sourceVersionId?: string;
}