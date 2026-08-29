import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateApplicationDto {
  @ApiProperty({
    example: 'Boutique Premium',
    description: 'Nouveau nom de l\'application',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiProperty({
    example: 'Application de gestion de boutique premium',
    description: 'Nouvelle description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 'commerce-premium',
    description: 'Nouvelle catégorie',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiProperty({
    example: 'premium-bag',
    description: 'Nouvelle icône',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;
}