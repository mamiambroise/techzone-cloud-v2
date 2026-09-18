// DATA-CDC-05 : Validation Contract

import { CanonicalFieldType } from './data-runtime.contract';

export interface FieldValidationRule {
  field: string;
  type: CanonicalFieldType;
  required?: boolean;
  nullable?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  enumValues?: string[];
  min?: number;
  max?: number;
  format?: string;
}

export interface ResourceValidationSchema {
  resource: string;
  fields: FieldValidationRule[];
  version: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
  value?: any;
}

export type FieldSecurityLevel = 'READABLE' | 'WRITABLE' | 'HIDDEN' | 'MASKED' | 'FORBIDDEN';

export interface FieldSecurityRule {
  field: string;
  level: FieldSecurityLevel;
  roles?: string[];
}

export interface ResourceSecurityPolicy {
  resource: string;
  fieldRules: FieldSecurityRule[];
  operations: {
    read?: string[];
    create?: string[];
    update?: string[];
    delete?: string[];
  };
}
