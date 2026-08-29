import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ApplicationStatus } from '../../../../common/enums';

export class TransitionDto {
  @ApiProperty({
    enum: ApplicationStatus,
    description: 'Statut cible',
    example: ApplicationStatus.READY,
  })
  @IsNotEmpty()
  @IsEnum(ApplicationStatus)
  targetStatus: ApplicationStatus;

  @ApiProperty({
    description: 'ID de l\'acteur (optionnel, sera extrait du token)',
    required: false,
  })
  actorId?: string;
}