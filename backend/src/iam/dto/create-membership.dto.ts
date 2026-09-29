import { IsEnum, IsOptional, IsString, IsUUID, IsInt, Min } from 'class-validator';

export enum MembershipStatusDto {
  INVITED = 'INVITED',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REVOKED = 'REVOKED',
  EXPIRED = 'EXPIRED',
}

export class CreateMembershipDto {
  @IsUUID()
  userId: string;

  @IsEnum(MembershipStatusDto)
  status: string;

  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @IsOptional()
  @IsUUID()
  siteId?: string;

  @IsOptional()
  @IsString()
  validFrom?: string;

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  metadata?: Record<string, unknown>;
}
