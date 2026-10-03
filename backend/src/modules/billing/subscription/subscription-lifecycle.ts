import { SubscriptionStatus } from '../../../generated/prisma/enums';

/**
 * Machine a etats de l'abonnement (CDC 14/15).
 *
 * Toute transition passe par ici : il n'existe aucun moyen de changer un statut
 * arbitrairement depuis l'API (CDC 12 — « Pas de changement de statut arbitraire
 * depuis React »). Le CDC 14 impose de ne pas creer deux etats de meme
 * signification, d'ou l'absence de GRACE et de PAST_DUE distincts.
 */
export const SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  DRAFT: [SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
  TRIALING: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.GRACE_PERIOD,
    SubscriptionStatus.SUSPENDED,
    SubscriptionStatus.CANCELLED,
    SubscriptionStatus.EXPIRED,
  ],
  ACTIVE: [
    SubscriptionStatus.PAST_DUE,
    SubscriptionStatus.GRACE_PERIOD,
    SubscriptionStatus.SUSPENDED,
    SubscriptionStatus.CANCELLED,
  ],
  PAST_DUE: [SubscriptionStatus.ACTIVE, SubscriptionStatus.GRACE_PERIOD, SubscriptionStatus.SUSPENDED, SubscriptionStatus.CANCELLED],
  GRACE_PERIOD: [SubscriptionStatus.ACTIVE, SubscriptionStatus.SUSPENDED, SubscriptionStatus.CANCELLED],
  SUSPENDED: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
  CANCELLED: [SubscriptionStatus.ENDED],
  EXPIRED: [SubscriptionStatus.ENDED],
  ENDED: [],
};

/** Etats dans lesquels le Tenant conserve des droits commerciaux. */
export const ENTITLED_STATUSES: SubscriptionStatus[] = [
  SubscriptionStatus.TRIALING,
  SubscriptionStatus.ACTIVE,
  SubscriptionStatus.PAST_DUE,
  SubscriptionStatus.GRACE_PERIOD,
];

export function canTransition(from: SubscriptionStatus, to: SubscriptionStatus): boolean {
  return SUBSCRIPTION_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isEntitled(status: SubscriptionStatus): boolean {
  return ENTITLED_STATUSES.includes(status);
}

export function isTerminal(status: SubscriptionStatus): boolean {
  return SUBSCRIPTION_TRANSITIONS[status].length === 0;
}

export function allowedTransitions(from: SubscriptionStatus): SubscriptionStatus[] {
  return [...(SUBSCRIPTION_TRANSITIONS[from] ?? [])];
}