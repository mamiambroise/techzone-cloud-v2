import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsBoolean, IsInt, IsUUID, MaxLength, IsArray, IsObject } from 'class-validator';
import { BmEntityStatus, BmDataScope, BmDataClassification, BmDataTypeCode, BmRelationType } from '../../../../generated/prisma/enums';

export class CreateEntityDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  pluralName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  icon?: string;

  @IsOptional()
  @IsEnum(BmDataScope)
  scope?: BmDataScope;

  @IsOptional()
  @IsEnum(BmDataClassification)
  classification?: BmDataClassification;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateFieldDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(BmDataTypeCode)
  type: BmDataTypeCode;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @IsOptional()
  @IsBoolean()
  readonly?: boolean;

  @IsOptional()
  @IsBoolean()
  indexed?: boolean;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  @IsOptional()
  @IsInt()
  position?: number;

  @IsOptional()
  @IsEnum(BmDataScope)
  scope?: BmDataScope;

  @IsOptional()
  @IsEnum(BmDataClassification)
  classification?: BmDataClassification;

  @IsOptional()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateRelationDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  sourceEntityId: string;

  @IsString()
  targetEntityId: string;

  /**
   * Cardinalité de la relation. Absente, la relation est un ONE_TO_MANY
   * (défaut du modèle). Les autres valeurs existent déjà dans le schéma
   * (`BmRelationType`) et doivent rester atteignables depuis l'UI.
   */
  @IsOptional()
  @IsEnum(BmRelationType)
  relationType?: BmRelationType;

  @IsOptional()
  @IsString()
  sourceLabel?: string;

  @IsOptional()
  @IsString()
  targetLabel?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  deleteBehavior?: 'RESTRICT' | 'CASCADE' | 'SET_NULL';

  @IsOptional()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateConstraintDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsOptional()
  @IsUUID()
  fieldId?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsObject()
  definition?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateIndexDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  indexType?: 'SIMPLE' | 'UNIQUE' | 'COMPOSITE';

  @IsOptional()
  @IsBoolean()
  unique?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fieldIds?: string[];

  @IsOptional()
  definition?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateFieldValidationDto {
  @IsString()
  fieldId: string;

  @IsString()
  validationType: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  version?: string;
}

export class CreateComputedFieldDto {
  @IsString()
  @MaxLength(100)
  code: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  expression?: string;

  @IsOptional()
  @IsString()
  targetFieldCode?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  configuration?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  version?: string;
}

export class UpdateEntityDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  pluralName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsEnum(BmDataScope)
  scope?: BmDataScope;

  @IsOptional()
  @IsEnum(BmDataClassification)
  classification?: BmDataClassification;
}

export class UpdateFieldDto extends PartialType(CreateFieldDto) {}
