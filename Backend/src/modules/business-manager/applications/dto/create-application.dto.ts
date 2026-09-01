import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({
    example: 'boutique',
    description: 'Code unique de l\'application',
    pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Code must contain only lowercase letters, numbers, and hyphens',
  })
  code: string;

  @ApiProperty({
    example: 'Boutique Mode & Chaussures',
    description: 'Nom de l\'application',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'Application de gestion de boutique de mode',
    description: 'Description de l\'application',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'commerce',
    description: 'Catégorie métier',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    example: 'shopping-bag',
    description: 'Icône de l\'application',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiProperty({
    example: 'user-uuid',
    description: 'ID de l\'utilisateur créateur',
  })
  @IsUUID()
  createdBy: string;
}