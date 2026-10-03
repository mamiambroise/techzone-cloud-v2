import {
  CURRENCY_EXPONENTS,
  Money,
  assertCurrency,
  formatMoney,
  isSupportedCurrency,
  parseAmountToMinorUnits,
  sumMoney,
  toMinorUnits,
} from './money';

/**
 * Determinisme monetaire (CDC 10 / CDC 97 / RG-BILL-006/007).
 *
 * Ces tests verrouillent les invariants qui rendent les montants fiables :
 * jamais de flottant accumule, jamais de devise implicite, jamais de conversion
 * silencieuse.
 */
describe('Money (CDC 10)', () => {
  describe('devises', () => {
    it('accepte uniquement les devises declarees', () => {
      expect(isSupportedCurrency('MGA')).toBe(true);
      expect(isSupportedCurrency('EUR')).toBe(true);
      expect(isSupportedCurrency('USD')).toBe(true);
      expect(isSupportedCurrency('XOF')).toBe(false);
      expect(isSupportedCurrency('eur')).toBe(false);
      expect(isSupportedCurrency(null)).toBe(false);
    });

    it('refuse une devise non declaree au lieu de la deviner', () => {
      expect(() => assertCurrency('XOF')).toThrow(RangeError);
      expect(() => assertCurrency('MGA')).not.toThrow();
    });

    it('expose un exposant unique par devise (CDC 97)', () => {
      expect(CURRENCY_EXPONENTS.MGA).toBe(2);
      expect(CURRENCY_EXPONENTS.EUR).toBe(2);
      expect(CURRENCY_EXPONENTS.USD).toBe(2);
    });
  });

  describe('parseAmountToMinorUnits', () => {
    it('convertit une chaine decimale en unites mineures entieres', () => {
      expect(parseAmountToMinorUnits('1234.56', 'MGA')).toBe(123456);
      expect(parseAmountToMinorUnits('1234.5', 'MGA')).toBe(123450);
      expect(parseAmountToMinorUnits('0.01', 'EUR')).toBe(1);
      expect(parseAmountToMinorUnits('0', 'USD')).toBe(0);
    });

    it('accepte les saisies humaines avec separateur local', () => {
      expect(parseAmountToMinorUnits('1 234,56', 'EUR')).toBe(123456);
      expect(parseAmountToMinorUnits('1\u00a0234,56', 'EUR')).toBe(123456);
      expect(parseAmountToMinorUnits('1,234.56', 'USD')).toBe(123456);
    });

    it('refuse une saisie non numerique', () => {
      expect(() => parseAmountToMinorUnits('abc', 'MGA')).toThrow(RangeError);
      expect(() => parseAmountToMinorUnits('12.3.4', 'MGA')).toThrow(RangeError);
      expect(() => parseAmountToMinorUnits('10 000 000 000 000 000 000 000', 'MGA')).toThrow(RangeError);
    });
  });

  describe('Money', () => {
    it('additionne sans derive sur une longue serie (pas de flottant accumule)', () => {
      let total = Money.zero('MGA');
      for (let index = 0; index < 1000; index += 1) {
        total = total.add(Money.of('0.10', 'MGA'));
      }
      // 1000 x 0,10 MGA = 100,00 MGA = 10 000 unites mineures.
      expect(total.minorUnits).toBe(10000);
      expect(total.toDecimalString()).toBe('100.00');
    });

    it('additionne exactement la ou un flottant derivationait', () => {
      const a = Money.of('0.1', 'USD');
      const b = Money.of('0.2', 'USD');
      expect(a.add(b).toDecimalString()).toBe('0.30');
      expect(0.1 + 0.2).not.toBe(0.3);
    });

    it('interdit de sommer deux devises differentes (RG-BILL-007)', () => {
      const mga = Money.of('10.00', 'MGA');
      const eur = Money.of('10.00', 'EUR');
      expect(() => mga.add(eur)).toThrow(RangeError);
      expect(() => mga.subtract(eur)).toThrow(RangeError);
      expect(() => sumMoney([mga, eur], 'MGA')).toThrow(RangeError);
    });

    it('ne convertit jamais implicitement une devise', () => {
      const result = Money.of('100', 'USD');
      expect(result.currency).toBe('USD');
      expect(result.toDecimalString()).toBe('100.00');
      expect(() => Money.of('100', 'USD').add(Money.of('1', 'EUR'))).toThrow();
    });

    it('gere les montants negatifs et le clamping a zero', () => {
      expect(Money.of('-5.50', 'EUR').toDecimalString()).toBe('-5.50');
      expect(Money.of('-5.50', 'EUR').abs().toDecimalString()).toBe('5.50');
      expect(Money.of('-5.50', 'EUR').clampToZero().minorUnits).toBe(0);
      expect(Money.of('-5.50', 'EUR').isNegative()).toBe(true);
    });

    it('multiplie une quantite decimale sans perte de centimes', () => {
      expect(Money.of('99.99', 'EUR').multiply(3).toDecimalString()).toBe('299.97');
      expect(Money.of('100.00', 'EUR').multiply(0.1).toDecimalString()).toBe('10.00');
    });

    it('applique un pourcentage sur l entier du montant', () => {
      expect(Money.of('1000.00', 'MGA').percentage(20).toDecimalString()).toBe('200.00');
      expect(Money.of('33.33', 'MGA').percentage(20).toDecimalString()).toBe('6.67');
    });

    it('compare, min et clamp sans effet de bord', () => {
      const small = Money.of('5.00', 'USD');
      const large = Money.of('10.00', 'USD');
      expect(small.isLessThan(large)).toBe(true);
      expect(small.isGreaterThan(large)).toBe(false);
      expect(small.min(large).minorUnits).toBe(500);
      expect(small.equals(Money.of('5.00', 'USD'))).toBe(true);
      expect(small.equals(Money.of('5.00', 'EUR'))).toBe(false);
    });

    it('serialise en chaine exacte, jamais en notation scientifique', () => {
      expect(Money.ofMinorUnits(1, 'MGA').toDecimalString()).toBe('0.01');
      expect(Money.ofMinorUnits(100000000000, 'MGA').toDecimalString()).toBe('1000000000.00');
      expect(Money.ofMinorUnits(-1, 'USD').toDecimalString()).toBe('-0.01');
    });

    it('refuse un montant non entier en unites mineures', () => {
      expect(() => Money.ofMinorUnits(1.5, 'MGA')).toThrow(RangeError);
    });
  });

  describe('lecture de valeurs stockees', () => {
    it('relit un Decimal Prisma sans derive (aller-retour stable)', () => {
      const decimal = { toString: () => '1234.56' };
      const minor = toMinorUnits(decimal, 'MGA');
      expect(minor).toBe(123456);
      expect(Money.ofMinorUnits(minor, 'MGA').toDecimalString()).toBe('1234.56');
    });

    it('traite null/undefined comme zero', () => {
      expect(toMinorUnits(null, 'MGA')).toBe(0);
      expect(toMinorUnits(undefined, 'EUR')).toBe(0);
    });

    it('formate pour l affichage avec la devise', () => {
      expect(formatMoney(Money.of('1234.56', 'EUR'), 'fr-FR')).toContain('1');
      expect(formatMoney(Money.of('1234.56', 'EUR'), 'en-US')).toContain('1,234.56');
      expect(formatMoney(Money.of('1234.56', 'MGA'), 'en-US')).toContain('MGA');
    });
  });
});
