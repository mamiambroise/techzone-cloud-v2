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
}