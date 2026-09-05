export type RuntimeStatus =
  | 'NOT_RESOLVED'
  | 'RESOLVING'
  | 'RESOLVED'
  | 'PARTIALLY_RESOLVED'
  | 'BLOCKED'
  | 'DEGRADED'
  | 'ERROR';

export interface PackManifestModule {
  code: string;
  active?: boolean;
  required?: boolean;
}

export interface PackManifestFeature {
  code: string;
  moduleCode?: string;
  active?: boolean;
  required?: boolean;
  entitlement?: string;
  capability?: string;
}

export interface PackManifestDependency {
  code: string;
  type?: 'REQUIRED' | 'OPTIONAL' | 'CONFLICTS_WITH';
  source?: string;
}

export interface PackManifestRule {
  code: string;
  featureCode?: string;
  moduleCode?: string;
  when?: Record<string, unknown>;
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
}

export interface EffectiveRuntimeManifest {
  contract: 'techzone.effective-runtime-manifest';
  contractVersion: '1.0';
  sourceManifest: { packCode: string; packVersion: string; manifestHash: string };
  context: { tenantId: string; applicationId: string; environment: string };
  modules: Array<{ code: string; active: boolean; reason: string }>;
  features: Array<{ code: string; active: boolean; reason: string }>;
  capabilities: { available: string[]; required: string[] };
  resolution: { status: RuntimeStatus; issues: RuntimeIssue[] };
  effectiveManifestHash: string;
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
}