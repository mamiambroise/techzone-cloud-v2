import { IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 120)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @IsOptional()
  @IsString()
  @Length(1, 40)
  phone?: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  displayName?: string;

  @IsOptional()
  @IsString()
  @Length(2, 10)
  locale?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  timezone?: string;
}
