import { describe, expect, it } from 'vitest';
import { mapErrorToAction, mapErrorToMessage } from './errors.js';

describe('Automation error mapping', () => {
  it('maps backend codes to actionable French messages', () => {
    const error = { normalized: { code: 'AUTOMATION_RUNTIME_BLOCKED' } };
    expect(mapErrorToMessage(error)).toMatch(/Runtime bloque/);
    expect(mapErrorToAction(error)).toMatch(/prérequis du Runtime/);
  });

  it('handles permission and session errors without exposing backend details', () => {
    expect(mapErrorToMessage({ response: { status: 403, data: { message: 'internal detail' } } }))
      .toMatch(/droits nécessaires/);
    expect(mapErrorToMessage({ response: { status: 401 } })).toMatch(/session a expiré/);
  });
});
