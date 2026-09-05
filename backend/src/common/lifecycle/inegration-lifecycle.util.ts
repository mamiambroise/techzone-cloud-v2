export type IntegrationEntityLifecycleStatus =
  | 'DRAFT'
  | 'CONFIGURING'
  | 'VALIDATING'
  | 'READY'
  | 'ACTIVE'
  | 'DEGRADED'
  | 'DISABLED'
  | 'ARCHIVED';

const INTEGRATION_TRANSITIONS: Record<
  IntegrationEntityLifecycleStatus,
  IntegrationEntityLifecycleStatus[]
> = {
  DRAFT: ['CONFIGURING', 'ARCHIVED'],
  CONFIGURING: ['DRAFT', 'VALIDATING'],
  VALIDATING: ['CONFIGURING', 'READY', 'DEGRADED'],
  READY: ['ACTIVE', 'DEGRADED', 'ARCHIVED'],
  ACTIVE: ['DEGRADED', 'DISABLED', 'ARCHIVED'],
  DEGRADED: ['ACTIVE', 'READY', 'DISABLED'],
  DISABLED: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

export function canTransitionIntegrationEntity(
  current: IntegrationEntityLifecycleStatus,
  next: IntegrationEntityLifecycleStatus,
): boolean {
  return INTEGRATION_TRANSITIONS[current]?.includes(next) ?? false;
}
