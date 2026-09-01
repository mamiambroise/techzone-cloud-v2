import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Environment } from '../../../../common/enums';

export class PublishDto {
  @ApiProperty({
    enum: Environment,
    default: Environment.PRODUCTION,
    description: 'Environnement de publication',
    required: false,
  })
  @IsOptional()
  @IsEnum(Environment)
  environment?: Environment = Environment.PRODUCTION;
}