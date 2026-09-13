export type RuntimeStatus =
  | 'NOT_RESOLVED'
  | 'RESOLVING'
  | 'RESOLVED'
  | 'PARTIALLY_RESOLVED'
  | 'BLOCKED'
  | 'DEGRADED'
  | 'ERROR';

export type RuntimeResolutionState = 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'DEGRADED' | 'HIDDEN' | 'UNAVAILABLE' | 'ERROR';

export type RuntimeReasonCode =
  | 'DECLARED_ENABLED'
  | 'DECLARED_DISABLED'
  | 'RULE_MATCHED'
  | 'RULE_NOT_MATCHED'
  | 'DEPENDENCY_MISSING'
  | 'CAPABILITY_MISSING'
  | 'ENTITLEMENT_MISSING'
  | 'PERMISSION_MISSING'
  | 'MODULE_INACTIVE'
  | 'ENVIRONMENT_NOT_ALLOWED'
  | 'FEATURE_NOT_AVAILABLE'
  | 'CONFLICT'
  | 'RUNTIME_DEPENDENCY_CYCLE'
  | 'RUNTIME_FEATURE_REFERENCE_INVALID'
  | 'RUNTIME_MODULE_REFERENCE_INVALID'
  | 'RUNTIME_ERROR';

export interface PackManifestModule {
  code: string;
  active?: boolean;
  enabled?: boolean;
  defaultEnabled?: boolean;
  required?: boolean;
  displayOrder?: number;
  environments?: string[];
  visibility?: 'PUBLIC' | 'ADMIN' | 'INTERNAL' | 'HIDDEN';
  dependencies?: string[];
  capabilities?: string[];
}

export interface PackManifestFeature {
  code: string;
  moduleCode?: string;
  active?: boolean;
  enabled?: boolean;
  defaultEnabled?: boolean;
  status?: string;
  required?: boolean;
  entitlement?: string;
  capability?: string;
  capabilities?: string[];
  requiredPermission?: string;
  requiredPermissions?: string[];
  environments?: string[];
  visibility?: 'PUBLIC' | 'ADMIN' | 'INTERNAL' | 'HIDDEN';
  dependencies?: string[];
  optionalCapabilities?: string[];
  configuration?: Record<string, unknown>;
}

export interface PackManifestDependency {
  code: string;
  type?: 'REQUIRED' | 'OPTIONAL' | 'CONFLICTS_WITH';
  source?: string;
  targetType?: 'MODULE' | 'FEATURE' | 'CAPABILITY' | 'PACK';
  targetRef?: string;
}

export interface PackManifestRule {
  code: string;
  featureCode?: string;
  moduleCode?: string;
  when?: Record<string, unknown>;
  effect?: 'ENABLE' | 'DISABLE' | 'ALLOW' | 'DENY' | 'SHOW' | 'HIDE';
}

export interface RuntimeRuleDecision {
  targetType: 'MODULE' | 'FEATURE';
  targetRef: string;
  effect: 'ENABLE' | 'DISABLE' | 'ALLOW' | 'DENY' | 'SHOW' | 'HIDE';
  matched: boolean;
  ruleCode?: string;
  details?: Record<string, unknown>;
}

export interface PackManifest {
  contract: 'techzone.pack-manifest';
  contractVersion: string;
  pack: { code: string; version: string };
  modules: PackManifestModule[];
  features: PackManifestFeature[];
  capabilities: Record<string, string[]>;
  dependencies: PackManifestDependency[];
  rules: PackManifestRule[];
  manifestHash: string;
}

export interface RuntimeContext {
  tenantId: string;
  applicationId: string;
  applicationVersion?: string;
  userId?: string;
  organizationId?: string;
  siteId?: string;
  environment: string;
  subscriptionPlan?: string;
  entitlements?: string[];
  permissions?: string[];
  capabilities?: string[];
  featureFlags?: Record<string, boolean>;
  locale?: string;
  timezone?: string;
  contextRevision?: string;
  entitlementRevision?: string;
  capabilityRevision?: string;
  ruleRevision?: string;
  ruleDecisions?: RuntimeRuleDecision[];
}

export type RuntimeProjection = 'FULL' | 'UI' | 'API' | 'DIAGNOSTIC';

export interface EffectiveRuntimeManifest {
  contract: 'techzone.effective-runtime-manifest';
  contractVersion: '1.0';
  sourceManifest: { packCode: string; packVersion: string; manifestHash: string };
  context: { tenantId: string; applicationId: string; environment: string };
  modules: Array<RuntimeResolutionItem & { features?: number; activeFeatures?: number; blockedFeatures?: number; order?: number; configurationRef?: string; visibility?: string; moduleCode?: string; }>; 
  features: Array<RuntimeResolutionItem & { moduleCode?: string; dependencyState: string; capabilityState: string; ruleDecisions: RuntimeRuleDecision[]; visibility?: string; configuration?: unknown; requiredPermissions?: string[]; requiredCapabilities?: string[]; }>; 
  capabilities: { available: string[]; required: string[]; degraded?: string[]; unavailable?: string[] };
  dependencies?: { resolved?: Array<{ source: string; target: string }>; optionalMissing?: string[]; blocking?: string[] };
  permissions?: { granted?: string[] };
  configuration?: Record<string, unknown>;
  restrictions?: Array<{ type: string; target: string; reasonCode: string }>;
  diagnostics?: { warnings?: number; errors?: number; blockedItems?: number };
  integrity?: { effectiveManifestHash?: string; canonicalizationVersion?: string; snapshotHash?: string };
  capabilityDependencyResolution?: unknown;
  resolution: { status: RuntimeStatus; issues: RuntimeIssue[] };
  summary?: { modules: Record<string, number>; features: Record<string, number> };
  effectiveManifestHash: string;
}

export interface RuntimeResolutionItem {
  code: string;
  active: boolean;
  state: RuntimeResolutionState;
  reason: string;
  reasonCode: RuntimeReasonCode;
  details: Record<string, unknown>;
}

export interface RuntimeIssue {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApplicationContextProvider {
  resolve(context: RuntimeContext): Promise<Partial<RuntimeContext>>;
}

export interface IamContextProvider {
  resolve(context: RuntimeContext): Promise<Partial<RuntimeContext>>;
}

export interface EntitlementProvider {
  resolve(context: RuntimeContext): Promise<{ entitlements: string[] }>;
}

export interface CapabilityProvider {
  resolve(context: RuntimeContext): Promise<{ capabilities: string[] }>;
  resolveCapabilities?(codes: string[], context: RuntimeContext): Promise<{ capabilities: Array<{ code: string; state?: string; provider?: string; version?: string; dependencies?: Array<{ code: string; type?: 'REQUIRED' | 'OPTIONAL' | 'RECOMMENDS' | 'IMPLIES'; versionRange?: string }> }>; providerRevision?: string }>;
}