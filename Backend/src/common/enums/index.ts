export enum ApplicationStatus {
  DRAFT = 'DRAFT',
  CONFIGURING = 'CONFIGURING',
  READY = 'READY',
  TESTING = 'TESTING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED',
  ERROR = 'ERROR',
}

export enum Environment {
  DEVELOPMENT = 'DEVELOPMENT',
  TEST = 'TEST',
  STAGING = 'STAGING',
  PRODUCTION = 'PRODUCTION',
}

export enum ApplicationVersionStatus {
  DRAFT = 'DRAFT',
  READY = 'READY',
  TESTING = 'TESTING',
  PUBLISHED = 'PUBLISHED',
  SUPERSEDED = 'SUPERSEDED',
  INVALID = 'INVALID',
  ARCHIVED = 'ARCHIVED',
}

export enum PublicationType {
  PUBLISH = 'PUBLISH',
  ROLLBACK = 'ROLLBACK',
}

export enum PublicationStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export enum EventType {
  APPLICATION_CREATED = 'application.created',
  APPLICATION_UPDATED = 'application.updated',
  APPLICATION_CLONED = 'application.cloned',
  APPLICATION_STATUS_CHANGED = 'application.status.changed',
  APPLICATION_ARCHIVED = 'application.archived',
  APPLICATION_VERSION_CREATED = 'application.version.created',
  APPLICATION_VERSION_VALIDATED = 'application.version.validated',
  APPLICATION_PUBLISHED = 'application.published',
  APPLICATION_ROLLBACK = 'application.rollback',
}

export enum ResultType {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  WARNING = 'WARNING',
}

export enum DataModelStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  VALIDATED = 'VALIDATED',
  ARCHIVED = 'ARCHIVED',
}

export enum FeatureStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
}

export enum CapabilityStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
}

export enum CapabilityType {
  READ = 'READ',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ACTION = 'ACTION',
  EXECUTE = 'EXECUTE',
  IMPORT = 'IMPORT',
  EXPORT = 'EXPORT',
  APPROVE = 'APPROVE',
  ADMIN = 'ADMIN',
}

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum DependencyType {
  REQUIRES = 'REQUIRES',
  CONFLICTS_WITH = 'CONFLICTS_WITH',
  IMPLIES = 'IMPLIES',
}

export enum VersionFeatureState {
  ENABLED = 'ENABLED',
  DISABLED = 'DISABLED',
  EXPERIMENTAL = 'EXPERIMENTAL',
}

export enum CapabilitySourceType {
  SYSTEM = 'SYSTEM',
  PACK = 'PACK',
  CUSTOM = 'CUSTOM',
  GENERATED = 'GENERATED',
}

export enum FeatureSourceType {
  SYSTEM = 'SYSTEM',
  PACK = 'PACK',
  CUSTOM = 'CUSTOM',
  GENERATED = 'GENERATED',
}

export enum MenuLocation { SIDEBAR = 'SIDEBAR', TOPBAR = 'TOPBAR', BOTTOM_NAV = 'BOTTOM_NAV', USER_MENU = 'USER_MENU', CONTEXT_MENU = 'CONTEXT_MENU', QUICK_ACTIONS = 'QUICK_ACTIONS' }
export enum MenuStatus { DRAFT = 'DRAFT', ACTIVE = 'ACTIVE', DEPRECATED = 'DEPRECATED', ARCHIVED = 'ARCHIVED' }
export enum MenuSourceType { SYSTEM = 'SYSTEM', PACK = 'PACK', CUSTOM = 'CUSTOM', GENERATED = 'GENERATED' }
export enum MenuItemState { ENABLED = 'ENABLED', DISABLED = 'DISABLED', HIDDEN = 'HIDDEN' }
export enum NavigationTargetType { ROUTE = 'ROUTE', EXTERNAL_URL = 'EXTERNAL_URL', ACTION = 'ACTION', NONE = 'NONE' }
export enum NavigationOpenMode { SAME_VIEW = 'SAME_VIEW', NEW_TAB = 'NEW_TAB', MODAL = 'MODAL', DRAWER = 'DRAWER' }
export enum RequirementMode { ALL = 'ALL', ANY = 'ANY' }
export enum ConfigurationDataType { STRING = 'STRING', TEXT = 'TEXT', INTEGER = 'INTEGER', DECIMAL = 'DECIMAL', BOOLEAN = 'BOOLEAN', DATE = 'DATE', DATETIME = 'DATETIME', TIME = 'TIME', ENUM = 'ENUM', MULTI_ENUM = 'MULTI_ENUM', COLOR = 'COLOR', ICON = 'ICON', URL = 'URL', EMAIL = 'EMAIL', PHONE = 'PHONE', JSON = 'JSON', REFERENCE = 'REFERENCE', LIST = 'LIST', MAP = 'MAP', SECRET = 'SECRET' }
export enum ConfigurationScope { PLATFORM = 'PLATFORM', TENANT = 'TENANT', APPLICATION = 'APPLICATION', APPLICATION_VERSION = 'APPLICATION_VERSION', ENVIRONMENT = 'ENVIRONMENT', RUNTIME_CONTEXT = 'RUNTIME_CONTEXT' }

export enum Permission {
  APPLICATION_READ = 'business.application.read',
  APPLICATION_CREATE = 'business.application.create',
  APPLICATION_UPDATE = 'business.application.update',
  APPLICATION_CLONE = 'business.application.clone',
  APPLICATION_ARCHIVE = 'business.application.archive',
  VERSION_READ = 'business.application.version.read',
  VERSION_CREATE = 'business.application.version.create',
  VALIDATE = 'business.application.validate',
  PUBLISH = 'business.application.publish',
  ROLLBACK = 'business.application.rollback',
  AUDIT_READ = 'business.application.audit.read',
  DATA_MODEL_READ = 'business.application.data-model.read',
  DATA_MODEL_WRITE = 'business.application.data-model.write',
  DATA_MODEL_VALIDATE = 'business.application.data-model.validate',
  FEATURE_READ = 'business.feature.read',
  FEATURE_CREATE = 'business.feature.create',
  FEATURE_UPDATE = 'business.feature.update',
  FEATURE_ARCHIVE = 'business.feature.archive',
  CAPABILITY_READ = 'business.capability.read',
  CAPABILITY_CREATE = 'business.capability.create',
  CAPABILITY_UPDATE = 'business.capability.update',
  CAPABILITY_ARCHIVE = 'business.capability.archive',
  FEATURE_MAPPING_MANAGE = 'business.feature.mapping.manage',
  CAPABILITY_DEPENDENCY_MANAGE = 'business.capability.dependency.manage',
  CAPABILITY_REQUIREMENT_MANAGE = 'business.capability.requirement.manage',
  VERSION_FEATURE_MANAGE = 'business.version.feature.manage',
  VERSION_CAPABILITY_MANAGE = 'business.version.capability.manage',
  FEATURE_IMPACT_READ = 'business.feature.impact.read',
  FEATURE_VALIDATION_RUN = 'business.feature.validation.run',
  FEATURE_SNAPSHOT_READ = 'business.feature.snapshot.read',
}
