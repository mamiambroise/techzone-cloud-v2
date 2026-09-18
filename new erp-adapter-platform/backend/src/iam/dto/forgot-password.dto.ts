import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  identifier: string;
}