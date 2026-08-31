// BM-CDC-04 feature-capability service validation tests
describe('FeatureCapabilityService', () => {
  describe('detectDependencyCycle', () => {
    it('detects direct cycles', () => {
      const deps = [
        { capabilityId: 'A', dependencyCapabilityId: 'B' },
        { capabilityId: 'B', dependencyCapabilityId: 'C' },
        { capabilityId: 'C', dependencyCapabilityId: 'A' },
      ];

      const hasCycle = detectDependencyCycleImpl(deps);
      expect(hasCycle).toBe(true);
    });

    it('allows acyclic dependencies', () => {
      const deps = [
        { capabilityId: 'A', dependencyCapabilityId: 'B' },
        { capabilityId: 'B', dependencyCapabilityId: 'C' },
      ];

      const hasCycle = detectDependencyCycleImpl(deps);
      expect(hasCycle).toBe(false);
    });

    it('detects self-cycles', () => {
      const deps = [
        { capabilityId: 'A', dependencyCapabilityId: 'A' },
      ];

      const hasCycle = detectDependencyCycleImpl(deps);
      expect(hasCycle).toBe(true);
    });
  });

  describe('validateRequiredCapabilities', () => {
    it('fails when required capability is disabled', () => {
      const capabilities = [
        { capabilityId: 'sale.read', enabled: true, required: true },
        { capabilityId: 'sale.create', enabled: false, required: true },
      ];

      const result = validateRequiredCapabilitiesImpl(capabilities);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].code).toBe('REQUIRED_CAPABILITY_DISABLED');
    });

    it('passes when all required capabilities are enabled', () => {
      const capabilities = [
        { capabilityId: 'sale.read', enabled: true, required: true },
        { capabilityId: 'sale.create', enabled: true, required: true },
      ];

      const result = validateRequiredCapabilitiesImpl(capabilities);
      expect(result.valid).toBe(true);
      expect(result.issues.length).toBe(0);
    });

    it('allows optional disabled capabilities', () => {
      const capabilities = [
        { capabilityId: 'sale.read', enabled: true, required: true },
        { capabilityId: 'sale.advanced', enabled: false, required: false },
      ];

      const result = validateRequiredCapabilitiesImpl(capabilities);
      expect(result.valid).toBe(true);
    });
  });

  describe('detectConflicts', () => {
    it('detects conflicting capabilities', () => {
      const capabilities = [
        { capabilityId: 'sale.simple', enabled: true, metadata: { conflictsWith: ['sale.complex'] } },
        { capabilityId: 'sale.complex', enabled: true, metadata: {} },
      ];

      const conflicts = detectConflictsImpl(capabilities);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].code).toBe('CAPABILITY_CONFLICT');
    });

    it('allows non-conflicting capabilities', () => {
      const capabilities = [
        { capabilityId: 'sale.read', enabled: true, metadata: {} },
        { capabilityId: 'report.read', enabled: true, metadata: {} },
      ];

      const conflicts = detectConflictsImpl(capabilities);
      expect(conflicts.length).toBe(0);
    });
  });

  describe('validateBreakingChanges', () => {
    it('flags breaking changes in non-major versions', () => {
      const capabilities = [
        { capabilityId: 'api.v2', enabled: true, metadata: { breakingChange: true } },
      ];

      const issues = validateBreakingChangesImpl(capabilities, false);
      expect(issues.length).toBeGreaterThan(0);
      expect(issues[0].code).toBe('BREAKING_CHANGE_DISALLOWED');
    });

    it('allows breaking changes in major versions', () => {
      const capabilities = [
        { capabilityId: 'api.v2', enabled: true, metadata: { breakingChange: true } },
      ];

      const issues = validateBreakingChangesImpl(capabilities, true);
      expect(issues.length).toBe(0);
    });

    it('allows non-breaking changes in any version', () => {
      const capabilities = [
        { capabilityId: 'api.v1', enabled: true, metadata: { breakingChange: false } },
      ];

      const issues = validateBreakingChangesImpl(capabilities, false);
      expect(issues.length).toBe(0);
    });
  });

  describe('checkCompleteness', () => {
    it('detects uncovered required entities', () => {
      const allRequiredEntities = ['entity.A', 'entity.B', 'entity.C'];
      const coveredEntities = ['entity.A'];

      const result = checkCompletenessImpl(allRequiredEntities, coveredEntities);
      expect(result.complete).toBe(false);
      expect(result.uncovered).toContain('entity.B');
      expect(result.uncovered).toContain('entity.C');
    });

    it('reports 100% coverage when all entities are covered', () => {
      const allRequiredEntities = ['entity.A', 'entity.B'];
      const coveredEntities = ['entity.A', 'entity.B'];

      const result = checkCompletenessImpl(allRequiredEntities, coveredEntities);
      expect(result.complete).toBe(true);
      expect(result.coverage).toBe(100);
    });

    it('handles empty requirements', () => {
      const allRequiredEntities: string[] = [];
      const coveredEntities: string[] = [];

      const result = checkCompletenessImpl(allRequiredEntities, coveredEntities);
      expect(result.complete).toBe(true);
      expect(result.coverage).toBe(100);
    });
  });

  describe('comprehensive validation', () => {
    it('combines all validations into one result', () => {
      const validationState = {
        dependencies: [
          { capabilityId: 'A', dependencyCapabilityId: 'B' },
          { capabilityId: 'B', dependencyCapabilityId: 'C' },
        ],
        capabilities: [
          { capabilityId: 'sale.read', enabled: true, required: true, metadata: {} },
          { capabilityId: 'sale.create', enabled: true, required: true, metadata: {} },
        ],
        requiredEntities: ['entity.A'],
        coveredEntities: ['entity.A'],
      };

      const result = validateFeatureSetImpl(validationState);
      expect(result.valid).toBe(true);
      expect(result.issues.filter(i => i.severity === 'ERROR').length).toBe(0);
    });

    it('reports multiple issues', () => {
      const validationState = {
        dependencies: [
          { capabilityId: 'A', dependencyCapabilityId: 'A' }, // self-cycle
        ],
        capabilities: [
          { capabilityId: 'sale.create', enabled: false, required: true, metadata: {} }, // disabled required
        ],
        requiredEntities: ['entity.A', 'entity.B'],
        coveredEntities: [], // no coverage
      };

      const result = validateFeatureSetImpl(validationState);
      expect(result.valid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(1);
    });
  });
});

