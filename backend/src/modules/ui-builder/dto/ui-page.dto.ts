/**
 * UI Builder — DTO (UI-BUILDER CDC V1 §4, §8, §9).
 *
 * Validation stricte : allowlist des types de pages, layouts, visibilités,
 * bindings, actions. Aucune expression libre, aucun JavaScript arbitraire.
 */
import {
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const UI_PAGE_TYPES = ['LIST', 'DETAIL', 'FORM', 'DASHBOARD', 'CUSTOM'] as const;
export const UI_PAGE_LAYOUTS = ['SIDEBAR', 'FULL_WIDTH', 'CENTERED'] as const;
export const UI_PAGE_VISIBILITIES = ['ALWAYS', 'TENANT_ADMIN_ONLY', 'HIDDEN'] as const;

/** Binding kinds allowlist (CDC §6). */
export const UI_BINDING_KINDS = ['STATIC', 'ENTITY_FIELD', 'ENTITY_LIST', 'CONTEXT', 'VARIABLE'] as const;
/** UI Action types allowlist (CDC §8) — fail-closed. */
export const UI_ACTION_TYPES = [
  'NAVIGATE',
  'REFRESH',
  'SET_VARIABLE',
  'SHOW_NOTIFICATION',
  'OPEN_MODAL',
  'CLOSE_MODAL',
  'TRIGGER_AUTOMATION',
  'CALL_API',
] as const;

export type UiBindingKind = (typeof UI_BINDING_KINDS)[number];
export type UiActionType = (typeof UI_ACTION_TYPES)[number];

const KEY_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ROUTE_RE = /^\/[a-zA-Z0-9_\-/:{}]*$/;

export class UiBindingDto {
  @IsIn(UI_BINDING_KINDS as unknown as string[])
  kind: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  value?: string | number | boolean | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  entity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  field?: string;

  @IsOptional()
  @IsIn(['currentUser', 'currentTenant', 'currentApplication'])
  context?: string;

  @IsOptional()
  @IsString()
  @Matches(KEY_RE)
  @MaxLength(100)
  variable?: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, unknown>;
}

export class UiActionDto {
  @IsIn(UI_ACTION_TYPES as unknown as string[])
  type: string;

  @IsOptional()
  @IsObject()
  config?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  permissions?: string[];
}

export class UiComponentNodeDto {
  @IsString()
  @Matches(/^[a-zA-Z0-9_\-]{1,64}$/)
  id: string;

  @IsString()
  @MaxLength(64)
  type: string;

  @IsOptional()
  @IsObject()
  props?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  bindings?: Record<string, UiBindingDto>;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  actions?: UiActionDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  children?: string[];

  @IsOptional()
  @IsObject()
  responsive?: Record<string, Record<string, unknown>>;
}

export class UiComponentsTreeDto {
  @IsString()
  @MaxLength(64)
  root: string;

  @IsObject()
  nodes: Record<string, UiComponentNodeDto>;
}

export class CreateUiPageDto {
  @IsUUID()
  applicationVersionId: string;

  @IsString()
  @Matches(KEY_RE)
  @MaxLength(100)
  key: string;

  @IsString()
  @Matches(ROUTE_RE)
  @MaxLength(200)
  route: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(UI_PAGE_TYPES as unknown as string[])
  type?: string;

  @IsOptional()
  @IsIn(UI_PAGE_LAYOUTS as unknown as string[])
  layout?: string;

  @IsOptional()
  @IsIn(UI_PAGE_VISIBILITIES as unknown as string[])
  visibility?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsObject()
  components?: UiComponentsTreeDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateUiPageDto {
  @IsOptional()
  @IsString()
  @Matches(KEY_RE)
  @MaxLength(100)
  key?: string;

  @IsOptional()
  @IsString()
  @Matches(ROUTE_RE)
  @MaxLength(200)
  route?: string;

  @IsOptional()
  @IsString()
  @Min(1)
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsIn(UI_PAGE_TYPES as unknown as string[])
  type?: string;

  @IsOptional()
  @IsIn(UI_PAGE_LAYOUTS as unknown as string[])
  layout?: string;

  @IsOptional()
  @IsIn(UI_PAGE_VISIBILITIES as unknown as string[])
  visibility?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsObject()
  components?: UiComponentsTreeDto;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class ReorderUiPagesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsUUID('4', { each: true })
  pageIds: string[];
}

export class UiThemeTokensDto {
  @IsOptional()
  @IsObject()
  colors?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  typography?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  spacing?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  radius?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  shadow?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  breakpoints?: Record<string, unknown>;
}

export class UpsertUiThemeDto {
  @IsUUID()
  applicationVersionId: string;

  @IsObject()
  tokens: UiThemeTokensDto;
}
