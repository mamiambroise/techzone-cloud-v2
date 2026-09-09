import { IsOptional, IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../../../common/dto/pagination.dto';

export class ActivityQueryDto extends PaginationDto {
  @ApiProperty({
    description: 'Filtrer par type d\'événement',
    example: 'application.published',
    required: false,
  })
  @IsOptional()
  @IsString()
  eventType?: string;

  @ApiProperty({
    description: 'Filtrer par acteur (ID utilisateur)',
    example: 'user-uuid',
    required: false,
  })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiProperty({
    description: 'Date de début (ISO 8601)',
    example: '2026-08-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Date de fin (ISO 8601)',
    example: '2026-08-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}