export type ApplicationStatus =
  | "DRAFT"
  | "CONFIGURING"
  | "READY"
  | "TESTING"
  | "ACTIVE"
  | "SUSPENDED"
  | "ARCHIVED"
  | "ERROR";

export type Environment =
  | "DEVELOPMENT"
  | "TEST"
  | "STAGING"
  | "PRODUCTION";

export type ApplicationVersionStatus =
  | "DRAFT"
  | "READY"
  | "TESTING"
  | "PUBLISHED"
  | "SUPERSEDED"
  | "INVALID"
  | "ARCHIVED";

export type PublicationType = "PUBLISH" | "ROLLBACK";

export type PublicationStatus = "PENDING" | "SUCCESS" | "FAILED";

export type UserRole = "ADMIN" | "BUILDER" | "VIEWER";

export interface ApplicationModel {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  category?: string | null;
  icon?: string | null;
  status: ApplicationStatus;
  environment: Environment;
  currentVersionId?: string | null;
  publishedVersionId?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string | null;
  version: number;
  currentVersionNumber?: string | null;
  publishedVersionNumber?: string | null;
  versionsCount?: number;
}

export interface ApplicationVersionModel {
  id: string;
  applicationId: string;
  versionNumber: string;
  status: ApplicationVersionStatus;
  snapshot: Record<string, any>;
  comment?: string | null;
  createdBy: string;
  createdAt: string;
  validatedAt?: string | null;
  publishedAt?: string | null;
  version: number;
}

export interface PublicationModel {
  id: string;
  applicationId: string;
  versionId: string;
  environment: Environment;
  type: PublicationType;
  status: PublicationStatus;
  previousVersionId?: string | null;
  publishedBy: string;
  publishedAt: string;
  result?: Record<string, any> | null;
  versionNumber?: string;
  previousVersionNumber?: string;
}

export interface ActivityEventModel {
  id: string;
  applicationId?: string | null;
  actorId: string;
  eventType: string;
  action: string;
  targetType: string;
  targetId: string;
  result: "SUCCESS" | "FAILED" | "WARNING";
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  metadata?: Record<string, any> | null;
  traceId: string;
  createdAt: string;
  applicationName?: string;
  applicationCode?: string;
}

export type ValidationStatus = "PASS" | "WARNING" | "FAIL";

