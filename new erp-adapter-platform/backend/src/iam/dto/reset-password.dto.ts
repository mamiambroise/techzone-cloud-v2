import { IsString, IsNotEmpty, Length } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @Length(10, 128)
  newPassword: string;
}