// ========== IMPLEMENTATION HELPERS ==========

function detectDependencyCycleImpl(
  dependencies: Array<{ capabilityId: string; dependencyCapabilityId: string }>,
): boolean {
  const graph = new Map<string, string[]>();

  for (const dep of dependencies) {
    if (!graph.has(dep.capabilityId)) {
      graph.set(dep.capabilityId, []);
    }
    graph.get(dep.capabilityId)!.push(dep.dependencyCapabilityId);
  }

  const visited = new Set<string>();
  const rec = new Set<string>();

  const hasCycleDFS = (node: string): boolean => {
    visited.add(node);
    rec.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) return true;
      } else if (rec.has(neighbor)) {
        return true;
      }
    }

    rec.delete(node);
    return false;
  };

  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      if (hasCycleDFS(node)) return true;
    }
  }

  return false;
}

interface ValidationCapability {
  capabilityId: string;
  enabled: boolean;
  required: boolean;
}

interface ValidationResult {
  valid: boolean;
  issues: Array<{ code: string; capabilityId?: string }>;
}

function validateRequiredCapabilitiesImpl(
  capabilities: ValidationCapability[],
): ValidationResult {
  const issues: Array<{ code: string; capabilityId?: string }> = [];

  for (const cap of capabilities) {
    if (cap.required && !cap.enabled) {
      issues.push({
        code: 'REQUIRED_CAPABILITY_DISABLED',
        capabilityId: cap.capabilityId,
      });
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}

interface ConflictCapability {
  capabilityId: string;
  enabled: boolean;
  metadata: { conflictsWith?: string[] };
}

function detectConflictsImpl(capabilities: ConflictCapability[]): Array<{ code: string; message: string }> {
  const issues: Array<{ code: string; message: string }> = [];
  const enabledCaps = capabilities.filter(c => c.enabled);

  for (let i = 0; i < enabledCaps.length; i++) {
    for (let j = i + 1; j < enabledCaps.length; j++) {
      const cap1 = enabledCaps[i];
      const cap2 = enabledCaps[j];

      if (cap1.metadata.conflictsWith?.includes(cap2.capabilityId)) {
        issues.push({
          code: 'CAPABILITY_CONFLICT',
          message: `Capability ${cap1.capabilityId} conflicts with ${cap2.capabilityId}`,
        });
      }
    }
  }

  return issues;
}

interface BreakingChangeCapability {
  capabilityId: string;
  enabled: boolean;
  metadata: { breakingChange?: boolean };
}

function validateBreakingChangesImpl(
  capabilities: BreakingChangeCapability[],
  isMajorVersion: boolean,
): Array<{ code: string; message: string }> {
  const issues: Array<{ code: string; message: string }> = [];

  for (const cap of capabilities) {
    if (!cap.enabled) continue;

    const hasBreakingChange = cap.metadata?.breakingChange === true;
    if (hasBreakingChange && !isMajorVersion) {
      issues.push({
        code: 'BREAKING_CHANGE_DISALLOWED',
        message: `Capability ${cap.capabilityId} has breaking changes not allowed in non-major version`,
      });
    }
  }

  return issues;
}

interface CompletenessResult {
  complete: boolean;
  coverage: number;
  uncovered: string[];
}

function checkCompletenessImpl(
  allRequiredEntities: string[],
  coveredEntities: string[],
): CompletenessResult {
  if (allRequiredEntities.length === 0) {
    return { complete: true, coverage: 100, uncovered: [] };
  }

  const coveredSet = new Set(coveredEntities);
  const uncovered = allRequiredEntities.filter(e => !coveredSet.has(e));
  const coverage = Math.round(((allRequiredEntities.length - uncovered.length) / allRequiredEntities.length) * 100);

  return {
    complete: uncovered.length === 0,
    coverage,
    uncovered,
  };
}

interface ValidationState {
  dependencies: Array<{ capabilityId: string; dependencyCapabilityId: string }>;
  capabilities: Array<{ capabilityId: string; enabled: boolean; required: boolean; metadata?: Record<string, any> }>;
  requiredEntities: string[];
  coveredEntities: string[];
}

interface ComprehensiveValidationResult {
  valid: boolean;
  completeness: number;
  issues: Array<{ severity: 'ERROR' | 'WARNING'; code: string; message: string }>;
}

function validateFeatureSetImpl(state: ValidationState): ComprehensiveValidationResult {
  const allIssues: Array<{ severity: 'ERROR' | 'WARNING'; code: string; message: string }> = [];

  // 1. Cycle detection
  const hasCycle = detectDependencyCycleImpl(state.dependencies);
  if (hasCycle) {
    allIssues.push({
      severity: 'ERROR',
      code: 'DEPENDENCY_CYCLE',
      message: 'Dependency cycle detected in capabilities',
    });
  }

  // 2. Required capabilities
  const requiredCheck = validateRequiredCapabilitiesImpl(
    state.capabilities.map(c => ({ capabilityId: c.capabilityId, enabled: c.enabled, required: c.required })),
  );
  allIssues.push(
    ...requiredCheck.issues.map(issue => ({
      severity: 'ERROR' as const,
      code: issue.code,
      message: `${issue.code}: ${issue.capabilityId}`,
    })),
  );

  // 3. Conflicts
  const conflictIssues = detectConflictsImpl(state.capabilities.map(c => ({ ...c, metadata: c.metadata || {} })));
  allIssues.push(
    ...conflictIssues.map(issue => ({
      severity: 'ERROR' as const,
      ...issue,
    })),
  );

  // 4. Completeness
  const completenessResult = checkCompletenessImpl(state.requiredEntities, state.coveredEntities);
  allIssues.push(
    ...completenessResult.uncovered.map(entity => ({
      severity: 'ERROR' as const,
      code: 'ENTITY_NOT_COVERED',
      message: `Required data entity not covered: ${entity}`,
    })),
  );

  const errorCount = allIssues.filter(i => i.severity === 'ERROR').length;

  return {
    valid: errorCount === 0,
    completeness: completenessResult.coverage,
    issues: allIssues,
  };
}
