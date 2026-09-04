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
  REQUIRED = 'REQUIRED',
  OPTIONAL = 'OPTIONAL',
  RECOMMENDS = 'RECOMMENDS',
  REQUIRES = 'REQUIRES',
  CONFLICTS_WITH = 'CONFLICTS_WITH',
  IMPLIES = 'IMPLIES',
}

export enum DependencySourceType { PACK = 'PACK', MODULE = 'MODULE', FEATURE = 'FEATURE', CAPABILITY = 'CAPABILITY' }
export enum DependencyTargetType { PACK = 'PACK', MODULE = 'MODULE', FEATURE = 'FEATURE', CAPABILITY = 'CAPABILITY', CONTRACT = 'CONTRACT' }
export enum DependencyStatus { ACTIVE = 'ACTIVE', ARCHIVED = 'ARCHIVED' }
export enum DependencyResolutionStatus { NOT_RESOLVED = 'NOT_RESOLVED', RESOLVING = 'RESOLVING', RESOLVED = 'RESOLVED', MISSING = 'MISSING', INCOMPATIBLE = 'INCOMPATIBLE', CONFLICT = 'CONFLICT', CYCLE = 'CYCLE', ERROR = 'ERROR', OUTDATED = 'OUTDATED' }

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
  PACK_READ = 'pack.read',
  PACK_CREATE = 'pack.create',
  PACK_UPDATE = 'pack.update',
  PACK_ARCHIVE = 'pack.archive',
  PACK_DUPLICATE = 'pack.duplicate',
  PACK_RESTORE = 'pack.restore',
  PACK_VERSION_READ = 'pack.version.read',
  PACK_VERSION_CREATE = 'pack.version.create',
  PACK_VERSION_PUBLISH = 'pack.version.publish',
  PACK_MODULE_MANAGE = 'pack.module.manage',
  PACK_FEATURE_MANAGE = 'pack.feature.manage',
  PACK_DEPENDENCY_MANAGE = 'pack.dependency.manage',
  PACK_RULE_MANAGE = 'pack.rule.manage',
  PACK_DASHBOARD_READ = 'pack.dashboard.read',
  PACK_MODULE_READ = 'pack.module.read',
  PACK_MODULE_CREATE = 'pack.module.create',
  PACK_MODULE_UPDATE = 'pack.module.update',
  PACK_MODULE_REORDER = 'pack.module.reorder',
  PACK_MODULE_DUPLICATE = 'pack.module.duplicate',
  PACK_MODULE_ENABLE = 'pack.module.enable',
  PACK_MODULE_DISABLE = 'pack.module.disable',
  PACK_MODULE_ARCHIVE = 'pack.module.archive',
  PACK_FEATURE_READ = 'pack.feature.read',
  PACK_FEATURE_CREATE = 'pack.feature.create',
  PACK_FEATURE_UPDATE = 'pack.feature.update',
  PACK_FEATURE_ENABLE = 'pack.feature.enable',
  PACK_FEATURE_DISABLE = 'pack.feature.disable',
  PACK_FEATURE_ARCHIVE = 'pack.feature.archive',
  PACK_CAPABILITY_READ = 'pack.capability.read',
  PACK_CAPABILITY_CREATE = 'pack.capability.create',
  PACK_CAPABILITY_UPDATE = 'pack.capability.update',
  PACK_CAPABILITY_ATTACH = 'pack.capability.attach',
  PACK_CAPABILITY_DETACH = 'pack.capability.detach',
  PACK_DEPENDENCY_READ = 'pack.dependency.read',
  PACK_DEPENDENCY_CREATE = 'pack.dependency.create',
  PACK_DEPENDENCY_UPDATE = 'pack.dependency.update',
  PACK_DEPENDENCY_RESOLVE = 'pack.dependency.resolve',
  PACK_DEPENDENCY_ARCHIVE = 'pack.dependency.archive',
  PACK_DEPENDENCY_VIEW_GRAPH = 'pack.dependency.view_graph',
  PACK_RULE_READ = 'pack.rule.read',
  PACK_RULE_CREATE = 'pack.rule.create',
  PACK_RULE_UPDATE = 'pack.rule.update',
  PACK_RULE_ENABLE = 'pack.rule.enable',
  PACK_RULE_DISABLE = 'pack.rule.disable',
  PACK_RULE_VALIDATE = 'pack.rule.validate',
  PACK_RULE_SIMULATE = 'pack.rule.simulate',
  PACK_RULE_MANAGE_TESTS = 'pack.rule.manage_tests',
  PACK_RULE_ARCHIVE = 'pack.rule.archive',
}

export enum PackStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
}

export enum PackSourceType {
  SYSTEM = 'SYSTEM',
  TEMPLATE = 'TEMPLATE',
  CUSTOM = 'CUSTOM',
  IMPORTED = 'IMPORTED',
  CLONED = 'CLONED',
  GENERATED = 'GENERATED',
}

export enum PackVersionStatus {
  DRAFT = 'DRAFT',
  CONFIGURING = 'CONFIGURING',
  VALIDATING = 'VALIDATING',
  READY = 'READY',
  PUBLISHED = 'PUBLISHED',
  SUPERSEDED = 'SUPERSEDED',
  DEPRECATED = 'DEPRECATED',
  ARCHIVED = 'ARCHIVED',
  INVALID = 'INVALID',
  ERROR = 'ERROR',
}

export enum PackValidationStatus {
  NOT_RUN = 'NOT_RUN',
  RUNNING = 'RUNNING',
  VALID = 'VALID',
  INVALID = 'INVALID',
  OUTDATED = 'OUTDATED',
  ERROR = 'ERROR',
}

