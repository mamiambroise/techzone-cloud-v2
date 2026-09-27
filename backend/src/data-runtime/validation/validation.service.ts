// DATA-CDC-05 : Validation & Security

import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  RuntimeContext,
  CanonicalField,
  CanonicalFieldType,
} from '../interfaces';
import { ValidationResult, ValidationError } from '../interfaces/validation.contract';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private readonly schemas: Map<string, CanonicalField[]> = new Map();

  registerSchema(resource: string, fields: CanonicalField[]): void {
    this.schemas.set(resource, fields);
    this.logger.log(`Schema enregistre pour ${resource} (${fields.length} champs)`);
  }

  async validate(resource: string, data: Record<string, any>): Promise<ValidationResult> {
    const fields = this.schemas.get(resource);
    if (!fields) {
      return { valid: true, errors: [] };
    }

    const errors: ValidationError[] = [];

    for (const field of fields) {
      const value = data[field.code];

      // Required check
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field: field.code,
          code: 'REQUIRED',
          message: `Champ "${field.code}" est requis`,
          value,
        });
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      // Type check
      const typeError = this.checkType(field.code, field.type, value);
      if (typeError) {
        errors.push(typeError);
        continue;
      }

      // Enum check
      if (field.enumValues && !field.enumValues.includes(String(value))) {
        errors.push({
          field: field.code,
          code: 'INVALID_ENUM',
          message: `Valeur "{value}" invalide pour "${field.code}". Attendues: ${field.enumValues.join(', ')}`,
          value,
        });
      }

      // Max length
      if (field.maxLength !== undefined && String(value).length > field.maxLength) {
        errors.push({
          field: field.code,
          code: 'MAX_LENGTH',
          message: `Longueur max de "${field.code}" est ${field.maxLength}`,
          value,
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  checkPermission(ctx: RuntimeContext, requiredPermission: string): void {
    if (!ctx.permissions || ctx.permissions.length === 0) {
      throw new ForbiddenException('Aucune permission definie dans le contexte');
    }
    if (!ctx.permissions.includes('*') && !ctx.permissions.includes(requiredPermission)) {
      throw new ForbiddenException(`Permission "${requiredPermission}" requise`);
    }
  }

  checkTenant(ctx: RuntimeContext, resourceTenantId?: string): void {
    if (resourceTenantId && resourceTenantId !== ctx.tenantId) {
      throw new ForbiddenException('DATA_TENANT_VIOLATION: tentative d\'acces cross-tenant');
    }
  }

  private checkType(field: string, type: CanonicalFieldType, value: any): ValidationError | null {
    switch (type) {
      case 'STRING':
      case 'TEXT':
        if (typeof value !== 'string') {
          return this.typeError(field, 'string', value);
        }
        break;
      case 'INTEGER':
        if (!Number.isInteger(value)) {
          return this.typeError(field, 'integer', value);
        }
        break;
      case 'DECIMAL':
        if (typeof value !== 'number') {
          return this.typeError(field, 'decimal', value);
        }
        break;
      case 'BOOLEAN':
        if (typeof value !== 'boolean') {
          return this.typeError(field, 'boolean', value);
        }
        break;
      case 'DATE':
      case 'DATETIME':
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          return this.typeError(field, 'date', value);
        }
        break;
      case 'ENUM':
        if (typeof value !== 'string') {
          return this.typeError(field, 'enum', value);
        }
        break;
      case 'ARRAY':
        if (!Array.isArray(value)) {
          return this.typeError(field, 'array', value);
        }
        break;
      case 'OBJECT':
        if (typeof value !== 'object' || Array.isArray(value)) {
          return this.typeError(field, 'object', value);
        }
        break;
      case 'REFERENCE':
        if (typeof value !== 'string') {
          return this.typeError(field, 'reference', value);
        }
        break;
    }
    return null;
  }

  private typeError(field: string, expected: string, value: any): ValidationError {
    return {
      field,
      code: 'TYPE_MISMATCH',
      message: `Type invalide pour "${field}": attendu ${expected}, recu ${typeof value === 'object' ? value?.constructor?.name : typeof value}`,
      value,
    };
  }
}
