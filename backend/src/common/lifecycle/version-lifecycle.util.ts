export type ApplicationVersionLifecycleStatus =
  | 'DRAFT'
  | 'CONFIGURING'
  | 'VALIDATING'
  | 'READY'
  | 'ACTIVE'
  | 'SUPERSEDED'
  | 'DEPRECATED'
  | 'ARCHIVED';

const VERSION_TRANSITIONS: Record<
  ApplicationVersionLifecycleStatus,
  ApplicationVersionLifecycleStatus[]
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

export function canTransitionVersion(
  current: ApplicationVersionLifecycleStatus,
  next: ApplicationVersionLifecycleStatus,
): boolean {
  return VERSION_TRANSITIONS[current]?.includes(next) ?? false;
}
