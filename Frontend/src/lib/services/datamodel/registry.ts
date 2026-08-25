// P0.2 — Data Type Registry (central & extensible)

export interface DataTypeDefinition {
  code: string;
  label: string;
  category: "TEXT" | "NUMERIC" | "DATE" | "BOOLEAN" | "ENUM" | "FILE" | "STRUCTURED" | "RELATION" | "FORMULA";
  configurable: boolean;
  supportedValidations: string[];
  sortable: boolean;
  filterable: boolean;
  searchable: boolean;
  supportsDefault: boolean;
  supportsUnique: boolean;
  supportsIndex: boolean;
  numeric?: boolean;
}

const V_TEXT = ["REQUIRED", "MIN_LENGTH", "MAX_LENGTH", "REGEX"];
const V_NUM = ["REQUIRED", "MIN", "MAX"];
const V_ALL = ["REQUIRED"];

export const DATA_TYPES: DataTypeDefinition[] = [
  { code: "TEXT", label: "Texte", category: "TEXT", configurable: false, supportedValidations: V_TEXT, sortable: true, filterable: true, searchable: true, supportsDefault: true, supportsUnique: true, supportsIndex: true },
  { code: "LONG_TEXT", label: "Texte long", category: "TEXT", configurable: false, supportedValidations: ["REQUIRED", "MIN_LENGTH", "MAX_LENGTH"], sortable: false, filterable: false, searchable: true, supportsDefault: true, supportsUnique: false, supportsIndex: false },
  { code: "INTEGER", label: "Entier", category: "NUMERIC", configurable: false, supportedValidations: V_NUM, sortable: true, filterable: true, searchable: false, supportsDefault: true, supportsUnique: true, supportsIndex: true, numeric: true },
  { code: "BIG_INTEGER", label: "Grand entier", category: "NUMERIC", configurable: false, supportedValidations: V_NUM, sortable: true, filterable: true, searchable: false, supportsDefault: true, supportsUnique: true, supportsIndex: true, numeric: true },
  { code: "DECIMAL", label: "Décimal", category: "NUMERIC", configurable: true, supportedValidations: [...V_NUM, "PRECISION", "SCALE"], sortable: true, filterable: true, searchable: false, supportsDefault: true, supportsUnique: false, supportsIndex: true, numeric: true },
  { code: "CURRENCY", label: "Monnaie", category: "NUMERIC", configurable: true, supportedValidations: [...V_NUM, "PRECISION", "SCALE"], sortable: true, filterable: true, searchable: false, supportsDefault: true, supportsUnique: false, supportsIndex: true, numeric: true },
  { code: "PERCENTAGE", label: "Pourcentage", category: "NUMERIC", configurable: false, supportedValidations: V_NUM, sortable: true, filterable: true, searchable: false, supportsDefault: true, supportsUnique: false, supportsIndex: false, numeric: true },
  { code: "BOOLEAN", label: "Booléen", category: "BOOLEAN", configurable: false, supportedValidations: V_ALL, sortable: true, filterable: true, searchable: false, supportsDefault: true, supportsUnique: false, supportsIndex: true },
  { code: "DATE", label: "Date", category: "DATE", configurable: false, supportedValidations: ["REQUIRED", "MIN", "MAX"], sortable: true, filterable: true, searchable: false, supportsDefault: true, supportsUnique: false, supportsIndex: true },
  { code: "DATETIME", label: "Date & heure", category: "DATE", configurable: false, supportedValidations: ["REQUIRED", "MIN", "MAX"], sortable: true, filterable: true, searchable: false, supportsDefault: true, supportsUnique: false, supportsIndex: true },
  { code: "TIME", label: "Heure", category: "DATE", configurable: false, supportedValidations: ["REQUIRED"], sortable: true, filterable: true, searchable: false, supportsDefault: true, supportsUnique: false, supportsIndex: false },
  { code: "EMAIL", label: "Email", category: "TEXT", configurable: false, supportedValidations: [...V_TEXT, "EMAIL"], sortable: true, filterable: true, searchable: true, supportsDefault: true, supportsUnique: true, supportsIndex: true },
  { code: "PHONE", label: "Téléphone", category: "TEXT", configurable: false, supportedValidations: [...V_TEXT, "REGEX"], sortable: true, filterable: true, searchable: true, supportsDefault: true, supportsUnique: false, supportsIndex: true },
  { code: "URL", label: "URL", category: "TEXT", configurable: false, supportedValidations: [...V_TEXT, "URL"], sortable: true, filterable: true, searchable: true, supportsDefault: true, supportsUnique: false, supportsIndex: false },
  { code: "ENUM", label: "Énumération", category: "ENUM", configurable: true, supportedValidations: ["REQUIRED", "ALLOWED_VALUES"], sortable: true, filterable: true, searchable: true, supportsDefault: true, supportsUnique: false, supportsIndex: true },
  { code: "MULTI_ENUM", label: "Énumération multiple", category: "ENUM", configurable: true, supportedValidations: ["REQUIRED", "ALLOWED_VALUES"], sortable: false, filterable: true, searchable: true, supportsDefault: true, supportsUnique: false, supportsIndex: false },
  { code: "UUID", label: "UUID", category: "STRUCTURED", configurable: false, supportedValidations: ["REQUIRED"], sortable: true, filterable: true, searchable: false, supportsDefault: false, supportsUnique: true, supportsIndex: true },
  { code: "SEQUENCE", label: "Séquence", category: "STRUCTURED", configurable: true, supportedValidations: ["REQUIRED"], sortable: true, filterable: true, searchable: false, supportsDefault: false, supportsUnique: true, supportsIndex: true },
  { code: "FILE", label: "Fichier", category: "FILE", configurable: true, supportedValidations: ["REQUIRED"], sortable: false, filterable: false, searchable: false, supportsDefault: false, supportsUnique: false, supportsIndex: false },
  { code: "IMAGE", label: "Image", category: "FILE", configurable: true, supportedValidations: ["REQUIRED"], sortable: false, filterable: false, searchable: false, supportsDefault: false, supportsUnique: false, supportsIndex: false },
  { code: "JSON", label: "JSON", category: "STRUCTURED", configurable: false, supportedValidations: ["REQUIRED"], sortable: false, filterable: false, searchable: false, supportsDefault: true, supportsUnique: false, supportsIndex: false },
  { code: "RELATION", label: "Relation", category: "RELATION", configurable: true, supportedValidations: ["REQUIRED"], sortable: false, filterable: true, searchable: false, supportsDefault: false, supportsUnique: false, supportsIndex: true },
  { code: "FORMULA", label: "Champ calculé", category: "FORMULA", configurable: true, supportedValidations: [], sortable: true, filterable: true, searchable: false, supportsDefault: false, supportsUnique: false, supportsIndex: false },
];

