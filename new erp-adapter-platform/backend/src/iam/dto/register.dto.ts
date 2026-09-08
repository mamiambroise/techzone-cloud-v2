import { IsAlphanumeric, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsAlphanumeric()
  @Length(3, 32)
  username: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @Length(10, 128)
  password: string;
}