import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, MaxLength, IsArray } from 'class-validator';
import { BmNavigationStatus, BmMenuLocation, BmMenuItemType, BmNavigationVisibility } from '../../../../generated/prisma/enums';

export class CreateMenuDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(BmMenuLocation)
  location?: BmMenuLocation;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateMenuItemDto {
  @IsOptional()
  @IsString()
  parentItemId?: string;

  @IsString()
  @MaxLength(100)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @IsEnum(BmMenuItemType)
  itemType: BmMenuItemType;

  @IsOptional()
  @IsString()
  routePath?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredCapabilities?: string[];

  @IsOptional()
  @IsString()
  capabilityOperator?: 'ANY' | 'ALL';

  @IsOptional()
  @IsEnum(BmNavigationVisibility)
  visibility?: BmNavigationVisibility;

  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @IsOptional()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  version?: string;
}

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  routePath?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredCapabilities?: string[];

  @IsOptional()
  @IsString()
  capabilityOperator?: 'ANY' | 'ALL';

  @IsOptional()
  @IsEnum(BmNavigationVisibility)
  visibility?: BmNavigationVisibility;

  @IsOptional()
  @IsInt()
  orderIndex?: number;

  @IsOptional()
  configuration?: Record<string, unknown>;
}

export class ResolveNavigationDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  capabilities?: string[];
}
