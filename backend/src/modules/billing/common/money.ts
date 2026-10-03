/**
 * Représentation monétaire déterministe (CDC 10 / CDC 97 / RG-BILL-006).
 *
 * Règles :
 *  - tout montant est un ENTIER en unités mineures (centimes, arirary/2) ;
 *  - aucun flottant binaire n'intervient dans un calcul financier ;
 *  - une somme sans devise est impossible : `Money` porte toujours sa devise ;
 *  - l'exposant d'une devise est isolé dans CURRENCY_EXPONENTS : le CDC n'arrête
 *    pas l'exposant de MGA, la décision est donc centralisée et testée plutôt
 *    que dispersée dans le code.
 */

export const SUPPORTED_CURRENCIES = ['MGA', 'EUR', 'USD'] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

/**
 * ISO 4217 minor units. MGA suit la norme (2) et reste aligné sur la colonne
 * `Decimal(18,2)` utilisée partout dans le schéma : changer cette décision est
 * un changement de constante + de largeur de colonne, jamais une correction
 * dispersée dans les services.
 */
export const CURRENCY_EXPONENTS: Record<CurrencyCode, number> = {
  MGA: 2,
  EUR: 2,
  USD: 2,
};

export const DEFAULT_CURRENCY: CurrencyCode = 'MGA';

export function isSupportedCurrency(value: unknown): value is CurrencyCode {
  return typeof value === 'string' && (SUPPORTED_CURRENCIES as readonly string[]).includes(value);
}

export function assertCurrency(value: unknown): CurrencyCode {
  if (!isSupportedCurrency(value)) {
    throw new RangeError(
      `Devise non supportee : ${String(value)}. Devises autorisees : ${SUPPORTED_CURRENCIES.join(', ')}.`,
    );
  }
  return value;
}

export function currencyExponent(currency: CurrencyCode): number {
  return CURRENCY_EXPONENTS[currency];
}

/** Arrondi commercial demi-supérieur, symétrique, sur un entier d'unités mineures. */
export function roundMinorUnits(value: number): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`Montant non fini : ${String(value)}`);
  }
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/**
 * Convertit une saisie humaine ("1234.56", "1 234,56", 1234.56) en unités
 * mineures entières sans jamais laisser de flottant s'accumuler.
 */
export function parseAmountToMinorUnits(input: string | number, currency: CurrencyCode): number {
  assertCurrency(currency);
  const exponent = currencyExponent(currency);
  const factor = 10 ** exponent;

  if (typeof input === 'number') {
    if (!Number.isFinite(input)) {
      throw new RangeError(`Montant non fini : ${String(input)}`);
    }
    // Math.round(input * factor) reste entier de bout en bout : le seul flottant
    // est la saisie, jamais le résultat stocké ou cumulé.
    return roundMinorUnits(input * factor);
  }

  const normalized = input
    .trim()
    .replace(/\s|\u00a0/g, '')
    .replace(/(\d),(?=\d{1,2}$)/, '$1.')
    .replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
    throw new RangeError(`Montant invalide : ${input}`);
  }
  const [whole, fraction = ''] = normalized.split('.');
  const padded = (fraction + '0'.repeat(exponent)).slice(0, exponent);
  const sign = whole.startsWith('-') ? -1 : 1;
  const magnitude = Number(whole.replace('-', '') + (exponent > 0 ? padded : ''));
  if (!Number.isSafeInteger(magnitude)) {
    throw new RangeError(`Montant hors plage : ${input}`);
  }
  return sign * magnitude;
}

/** Un montant monétaire immuable : entier en unités mineures + devise. */
export class Money {
  private constructor(
    readonly minorUnits: number,
    readonly currency: CurrencyCode,
  ) {
    if (!Number.isSafeInteger(minorUnits)) {
      throw new RangeError(`Montant non entier en unites mineures : ${String(minorUnits)}`);
    }
  }

  static ofMinorUnits(minorUnits: number, currency: CurrencyCode): Money {
    assertCurrency(currency);
    return new Money(minorUnits, currency);
  }

  static of(input: string | number, currency: CurrencyCode = DEFAULT_CURRENCY): Money {
    return new Money(parseAmountToMinorUnits(input, currency), currency);
  }

  static zero(currency: CurrencyCode = DEFAULT_CURRENCY): Money {
    return new Money(0, currency);
  }

