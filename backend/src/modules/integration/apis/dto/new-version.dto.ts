import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class NewApiVersionDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/, {
    message: 'version must follow semver format (e.g. 2.0.0)',
  })
  newVersion!: string;

  @IsOptional()
  @IsBoolean()
  hasBreakingChanges?: boolean;

  @IsOptional()
  @IsString()
  changelog?: string;
}
