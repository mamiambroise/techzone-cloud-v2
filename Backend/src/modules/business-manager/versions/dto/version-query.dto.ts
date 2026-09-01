import { IsOptional, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationVersionStatus } from '../../../../common/enums';

export class VersionQueryDto {
  @ApiProperty({
    enum: ApplicationVersionStatus,
    description: 'Filtrer par statut',
    required: false,
  })
  @IsOptional()
  @IsIn(Object.values(ApplicationVersionStatus))
  status?: ApplicationVersionStatus;
}