  /** Conversion depuis une autre devise vers la meme famille d'exposant. */
  static fromDecimalString(value: string, currency: CurrencyCode): Money {
    return Money.of(value, currency);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits + other.minorUnits, this.currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.minorUnits - other.minorUnits, this.currency);
  }

  /** Multiplication par une quantité qui peut être décimale (ex. 3.5 seats). */
  multiply(quantity: number): Money {
    if (!Number.isFinite(quantity)) {
      throw new RangeError(`Quantite non finie : ${String(quantity)}`);
    }
    return new Money(roundMinorUnits(this.minorUnits * quantity), this.currency);
  }

  /** Pourcentage appliqué sur l'entier : aucun arrondi en cascade. */
  percentage(rate: number): Money {
    if (!Number.isFinite(rate)) {
      throw new RangeError(`Taux non fini : ${String(rate)}`);
    }
    return new Money(roundMinorUnits((this.minorUnits * rate) / 100), this.currency);
  }

  negate(): Money {
    return new Money(-this.minorUnits, this.currency);
  }

  abs(): Money {
    return new Money(Math.abs(this.minorUnits), this.currency);
  }

  isZero(): boolean {
    return this.minorUnits === 0;
  }

  isNegative(): boolean {
    return this.minorUnits < 0;
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minorUnits > other.minorUnits;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this.minorUnits < other.minorUnits;
  }

  equals(other: Money): boolean {
    return this.currency === other.currency && this.minorUnits === other.minorUnits;
  }

  min(other: Money): Money {
    this.assertSameCurrency(other);
    return this.minorUnits <= other.minorUnits ? this : other;
  }

  clampToZero(): Money {
    return this.minorUnits < 0 ? Money.zero(this.currency) : this;
  }

  /** Chaîne décimale exacte, sans notation scientifique ni perte. */
  toDecimalString(): string {
    const exponent = currencyExponent(this.currency);
    if (exponent === 0) return String(this.minorUnits);
    const negative = this.minorUnits < 0;
    const digits = String(Math.abs(this.minorUnits)).padStart(exponent + 1, '0');
    const whole = digits.slice(0, digits.length - exponent);
    const fraction = digits.slice(digits.length - exponent);
    return `${negative ? '-' : ''}${whole}.${fraction}`;
  }

  toJSON() {
    return { amount: this.toDecimalString(), currency: this.currency };
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new RangeError(
        `Devise incompatible : ${this.currency} et ${other.currency}. Aucune conversion implicite n'est autorisee.`,
      );
    }
  }
}

export function sumMoney(values: readonly Money[], currency: CurrencyCode = DEFAULT_CURRENCY): Money {
  return values.reduce((total, value) => total.add(value), Money.zero(currency));
}

/**
 * Normalise une valeur|Prisma.Decimal|null vers des unités mineures entières.
 * Prisma renvoie un Decimal (chaîne) : on repasse par l'entier, jamais par un
 * double, pour qu'une lecture puis une réécriture ne dérive pas.
 */
export function toMinorUnits(value: unknown, currency: CurrencyCode): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const raw = String(value);
    const exponent = currencyExponent(currency);
    const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(raw.trim());
    if (!match) throw new RangeError(`Valeur monetaire illisible : ${raw}`);
    const fraction = (match[3] ?? '').slice(0, exponent).padEnd(exponent, '0');
    const magnitude = Number(match[2] + fraction);
    return match[1] === '-' ? -magnitude : magnitude;
  }
  if (typeof value === 'number') {
    return roundMinorUnits(value * 10 ** currencyExponent(currency));
  }
  return parseAmountToMinorUnits(String(value), currency);
}

/** Formate pour l'affichage : "123 456,00 MGA" (fr-FR), sans jamais reconstruire un flottant. */
export function formatMoney(money: Money, locale = 'fr-FR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: currencyExponent(money.currency),
    maximumFractionDigits: currencyExponent(money.currency),
  }).format(Number(money.toDecimalString()));
}

/** Affiche une valeur stockée en base (Decimal Prisma ou nombre) sans perte. */
export function formatStoredAmount(value: unknown, currency: CurrencyCode, locale = 'fr-FR'): string {
  return formatMoney(Money.ofMinorUnits(toMinorUnits(value, currency), currency), locale);
}