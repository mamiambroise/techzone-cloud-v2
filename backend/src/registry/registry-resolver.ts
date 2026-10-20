import semver from 'semver';

export type RegistryCandidateAvailability = {
  environmentCode: string | null;
  status: string;
  configured: boolean;
  reachable: boolean;
};

export type RegistryCandidate = {
  id: string;
  namespace: string;
  subDomain: string;
  key: string;
  stableKey: string;
  version: string;
  owner: string;
  provider: string;
  scope: string;
  status: string;
  capabilities: string[];
  schemaRef: string | null;
  availability: RegistryCandidateAvailability[];
};

export type RegistryRequirement = {
  key: string;
  entryId?: string;
  version?: string;
  versionRange?: string;
  provider?: string;
  requiredCapabilities?: string[];
  schemaRef?: string;
  environmentCode?: string;
  published?: boolean;
  allowDeprecated?: boolean;
};

export type RegistryCandidateEvaluation = {
  candidate: RegistryCandidate;
  reasons: string[];
};

export type RegistryResolutionResult = {
  requirement: RegistryRequirement;
  status: 'COMPATIBLE' | 'INCOMPATIBLE' | 'UNAVAILABLE' | 'MISSING' | 'DEPRECATED';
  selectedCandidate: RegistryCandidate | null;
  rejectedCandidates: RegistryCandidateEvaluation[];
  warnings: string[];
};

export function evaluateRegistryCandidates(
  requirement: RegistryRequirement,
  candidates: RegistryCandidate[],
): RegistryResolutionResult {
  if (requirement.published && !requirement.version) {
    return {
      requirement,
      status: 'INCOMPATIBLE',
      selectedCandidate: null,
      rejectedCandidates: candidates.map((candidate) => ({
        candidate,
        reasons: ['REGISTRY_VERSION_LOCK_REQUIRED'],
      })),
      warnings: [],
    };
  }

  const matchingKey = candidates.filter(
    (candidate) =>
      candidate.stableKey === requirement.key &&
      (!requirement.entryId || candidate.id === requirement.entryId),
  );
  if (matchingKey.length === 0) {
    return {
      requirement,
      status: 'MISSING',
      selectedCandidate: null,
      rejectedCandidates: [],
      warnings: [],
    };
  }

  const versionRange = requirement.versionRange
    ? semver.validRange(requirement.versionRange)
    : null;
  if (requirement.versionRange && !versionRange) {
    throw new RangeError('REGISTRY_VERSION_RANGE_INVALID');
  }
  if (requirement.version && !semver.valid(requirement.version)) {
    throw new RangeError('REGISTRY_VERSION_INVALID');
  }

  const rejectedCandidates: RegistryCandidateEvaluation[] = [];
  const acceptedCandidates: RegistryCandidate[] = [];

  for (const candidate of matchingKey) {
    const reasons: string[] = [];
    const parsedVersion = semver.valid(candidate.version);

    if (!parsedVersion) reasons.push('REGISTRY_VERSION_INVALID');
    else if (requirement.version && candidate.version !== requirement.version) {
      reasons.push('REGISTRY_VERSION_NOT_FOUND');
    } else if (
      versionRange &&
      !semver.satisfies(parsedVersion, versionRange)
    ) {
      reasons.push('REGISTRY_VERSION_CONFLICT');
    }

    if (requirement.provider && candidate.provider !== requirement.provider) {
      reasons.push('REGISTRY_PROVIDER_MISMATCH');
    }

    const capabilities = new Set(candidate.capabilities);
    if (
      requirement.requiredCapabilities?.some(
        (capability) => !capabilities.has(capability),
      )
    ) {
      reasons.push('REGISTRY_CAPABILITY_MISSING');
    }

    if (requirement.schemaRef && candidate.schemaRef !== requirement.schemaRef) {
      reasons.push('REGISTRY_SCHEMA_UNSUPPORTED');
    }

    if (candidate.status === 'DISABLED' || candidate.status === 'REMOVED') {
      reasons.push('REGISTRY_ENTRY_DISABLED');
    } else if (candidate.status === 'UNAVAILABLE') {
      reasons.push('REGISTRY_ENTRY_UNAVAILABLE');
    } else if (
      candidate.status === 'DEPRECATED' &&
      !requirement.allowDeprecated
    ) {
      reasons.push('REGISTRY_ENTRY_DEPRECATED');
    } else if (candidate.status !== 'AVAILABLE' && candidate.status !== 'DEPRECATED') {
      reasons.push('REGISTRY_ENTRY_NOT_AVAILABLE');
    }

    if (requirement.environmentCode) {
      const environmentAvailability = candidate.availability.find(
        (item) =>
          item.environmentCode?.toUpperCase() ===
          requirement.environmentCode?.toUpperCase(),
      );
      if (
        environmentAvailability?.status !== 'AVAILABLE' ||
        !environmentAvailability.configured ||
        !environmentAvailability.reachable
      ) {
        reasons.push('REGISTRY_ENVIRONMENT_MISMATCH');
      }
    } else if (
      candidate.availability.some(
        (item) =>
          item.status === 'AVAILABLE' && (!item.configured || !item.reachable),
      )
    ) {
      reasons.push('REGISTRY_PROVIDER_UNREACHABLE');
    }

    if (reasons.length > 0) rejectedCandidates.push({ candidate, reasons });
    else acceptedCandidates.push(candidate);
  }

  acceptedCandidates.sort((a, b) => {
    const versionOrder = semver.rcompare(a.version, b.version);
    return (
      versionOrder ||
      a.stableKey.localeCompare(b.stableKey) ||
      a.id.localeCompare(b.id)
    );
  });

  const selectedCandidate = acceptedCandidates[0] ?? null;
  const deprecated = selectedCandidate?.status === 'DEPRECATED';
  const unavailableOnly =
    !selectedCandidate &&
    rejectedCandidates.length > 0 &&
    rejectedCandidates.every(({ reasons }) =>
      reasons.every((reason) =>
        [
          'REGISTRY_ENTRY_UNAVAILABLE',
          'REGISTRY_ENTRY_NOT_AVAILABLE',
          'REGISTRY_ENVIRONMENT_MISMATCH',
          'REGISTRY_PROVIDER_UNREACHABLE',
        ].includes(reason),
      ),
    );

  return {
    requirement,
    status: selectedCandidate
      ? deprecated
        ? 'DEPRECATED'
        : 'COMPATIBLE'
      : unavailableOnly
        ? 'UNAVAILABLE'
        : 'INCOMPATIBLE',
    selectedCandidate,
    rejectedCandidates,
    warnings: deprecated ? ['REGISTRY_ENTRY_DEPRECATED'] : [],
  };
}
