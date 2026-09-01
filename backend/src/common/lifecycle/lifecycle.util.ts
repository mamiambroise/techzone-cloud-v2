export type ApplicationLifecycleStatus =
  | 'DRAFT'
  | 'CONFIGURING'
  | 'VALIDATING'
  | 'READY'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'DEPRECATED'
  | 'ARCHIVED';

const APPLICATION_TRANSITIONS: Record<
  ApplicationLifecycleStatus,
  ApplicationLifecycleStatus[]
> = {
  DRAFT: ['CONFIGURING'],
  CONFIGURING: ['VALIDATING'],
  VALIDATING: ['READY'],
  READY: ['ACTIVE'],
  ACTIVE: ['SUPERSEDED', 'DEPRECATED'],
  SUPERSEDED: ['DEPRECATED', 'ARCHIVED'],
  DEPRECATED: ['ARCHIVED'],
  ARCHIVED: [],
};

export function canTransitionApplication(
  current: ApplicationLifecycleStatus,
  next: ApplicationLifecycleStatus,
): boolean {
  return APPLICATION_TRANSITIONS[current]?.includes(next) ?? false;
}