export interface ValidationCheck {
  code: string;
  name: string;
  status: ValidationStatus;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationResult {
  status: ValidationStatus;
  canPublish: boolean;
  validatedAt: string;
  checks: ValidationCheck[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
    total: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  } | null;
  meta: {
    trace_id: string;
    pagination?: PaginationMeta;
    [key: string]: any;
  };
}

export const ERROR_CODES = {
  APPLICATION_NOT_FOUND: "APPLICATION_NOT_FOUND",
  APPLICATION_CODE_ALREADY_EXISTS: "APPLICATION_CODE_ALREADY_EXISTS",
  APPLICATION_INVALID_CODE: "APPLICATION_INVALID_CODE",
  APPLICATION_INVALID_STATUS: "APPLICATION_INVALID_STATUS",
  APPLICATION_ARCHIVED: "APPLICATION_ARCHIVED",
  INVALID_STATUS_TRANSITION: "INVALID_STATUS_TRANSITION",
  VERSION_NOT_FOUND: "VERSION_NOT_FOUND",
  VERSION_ALREADY_EXISTS: "VERSION_ALREADY_EXISTS",
  VERSION_INVALID_NUMBER: "VERSION_INVALID_NUMBER",
  VERSION_NOT_PUBLISHABLE: "VERSION_NOT_PUBLISHABLE",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  PUBLICATION_FAILED: "PUBLICATION_FAILED",
  PUBLICATION_CONFLICT: "PUBLICATION_CONFLICT",
  ROLLBACK_FAILED: "ROLLBACK_FAILED",
  CLONE_FAILED: "CLONE_FAILED",
  VERSION_CONFLICT: "VERSION_CONFLICT",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  INVALID_REQUEST: "INVALID_REQUEST",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  // P0.2 — Data Model Manager
  DATA_MODEL_NOT_FOUND: "DATA_MODEL_NOT_FOUND",
  ENTITY_NOT_FOUND: "ENTITY_NOT_FOUND",
  ENTITY_CODE_REQUIRED: "ENTITY_CODE_REQUIRED",
  ENTITY_CODE_INVALID: "ENTITY_CODE_INVALID",
  ENTITY_CODE_ALREADY_EXISTS: "ENTITY_CODE_ALREADY_EXISTS",
  FIELD_NOT_FOUND: "FIELD_NOT_FOUND",
  FIELD_CODE_REQUIRED: "FIELD_CODE_REQUIRED",
  FIELD_CODE_ALREADY_EXISTS: "FIELD_CODE_ALREADY_EXISTS",
  FIELD_TYPE_INVALID: "FIELD_TYPE_INVALID",
  FIELD_DEFAULT_INVALID: "FIELD_DEFAULT_INVALID",
  RELATION_NOT_FOUND: "RELATION_NOT_FOUND",
  RELATION_INVALID: "RELATION_INVALID",
  RELATION_TARGET_NOT_FOUND: "RELATION_TARGET_NOT_FOUND",
  RELATION_DELETE_BEHAVIOR_INVALID: "RELATION_DELETE_BEHAVIOR_INVALID",
  CONSTRAINT_INVALID: "CONSTRAINT_INVALID",
  INDEX_INVALID: "INDEX_INVALID",
  VALIDATION_INVALID: "VALIDATION_INVALID",
  FORMULA_INVALID: "FORMULA_INVALID",
  FORMULA_REFERENCE_NOT_FOUND: "FORMULA_REFERENCE_NOT_FOUND",
  FORMULA_TYPE_MISMATCH: "FORMULA_TYPE_MISMATCH",
  FORMULA_CIRCULAR_DEPENDENCY: "FORMULA_CIRCULAR_DEPENDENCY",
  SCHEMA_INVALID: "SCHEMA_INVALID",
  SCHEMA_IMMUTABLE: "SCHEMA_IMMUTABLE",
  DEPENDENCY_EXISTS: "DEPENDENCY_EXISTS",
  BREAKING_CHANGE: "BREAKING_CHANGE",
  DATA_LOSS_RISK: "DATA_LOSS_RISK",
  MIGRATION_PLAN_INVALID: "MIGRATION_PLAN_INVALID",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

// Allowed lifecycle transitions
export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  DRAFT: ["CONFIGURING", "ARCHIVED"],
  CONFIGURING: ["READY", "DRAFT", "ARCHIVED"],
  READY: ["TESTING", "CONFIGURING", "ARCHIVED"],
  TESTING: ["ACTIVE", "READY", "CONFIGURING", "ARCHIVED"],
  ACTIVE: ["SUSPENDED", "ARCHIVED"],
  SUSPENDED: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: [], // Terminal
  ERROR: ["DRAFT", "CONFIGURING"],
};

// Permissions map
export const PERMISSIONS = {
  READ_APP: "business.application.read",
  CREATE_APP: "business.application.create",
  UPDATE_APP: "business.application.update",
  CLONE_APP: "business.application.clone",
  ARCHIVE_APP: "business.application.archive",
  READ_VERSION: "business.application.version.read",
  CREATE_VERSION: "business.application.version.create",
  VALIDATE_VERSION: "business.application.validate",
  PUBLISH_VERSION: "business.application.publish",
  ROLLBACK_VERSION: "business.application.rollback",
  READ_AUDIT: "business.application.audit.read",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    PERMISSIONS.READ_APP,
    PERMISSIONS.CREATE_APP,
    PERMISSIONS.UPDATE_APP,
    PERMISSIONS.CLONE_APP,
    PERMISSIONS.ARCHIVE_APP,
    PERMISSIONS.READ_VERSION,
    PERMISSIONS.CREATE_VERSION,
    PERMISSIONS.VALIDATE_VERSION,
    PERMISSIONS.PUBLISH_VERSION,
    PERMISSIONS.ROLLBACK_VERSION,
    PERMISSIONS.READ_AUDIT,
  ],
  BUILDER: [
    PERMISSIONS.READ_APP,
    PERMISSIONS.CREATE_APP,
    PERMISSIONS.UPDATE_APP,
    PERMISSIONS.CLONE_APP,
    PERMISSIONS.READ_VERSION,
    PERMISSIONS.CREATE_VERSION,
    PERMISSIONS.VALIDATE_VERSION,
    PERMISSIONS.READ_AUDIT,
  ],
  VIEWER: [
    PERMISSIONS.READ_APP,
    PERMISSIONS.READ_VERSION,
    PERMISSIONS.READ_AUDIT,
  ],
};
