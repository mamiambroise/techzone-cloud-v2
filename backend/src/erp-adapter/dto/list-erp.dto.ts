import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class ListErpDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000)
  page?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number;
}
