import { BillingInterval } from '../../../generated/prisma/enums';
import { addGraceDays, daysBetween, monthsForInterval, nextPeriod, resolvePeriod } from './billing-period';

/**
 * Periodes de facturation (CDC 11 / CDC 98).
 *
 * Choix explicite : la periode suit l'anniversaire de souscription (jour
 * d'activation) et non le debut du mois civil. La fin de periode est clampee
 * sur le dernier jour du mois cible (31 janvier + 1 mois = 28/29 fevrier).
 */
describe('Periodes de facturation (CDC 11 / 98)', () => {
  const day = (date: Date) => date.toISOString().slice(0, 10);

  it('convertit un intervalle en nombre de mois', () => {
    expect(monthsForInterval(BillingInterval.MONTHLY)).toBe(1);
    expect(monthsForInterval(BillingInterval.QUARTERLY)).toBe(3);
    expect(monthsForInterval(BillingInterval.SEMI_ANNUAL)).toBe(6);
    expect(monthsForInterval(BillingInterval.ANNUAL)).toBe(12);
    expect(monthsForInterval(BillingInterval.CUSTOM)).toBeNull();
  });

  it('respecte intervalCount', () => {
    const period = nextPeriod(new Date('2026-01-15T10:30:00.000Z'), BillingInterval.MONTHLY, 3);
    expect(day(period.start)).toBe('2026-01-15');
    expect(day(period.end)).toBe('2026-04-15');
  });

  it('ancre la periode au debut du jour UTC', () => {
    const period = nextPeriod(new Date('2026-03-17T22:45:00.000Z'), BillingInterval.MONTHLY);
    expect(day(period.start)).toBe('2026-03-17');
    expect(period.start.toISOString()).toBe('2026-03-17T00:00:00.000Z');
    expect(day(period.end)).toBe('2026-04-17');
  });

  it('clampe la fin de mois (31 janvier + 1 mois = 28 fevrier)', () => {
    const period = nextPeriod(new Date('2026-01-31T00:00:00.000Z'), BillingInterval.MONTHLY);
    expect(day(period.end)).toBe('2026-02-28');
  });

  it('clampe sur une annee bissextile', () => {
    const period = nextPeriod(new Date('2028-01-31T00:00:00.000Z'), BillingInterval.MONTHLY);
    expect(day(period.end)).toBe('2028-02-29');
  });

  it('traite un cycle annuel', () => {
    const period = nextPeriod(new Date('2026-06-10T00:00:00.000Z'), BillingInterval.ANNUAL);
    expect(day(period.start)).toBe('2026-06-10');
    expect(day(period.end)).toBe('2027-06-10');
  });

  it('refuse d inventer une duree pour un intervalle CUSTOM', () => {
    expect(() => nextPeriod(new Date('2026-01-01T00:00:00.000Z'), BillingInterval.CUSTOM)).toThrow(RangeError);
    const period = nextPeriod(new Date('2026-01-01T00:00:00.000Z'), BillingInterval.CUSTOM, 1, 45);
    expect(day(period.end)).toBe('2026-02-15');
  });

  it('conserve une periode encore en cours', () => {
    const today = new Date('2026-05-10T00:00:00.000Z');
    const current = { start: new Date('2026-05-01T00:00:00.000Z'), end: new Date('2026-06-01T00:00:00.000Z') };
    expect(resolvePeriod(current, today, BillingInterval.MONTHLY)).toEqual(current);
  });

  it('reanc une periode depassee sur today (jamais de periode creditee)', () => {
    const today = new Date('2026-05-10T12:00:00.000Z');
    const expired = { start: new Date('2026-04-10T00:00:00.000Z'), end: new Date('2026-05-10T00:00:00.000Z') };
    const resolved = resolvePeriod(expired, today, BillingInterval.MONTHLY);
    expect(day(resolved.start)).toBe('2026-05-10');
    expect(day(resolved.end)).toBe('2026-06-10');
  });

  it('ancre une periode absente sur today', () => {
    const resolved = resolvePeriod(null, new Date('2026-05-10T12:00:00.000Z'), BillingInterval.MONTHLY);
    expect(day(resolved.start)).toBe('2026-05-10');
    expect(day(resolved.end)).toBe('2026-06-10');
  });

  it('ne code aucune duree de grace dans le calcul de periode (CDC 51)', () => {
    const start = new Date('2026-01-01T00:00:00.000Z');
    expect(day(addGraceDays(start, 7))).toBe('2026-01-08');
    expect(day(addGraceDays(start, 0))).toBe('2026-01-01');
  });

  it('compte des jours calendaires', () => {
    expect(daysBetween(new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-31T00:00:00.000Z'))).toBe(30);
    expect(daysBetween(new Date('2026-01-01T00:00:00.000Z'), new Date('2026-01-01T00:00:00.000Z'))).toBe(0);
  });
});
