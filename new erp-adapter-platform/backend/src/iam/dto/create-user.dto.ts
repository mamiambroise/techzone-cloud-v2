import {
  IsAlphanumeric,
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateUserDto {
  @IsAlphanumeric()
  @Length(3, 32)
  username: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsString()
  @Length(10, 128)
  password: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'PENDING', 'SUSPENDED'])
  status?: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}