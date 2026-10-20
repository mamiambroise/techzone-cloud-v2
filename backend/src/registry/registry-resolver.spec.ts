import {
  evaluateRegistryCandidates,
  RegistryCandidate,
} from './registry-resolver';

const candidate = (
  version: string,
  overrides: Partial<RegistryCandidate> = {},
): RegistryCandidate => ({
  id: version,
  namespace: 'UI',
  subDomain: 'UI_COMPONENT',
  key: 'datatable',
  stableKey: 'ui.component.datatable',
  version,
  owner: 'ui-builder',
  provider: 'UI_BUILDER',
  scope: 'GLOBAL',
  status: 'AVAILABLE',
  capabilities: ['binding', 'pagination'],
  schemaRef: 'ui.definition.v1',
  availability: [],
  ...overrides,
});

describe('evaluateRegistryCandidates', () => {
  it('selects the highest compatible semantic version deterministically', () => {
    const result = evaluateRegistryCandidates(
      { key: 'ui.component.datatable', versionRange: '^1.0.0' },
      [candidate('1.2.0'), candidate('1.3.0'), candidate('1.1.0')],
    );

    expect(result.status).toBe('COMPATIBLE');
    expect(result.selectedCandidate?.version).toBe('1.3.0');
  });

  it('requires exact versions for published resolution', () => {
    const result = evaluateRegistryCandidates(
      { key: 'ui.component.datatable', versionRange: '^1.0.0', published: true },
      [candidate('1.3.0')],
    );

    expect(result.status).toBe('INCOMPATIBLE');
    expect(result.selectedCandidate).toBeNull();
    expect(result.rejectedCandidates[0].reasons).toContain(
      'REGISTRY_VERSION_LOCK_REQUIRED',
    );
  });

  it('keeps a published lock on the exact entry even when a newer version exists', () => {
    const result = evaluateRegistryCandidates(
      {
        key: 'ui.component.datatable',
        entryId: 'entry-1.2.0',
        version: '1.2.0',
        published: true,
      },
      [
        candidate('1.2.0', { id: 'entry-1.2.0' }),
        candidate('1.3.0', { id: 'entry-1.3.0' }),
      ],
    );

    expect(result.status).toBe('COMPATIBLE');
    expect(result.selectedCandidate?.id).toBe('entry-1.2.0');
  });

  it('rejects candidates missing requested capability, schema, or environment proof', () => {
    const result = evaluateRegistryCandidates(
      {
        key: 'ui.component.datatable',
        version: '1.2.0',
        requiredCapabilities: ['export'],
        schemaRef: 'ui.definition.v2',
        environmentCode: 'PRODUCTION',
      },
      [
        candidate('1.2.0', {
          availability: [{
            environmentCode: 'DEVELOPMENT',
            status: 'AVAILABLE',
            configured: true,
            reachable: true,
          }],
        }),
      ],
    );

    expect(result.status).toBe('INCOMPATIBLE');
    expect(result.rejectedCandidates[0].reasons).toEqual(
      expect.arrayContaining([
        'REGISTRY_CAPABILITY_MISSING',
        'REGISTRY_SCHEMA_UNSUPPORTED',
        'REGISTRY_ENVIRONMENT_MISMATCH',
      ]),
    );
  });

  it('never selects disabled or unavailable entries', () => {
    const result = evaluateRegistryCandidates(
      { key: 'ui.component.datatable', versionRange: '^1.0.0' },
      [
        candidate('1.2.0', { status: 'DISABLED' }),
        candidate('1.1.0', { status: 'UNAVAILABLE' }),
      ],
    );

    expect(result.selectedCandidate).toBeNull();
    expect(result.rejectedCandidates.map(({ reasons }) => reasons[0])).toEqual([
      'REGISTRY_ENTRY_DISABLED',
      'REGISTRY_ENTRY_UNAVAILABLE',
    ]);
  });

  it('does not report configured-but-unreachable providers as available', () => {
    const result = evaluateRegistryCandidates(
      { key: 'ui.component.datatable', version: '1.2.0' },
      [
        candidate('1.2.0', {
          availability: [{
            environmentCode: 'PRODUCTION',
            status: 'AVAILABLE',
            configured: true,
            reachable: false,
          }],
        }),
      ],
    );

    expect(result.status).toBe('UNAVAILABLE');
    expect(result.selectedCandidate).toBeNull();
    expect(result.rejectedCandidates[0].reasons).toContain(
      'REGISTRY_PROVIDER_UNREACHABLE',
    );
  });
});
