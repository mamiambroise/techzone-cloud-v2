import { IsString, IsNotEmpty, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClientDto {
  @ApiProperty({ description: 'Nom du client', example: 'Jean Dupont' })
  @IsString()
  @IsNotEmpty()
  nom: string;

  @ApiProperty({ description: 'Email du client', example: 'jean@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ description: 'Telephone du client', example: '+261 34 00 000 00' })
  @IsString()
  @IsOptional()
  telephone?: string;
}
