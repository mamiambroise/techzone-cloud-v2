import { AsyncLocalStorage } from 'node:async_hooks';

// Correlation only: no credentials or request payloads in the context.
export const integrationRequestContext = new AsyncLocalStorage<{ traceId: string }>();