export enum PackManifestStatus {
  NOT_GENERATED = 'NOT_GENERATED',
  GENERATING = 'GENERATING',
  VALID = 'VALID',
  INVALID = 'INVALID',
  OUTDATED = 'OUTDATED',
  ERROR = 'ERROR',
}

export enum PackChangeType {
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  PATCH = 'PATCH',
}

export enum PackModuleType { BUSINESS = 'BUSINESS', SUPPORT = 'SUPPORT', CONFIGURATION = 'CONFIGURATION', REPORTING = 'REPORTING', INTEGRATION = 'INTEGRATION', SYSTEM = 'SYSTEM' }
export enum PackModuleStatus { DRAFT = 'DRAFT', ACTIVE = 'ACTIVE', DISABLED = 'DISABLED', DEPRECATED = 'DEPRECATED', ARCHIVED = 'ARCHIVED' }
export enum PackFeatureType { CORE = 'CORE', OPTIONAL = 'OPTIONAL', PREMIUM = 'PREMIUM', EXPERIMENTAL = 'EXPERIMENTAL', INTERNAL = 'INTERNAL', INTEGRATION = 'INTEGRATION' }
export enum PackFeatureStatus { DRAFT = 'DRAFT', ACTIVE = 'ACTIVE', DISABLED = 'DISABLED', DEPRECATED = 'DEPRECATED', ARCHIVED = 'ARCHIVED' }
export enum PackFeatureVisibility { PUBLIC = 'PUBLIC', ADMIN = 'ADMIN', INTERNAL = 'INTERNAL', HIDDEN = 'HIDDEN' }
export enum PackCapabilityType { DATA = 'DATA', ACTION = 'ACTION', UI = 'UI', WORKFLOW = 'WORKFLOW', INTEGRATION = 'INTEGRATION', SYSTEM = 'SYSTEM' }
export enum PackCapabilityScope { GLOBAL = 'GLOBAL', TENANT = 'TENANT', APPLICATION = 'APPLICATION', PACK = 'PACK', MODULE = 'MODULE', RESOURCE = 'RESOURCE' }
export enum PackCapabilityStatus { DRAFT = 'DRAFT', ACTIVE = 'ACTIVE', DEPRECATED = 'DEPRECATED', DISABLED = 'DISABLED', ARCHIVED = 'ARCHIVED' }
export enum PackFeatureCapabilityRelation { PROVIDES = 'PROVIDES', REQUIRES = 'REQUIRES', USES = 'USES' }

export enum PackBreakingChangeStatus {
  NONE = 'NONE',
  POTENTIAL = 'POTENTIAL',
  CONFIRMED = 'CONFIRMED',
}

export enum PackDependencyType {
  REQUIRED = 'REQUIRED',
  OPTIONAL = 'OPTIONAL',
  CONFLICTS_WITH = 'CONFLICTS_WITH',
  RECOMMENDS = 'RECOMMENDS',
  IMPLIES = 'IMPLIES',
}

export enum RuleType { ACTIVATION = 'ACTIVATION', ELIGIBILITY = 'ELIGIBILITY', VISIBILITY = 'VISIBILITY', AVAILABILITY = 'AVAILABILITY', CONFIGURATION = 'CONFIGURATION', COMPATIBILITY = 'COMPATIBILITY' }
export enum RuleTargetType { PACK = 'PACK', MODULE = 'MODULE', FEATURE = 'FEATURE', CAPABILITY = 'CAPABILITY', CONFIGURATION = 'CONFIGURATION' }
export enum RuleEffect { ALLOW = 'ALLOW', DENY = 'DENY', ENABLE = 'ENABLE', DISABLE = 'DISABLE', SHOW = 'SHOW', HIDE = 'HIDE', REQUIRE = 'REQUIRE', SET_VALUE = 'SET_VALUE' }
export enum RuleStatus { DRAFT = 'DRAFT', ACTIVE = 'ACTIVE', DISABLED = 'DISABLED', DEPRECATED = 'DEPRECATED', ARCHIVED = 'ARCHIVED' }
export enum RuleValidationStatus { NOT_VALIDATED = 'NOT_VALIDATED', VALID = 'VALID', INVALID = 'INVALID', OUTDATED = 'OUTDATED' }
export enum ConditionNodeType { GROUP = 'GROUP', PREDICATE = 'PREDICATE', NOT = 'NOT' }
export enum LogicalOperator { AND = 'AND', OR = 'OR' }
export enum RuleOperator { EQ = 'EQ', NEQ = 'NEQ', GT = 'GT', GTE = 'GTE', LT = 'LT', LTE = 'LTE', IN = 'IN', NOT_IN = 'NOT_IN', CONTAINS = 'CONTAINS', NOT_CONTAINS = 'NOT_CONTAINS', STARTS_WITH = 'STARTS_WITH', ENDS_WITH = 'ENDS_WITH', EXISTS = 'EXISTS', NOT_EXISTS = 'NOT_EXISTS', MATCHES = 'MATCHES', BEFORE = 'BEFORE', AFTER = 'AFTER', BETWEEN = 'BETWEEN', VERSION_EQ = 'VERSION_EQ', VERSION_GT = 'VERSION_GT', VERSION_GTE = 'VERSION_GTE', VERSION_LT = 'VERSION_LT', VERSION_LTE = 'VERSION_LTE', VERSION_SATISFIES = 'VERSION_SATISFIES' }
export enum RuleValueType { STRING = 'STRING', NUMBER = 'NUMBER', BOOLEAN = 'BOOLEAN', DATE = 'DATE', DATETIME = 'DATETIME', ENUM = 'ENUM', ARRAY = 'ARRAY', VERSION = 'VERSION', REFERENCE = 'REFERENCE', NULL = 'NULL' }
