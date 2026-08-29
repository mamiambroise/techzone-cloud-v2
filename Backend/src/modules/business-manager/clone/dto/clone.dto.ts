import { IsString, IsNotEmpty, IsOptional, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CloneDto {
  @ApiProperty({
    example: 'boutique-premium',
    description: 'Code unique pour le clone',
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
    example: 'Boutique Premium',
    description: 'Nom du clone',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 'Version premium de la boutique',
    description: 'Description du clone',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'commerce-premium',
    description: 'Catégorie du clone',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    example: 'premium-bag',
    description: 'Icône du clone',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;
}