import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum RollbackTypeDto {
  MANUAL_ROLLBACK = 'MANUAL_ROLLBACK',
  AUTOMATIC_ROLLBACK = 'AUTOMATIC_ROLLBACK',
  REDEPLOY_PREVIOUS = 'REDEPLOY_PREVIOUS',
}

export class CreateRollbackDto {
  @IsOptional()
  @IsEnum(RollbackTypeDto)
  type?: RollbackTypeDto = RollbackTypeDto.MANUAL_ROLLBACK;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  toReleaseId?: string;

  @IsString()
  @IsNotEmpty()
  startedBy: string;
}
