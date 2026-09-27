import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Reference du fournisseur', example: 'FRS-001' })
  @IsString()
  @IsOptional()
  ref?: string;

  @ApiProperty({ description: 'Nom du fournisseur', example: 'Fournisseur Nord' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiPropertyOptional({ description: 'Email', example: 'contact@fournisseur.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'Telephone', example: '+261 20 22 000 00' })
  @IsString()
  @IsOptional()
  telephone?: string;

  @ApiPropertyOptional({ description: 'Adresse', example: 'Lot II A 12 Antananarivo' })
  @IsString()
  @IsOptional()
  adresse?: string;

  @ApiPropertyOptional({ description: 'Ville', example: 'Antananarivo' })
  @IsString()
  @IsOptional()
  ville?: string;
}
