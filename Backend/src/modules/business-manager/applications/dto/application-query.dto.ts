import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../../../common/dto/pagination.dto';
import { ApplicationStatus } from '../../../../common/enums';

export class ApplicationQueryDto extends PaginationDto {
  @ApiProperty({
    enum: ApplicationStatus,
    description: 'Filtrer par statut',
    required: false,
  })
  @IsOptional()
  @IsIn(Object.values(ApplicationStatus))
  status?: ApplicationStatus;

  @ApiProperty({
    example: 'commerce',
    description: 'Filtrer par catégorie',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    example: 'PRODUCTION',
    description: 'Filtrer par environnement',
    required: false,
  })
  @IsOptional()
  @IsString()
  environment?: string;
}