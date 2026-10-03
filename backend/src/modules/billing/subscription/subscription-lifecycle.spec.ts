import { SubscriptionStatus } from '../../../generated/prisma/enums';
import {
  ENTITLED_STATUSES,
  SUBSCRIPTION_TRANSITIONS,
  allowedTransitions,
  canTransition,
  isEntitled,
  isTerminal,
} from './subscription-lifecycle';

/**
 * Machine a etats de l'abonnement (CDC 12/14/15).
 *
 * L'API n'expose aucun changement de statut arbitraire : toute evolution passe
 * par cette matrice, et une sortie non prevue est refusee.
 */
describe('Machine a etats abonnement (CDC 14)', () => {
  it('accepte la souscription puis l activation', () => {
    expect(canTransition(SubscriptionStatus.DRAFT, SubscriptionStatus.TRIALING)).toBe(true);
    expect(canTransition(SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE)).toBe(true);
    expect(canTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.ACTIVE)).toBe(false);
  });

  it('accepte la degradation ACTIVE -> PAST_DUE -> GRACE -> SUSPENDED', () => {
    expect(canTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE)).toBe(true);
    expect(canTransition(SubscriptionStatus.PAST_DUE, SubscriptionStatus.GRACE_PERIOD)).toBe(true);
    expect(canTransition(SubscriptionStatus.GRACE_PERIOD, SubscriptionStatus.SUSPENDED)).toBe(true);
  });

  it('permet le retour ACTIF depuis grace, past_due et suspension', () => {
    expect(canTransition(SubscriptionStatus.GRACE_PERIOD, SubscriptionStatus.ACTIVE)).toBe(true);
    expect(canTransition(SubscriptionStatus.PAST_DUE, SubscriptionStatus.ACTIVE)).toBe(true);
    expect(canTransition(SubscriptionStatus.SUSPENDED, SubscriptionStatus.ACTIVE)).toBe(true);
  });

  it('interdit de sauter directement de ACTIVE a ENDED', () => {
    expect(canTransition(SubscriptionStatus.ACTIVE, SubscriptionStatus.ENDED)).toBe(false);
    expect(canTransition(SubscriptionStatus.SUSPENDED, SubscriptionStatus.TRIALING)).toBe(false);
    expect(canTransition(SubscriptionStatus.CANCELLED, SubscriptionStatus.ACTIVE)).toBe(false);
  });

  it('interdit toute sortie d un etat terminal', () => {
    expect(isTerminal(SubscriptionStatus.ENDED)).toBe(true);
    expect(allowedTransitions(SubscriptionStatus.ENDED)).toEqual([]);
    expect(canTransition(SubscriptionStatus.ENDED, SubscriptionStatus.ACTIVE)).toBe(false);
  });

  it('ne declare que des etats connus et jamais lui-meme', () => {
    const known = new Set(Object.values(SubscriptionStatus));
    for (const [from, targets] of Object.entries(SUBSCRIPTION_TRANSITIONS)) {
      expect(known.has(from as SubscriptionStatus)).toBe(true);
      for (const target of targets) {
        expect(known.has(target)).toBe(true);
        expect(target).not.toBe(from);
      }
    }
    // CDC 14 : GRACE_PERIOD et PAST_DUE ne sont pas des doublons de ACTIVE.
    expect(SUBSCRIPTION_TRANSITIONS.GRACE_PERIOD).toEqual(
      expect.arrayContaining([SubscriptionStatus.SUSPENDED, SubscriptionStatus.CANCELLED]),
    );
    expect(SUBSCRIPTION_TRANSITIONS.PAST_DUE).toContain(SubscriptionStatus.GRACE_PERIOD);
  });

  it('conserve les droits en grace et past_due, pas apres suspension', () => {
    expect(isEntitled(SubscriptionStatus.TRIALING)).toBe(true);
    expect(isEntitled(SubscriptionStatus.ACTIVE)).toBe(true);
    expect(isEntitled(SubscriptionStatus.PAST_DUE)).toBe(true);
    expect(isEntitled(SubscriptionStatus.GRACE_PERIOD)).toBe(true);
    expect(isEntitled(SubscriptionStatus.SUSPENDED)).toBe(false);
    expect(isEntitled(SubscriptionStatus.CANCELLED)).toBe(false);
    expect(isEntitled(SubscriptionStatus.ENDED)).toBe(false);
    expect(ENTITLED_STATUSES).not.toContain(SubscriptionStatus.DRAFT);
  });

  it('expose une copie des transitions autorisees', () => {
    const transitions = allowedTransitions(SubscriptionStatus.ACTIVE);
    transitions.push(SubscriptionStatus.ENDED);
    expect(SUBSCRIPTION_TRANSITIONS.ACTIVE).not.toContain(SubscriptionStatus.ENDED);
  });
});
