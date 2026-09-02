import { IsNotEmpty, IsObject, IsString, MaxLength } from 'class-validator';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  contractCode: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  contractVersion: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ownerTeam: string;

  @IsObject()
  schema: Record<string, unknown>;

  @IsObject()
  compatibilityPolicy: Record<string, unknown>;
}
