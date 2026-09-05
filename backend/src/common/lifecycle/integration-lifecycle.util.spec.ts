import {
  canTransitionIntegrationEntity,
  IntegrationEntityLifecycleStatus,
} from './integration-lifecycle.util';

describe('IntegrationLifecycleUtil', () => {
  describe('canTransitionIntegrationEntity', () => {
    it('should allow DRAFT → CONFIGURING', () => {
      expect(canTransitionIntegrationEntity('DRAFT', 'CONFIGURING')).toBe(true);
    });

    it('should allow DRAFT → ARCHIVED', () => {
      expect(canTransitionIntegrationEntity('DRAFT', 'ARCHIVED')).toBe(true);
    });

    it('should allow CONFIGURING → VALIDATING', () => {
      expect(canTransitionIntegrationEntity('CONFIGURING', 'VALIDATING')).toBe(true);
    });

    it('should allow VALIDATING → READY', () => {
      expect(canTransitionIntegrationEntity('VALIDATING', 'READY')).toBe(true);
    });

    it('should allow READY → ACTIVE', () => {
      expect(canTransitionIntegrationEntity('READY', 'ACTIVE')).toBe(true);
    });

    it('should allow ACTIVE → DISABLED', () => {
      expect(canTransitionIntegrationEntity('ACTIVE', 'DISABLED')).toBe(true);
    });

    it('should allow DISABLED → ACTIVE', () => {
      expect(canTransitionIntegrationEntity('DISABLED', 'ACTIVE')).toBe(true);
    });

    it('should NOT allow DRAFT → ACTIVE (skip states)', () => {
      expect(canTransitionIntegrationEntity('DRAFT', 'ACTIVE')).toBe(false);
    });

    it('should NOT allow ACTIVE → DRAFT (backward)', () => {
      expect(canTransitionIntegrationEntity('ACTIVE', 'DRAFT')).toBe(false);
    });

    it('should NOT allow ARCHIVED → anything (terminal)', () => {
      const terminal = 'ARCHIVED' as IntegrationEntityLifecycleStatus;
      expect(canTransitionIntegrationEntity(terminal, 'ACTIVE')).toBe(false);
      expect(canTransitionIntegrationEntity(terminal, 'DRAFT')).toBe(false);
    });
  });
});
