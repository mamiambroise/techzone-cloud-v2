const SENSITIVE_KEY = /(password|token|secret|authorization)/i;
const MASKED_VALUE = '[MASQUÉ]';

export function maskSecrets(value) {
  if (Array.isArray(value)) return value.map(maskSecrets);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      SENSITIVE_KEY.test(key) ? MASKED_VALUE : maskSecrets(nestedValue),
    ]),
  );
}
