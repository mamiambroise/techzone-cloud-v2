import { IsUUID, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Environment } from '../../../../common/enums';

export class RollbackDto {
  @ApiProperty({
    example: 'version-uuid',
    description: 'ID de la version cible',
  })
  @IsUUID()
  versionId: string;

  @ApiProperty({
    enum: Environment,
    default: Environment.PRODUCTION,
    description: 'Environnement',
    required: false,
  })
  @IsOptional()
  @IsEnum(Environment)
  environment?: Environment = Environment.PRODUCTION;
}