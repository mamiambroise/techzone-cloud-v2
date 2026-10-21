import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { TraceContext } from './observability.contracts';

export const traceContext = new AsyncLocalStorage<TraceContext>();
const VALID_ID = /^[A-Za-z0-9_-]{1,128}$/;

export function safeTraceId(value: unknown): string {
  return typeof value === 'string' && VALID_ID.test(value) ? value : randomUUID();
}

export function safeOptionalId(value: unknown): string | undefined {
  return typeof value === 'string' && VALID_ID.test(value) ? value : undefined;
}