export function getType(code: string): DataTypeDefinition | undefined {
  return DATA_TYPES.find((t) => t.code === code);
}

export function isNumericType(code: string): boolean {
  return !!getType(code)?.numeric;
}

export function isTypeValid(code: string): boolean {
  return !!getType(code);
}

export function checkDefaultValue(dataType: string, value: any, configuration: any): { ok: boolean; message?: string } {
  if (value === null || value === undefined || value === "") return { ok: true };
  const def = getType(dataType);
  if (!def) return { ok: false, message: `Type inconnu: ${dataType}` };
  switch (def.category) {
    case "NUMERIC":
      if (typeof value !== "number" || isNaN(value)) return { ok: false, message: "La valeur par défaut doit être numérique." };
      return { ok: true };
    case "BOOLEAN":
      if (typeof value !== "boolean") return { ok: false, message: "La valeur par défaut doit être un booléen." };
      return { ok: true };
    case "TEXT":
    case "DATE":
    case "STRUCTURED":
      if (typeof value !== "string") return { ok: false, message: "La valeur par défaut doit être une chaîne." };
      return { ok: true };
    case "ENUM": {
      const options = Array.isArray(configuration?.options) ? configuration.options.map((o: any) => o.value) : [];
      if (options.length > 0 && !options.includes(value)) {
        return { ok: false, message: `La valeur par défaut doit être une option de l'ENUM (${options.join(", ")}).` };
      }
      return { ok: true };
    }
    default:
      return { ok: true };
  }
}

export const SCOPES = ["GLOBAL", "ORGANIZATION", "SITE", "USER", "CONTEXT"];
export const CLASSIFICATIONS = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "SENSITIVE"];
export const RELATION_TYPES = ["ONE_TO_ONE", "ONE_TO_MANY", "MANY_TO_ONE", "MANY_TO_MANY"];
export const DELETE_BEHAVIORS = ["RESTRICT", "CASCADE", "SET_NULL"];
export const CONSTRAINT_TYPES = ["PRIMARY", "UNIQUE", "NOT_NULL", "VALUE_RANGE", "FORMAT", "COMPOSITE_UNIQUE", "RELATION", "DECLARATIVE_CUSTOM"];
export const INDEX_TYPES = ["SIMPLE", "UNIQUE", "COMPOSITE"];
export const VALIDATION_TYPES = ["REQUIRED", "MIN", "MAX", "MIN_LENGTH", "MAX_LENGTH", "REGEX", "EMAIL", "URL", "ALLOWED_VALUES", "PRECISION", "SCALE"];
