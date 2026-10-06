import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DuplicateApplicationDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  /**
   * Copie également la définition métier (entités, champs, relations,
   * fonctionnalités, navigation) de la version source vers la version dupliquée.
   * Par défaut la définition est copiée : dupliquer une application doit
   * produire un point de départ réellement exploitable.
   */
  @IsOptional()
  copyDefinition?: boolean;
}