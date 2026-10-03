/**
 * Périodes de facturation déterministes (CDC 11 / CDC 98).
 *
 * Aucune durée de grace ni de période n'est codée arbitrairement dans les
 * services : les cycles viennent de la donnée (Price.interval +
 * Price.intervalCount) et la grace d'une politique configurable
 * (CDC 51 : « Ne pas coder arbitrairement un nombre de jours »).
 */

import { BillingInterval } from '../../../generated/prisma/enums';

export interface BillingPeriod {
  start: Date;
  end: Date;
}

/**
 * Debut de jour UTC (UTC + 00:00). Le calcul Billing raisonne en jour UTC :
 * aucune heure locale ne doit faire varier une echeance.
 */
function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addMonths(date: Date, months: number): Date {
  const target = new Date(date.getTime());
  const day = target.getUTCDate();
  target.setUTCDate(1);
  target.setUTCMonth(target.getUTCMonth() + months);
  // Clamp du dernier jour : 31 janvier + 1 mois = 28/29 fevrier (CDC 98).
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

function addYears(date: Date, years: number): Date {
  const target = new Date(date.getTime());
  const day = target.getUTCDate();
  const month = target.getUTCMonth();
  target.setUTCDate(1);
  target.setUTCFullYear(target.getUTCFullYear() + years);
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), month + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return target;
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

export function monthsForInterval(interval: BillingInterval, intervalCount = 1): number | null {
  const count = Math.max(1, Math.trunc(intervalCount));
  switch (interval) {
    case 'MONTHLY':
      return count;
    case 'QUARTERLY':
      return 3 * count;
    case 'SEMI_ANNUAL':
      return 6 * count;
    case 'ANNUAL':
      return 12 * count;
    default:
      return null;
  }
}

/**
 * Prochaine periode de facturation, en anniversaire de souscription : la
 * periode suit le jour d_activation (un abonnement actif le 17 reste facture le
 * 17), et non le debut du mois civil. `CUSTOM` n'est pas devine : l'appelant
 * doit fournir explicitement une duree en jours (CDC 9/11 — ne pas inventer).
 */
export function nextPeriod(
  from: Date,
  interval: BillingInterval,
  intervalCount = 1,
  customDays?: number,
): BillingPeriod {
  const start = startOfUtcDay(from);
  const months = monthsForInterval(interval, intervalCount);
  if (months !== null) {
    return { start, end: startOfUtcDay(addMonths(start, months)) };
  }
  const days = customDays;
  if (!days || !Number.isFinite(days) || days <= 0) {
    throw new RangeError(
      'BillingInterval.CUSTOM exige une duree explicite (customDays) : aucune duree n est inventee.',
    );
  }
  return { start, end: startOfUtcDay(addDays(start, days)) };
}

/**
 * Periode de facturation d'un abonnement a partir de sa fin de periode courante.
 * Si la periode est absente ou depassee, elle est (re)ancree sur today pour ne
 * jamaisCredits une periode deja terminee.
 */
export function resolvePeriod(
  current: BillingPeriod | null,
  today: Date,
  interval: BillingInterval,
  intervalCount = 1,
  customDays?: number,
): BillingPeriod {
  if (current && current.end > today) return current;
  return nextPeriod(today, interval, intervalCount, customDays);
}

export function addGraceDays(from: Date, days: number): Date {
  return addDays(from, days);
}

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((startOfUtcDay(to).getTime() - startOfUtcDay(from).getTime()) / 86_400_000);
}

export { addDays, addMonths, addYears, startOfUtcDay };