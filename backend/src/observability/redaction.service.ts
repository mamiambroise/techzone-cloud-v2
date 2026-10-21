import { Injectable } from '@nestjs/common';

const SENSITIVE_KEY = /(?:password|authorization|cookie|token|api[_-]?key|client[_-]?secret|mfa|totp|credential|database[_-]?url|payment[_-]?secret|provider[_-]?token)/i;
const CONNECTION_CREDENTIAL = /([a-z][a-z0-9+.-]*:\/\/[^:\s]+:)([^@\s]+)(@)/gi;
const BEARER = /\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi;

/** Sanitises arbitrary data before it crosses a telemetry or diagnostic boundary. */
@Injectable()
export class RedactionService {
  redact<T>(value: T): T {
    return this.walk(value, new WeakSet()) as T;
  }

  private walk(value: unknown, seen: WeakSet<object>): unknown {
    if (typeof value === 'string') return value.replace(CONNECTION_CREDENTIAL, '$1[REDACTED]$3').replace(BEARER, 'Bearer [REDACTED]');
    if (value === null || typeof value !== 'object') return value;
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    if (Array.isArray(value)) return value.map((item) => this.walk(item, seen));
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_KEY.test(key) ? '[REDACTED]' : this.walk(item, seen);
    }
    return result;
  }
}
