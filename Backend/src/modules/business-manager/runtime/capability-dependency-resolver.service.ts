import { Inject, Injectable } from '@nestjs/common';
import { satisfiesVersion } from '../pack-manager/dependencies/dependency-resolver.utils';
import type { PackManifest, RuntimeContext } from './contracts/runtime.contracts';

export const RUNTIME_CAPABILITY_AVAILABILITY_PROVIDER = 'RUNTIME_CAPABILITY_AVAILABILITY_PROVIDER';

export type CapabilityState = 'AVAILABLE' | 'UNAVAILABLE' | 'DEGRADED' | 'UNKNOWN' | 'BLOCKED' | 'ERROR';
export type DependencyState = 'RESOLVED' | 'MISSING' | 'INCOMPATIBLE' | 'CONFLICT' | 'CYCLE' | 'OPTIONAL_MISSING' | 'DEGRADED' | 'ERROR';

export interface CapabilityAvailability {
  code: string;
  state: CapabilityState;
  provider?: string;
  contractRef?: string;
  contractVersion?: string;
  providerRevision?: string;
  version?: string;
  reasonCode?: string;
  dependencies?: Array<{ code: string; type?: 'REQUIRED' | 'OPTIONAL' | 'RECOMMENDS' | 'IMPLIES'; versionRange?: string }>;
  details?: Record<string, unknown>;
}

export interface CapabilityAvailabilityProvider {
  resolveCapabilities(codes: string[], context: RuntimeContext): Promise<{ capabilities: CapabilityAvailability[]; providerRevision?: string }>;
}

export interface CapabilityResolutionResult {
  capabilities: CapabilityAvailability[];
  dependencies: Array<{
    dependencyId: string;
    sourceRef: string;
    type: string;
    targetType: string;
    targetRef: string;
    state: DependencyState;
    blocking: boolean;
    reasonCode: string;
    resolvedProvider?: string;
    versionRange?: string;
    details?: Record<string, unknown>;
  }>;
  graph: { nodes: Array<{ id: string; type: string; ref: string }>; edges: Array<{ source: string; target: string; type: string; state: string; direct: boolean }> };
  summary: { capabilities: { required: number; available: number; missing: number; degraded: number }; dependencies: { total: number; resolved: number; missing: number; optionalMissing: number; incompatible: number; conflicts: number; cycles: number } };
  blocking: boolean;
  issues: Array<{ code: string; message: string; details?: Record<string, unknown> }>;
}

export interface CapabilityDependencyResolverOptions {
  maxNodes: number;
  maxEdges: number;
  maxDepth: number;
  maxTransitiveExpansion: number;
}

const DEFAULT_LIMITS: CapabilityDependencyResolverOptions = { maxNodes: 500, maxEdges: 1000, maxDepth: 50, maxTransitiveExpansion: 500 };

@Injectable()
export class CapabilityDependencyResolverService {
  private readonly options: CapabilityDependencyResolverOptions = DEFAULT_LIMITS;

  constructor(@Inject(RUNTIME_CAPABILITY_AVAILABILITY_PROVIDER) private readonly provider: CapabilityAvailabilityProvider) {}

  async resolve(manifest: PackManifest, context: RuntimeContext): Promise<CapabilityResolutionResult> {
    const required = this.requiredCapabilities(manifest);
    const requested = [...new Set([...required, ...this.optionalCapabilities(manifest)])].sort();
    const response = await this.provider.resolveCapabilities(requested, context);
    const availability = new Map(response.capabilities.map((item) => [item.code, item]));
    const capabilities = requested.map((code) => availability.get(code) ?? { code, state: 'UNKNOWN' as const, reasonCode: 'CAPABILITY_PROVIDER_DOWN' });
    const dependencies = this.collectDependencies(manifest, availability);
    const graph = this.buildGraph(capabilities, dependencies);
    const issues: CapabilityResolutionResult['issues'] = [];
    const cycles = this.cycles(graph.edges);
    for (const cycle of cycles) issues.push({ code: 'RUNTIME_DEPENDENCY_CYCLE', message: `Runtime dependency cycle: ${cycle.join(' -> ')}`, details: { path: cycle } });
    for (const dependency of dependencies) {
      const target = availability.get(dependency.targetRef);
      if (!target || ['UNAVAILABLE', 'UNKNOWN', 'ERROR'].includes(target.state)) {
        dependency.state = dependency.type === 'OPTIONAL' || dependency.type === 'RECOMMENDS' ? 'OPTIONAL_MISSING' : 'MISSING';
        dependency.reasonCode = dependency.state === 'OPTIONAL_MISSING' ? 'DEPENDENCY_OPTIONAL_MISSING' : 'CAPABILITY_NOT_AVAILABLE';
      } else if (dependency.versionRange && !satisfiesVersion(target.version, dependency.versionRange)) {
        dependency.state = 'INCOMPATIBLE';
        dependency.reasonCode = 'DEPENDENCY_VERSION_INCOMPATIBLE';
      } else if (dependency.type === 'CONFLICTS_WITH' && target.state === 'AVAILABLE') {
        dependency.state = 'CONFLICT';
        dependency.reasonCode = 'DEPENDENCY_CONFLICT';
      } else dependency.state = target.state === 'DEGRADED' ? 'DEGRADED' : 'RESOLVED';
      if (dependency.state !== 'RESOLVED') issues.push({ code: `RUNTIME_${dependency.state}`, message: `${dependency.sourceRef} -> ${dependency.targetRef} resolved as ${dependency.state}.`, details: { dependencyId: dependency.dependencyId, reasonCode: dependency.reasonCode } });
    }
    if (graph.nodes.length > this.options.maxNodes || graph.edges.length > this.options.maxEdges) issues.push({ code: 'RUNTIME_DEPENDENCY_GRAPH_TOO_LARGE', message: 'Runtime dependency graph exceeds configured limits.' });
    const blocking = dependencies.some((item) => item.blocking && ['MISSING', 'INCOMPATIBLE', 'CONFLICT', 'CYCLE', 'ERROR'].includes(item.state)) || required.some((code) => !['AVAILABLE', 'DEGRADED'].includes(availability.get(code)?.state ?? 'UNKNOWN')) || issues.some((issue) => issue.code === 'RUNTIME_DEPENDENCY_GRAPH_TOO_LARGE');
    return {
      capabilities,
      dependencies,
      graph,
      blocking,
      issues,
      summary: {
        capabilities: { required: required.length, available: required.filter((code) => availability.get(code)?.state === 'AVAILABLE').length, missing: required.filter((code) => ['UNAVAILABLE', 'UNKNOWN', 'ERROR'].includes(availability.get(code)?.state ?? 'UNKNOWN')).length, degraded: required.filter((code) => availability.get(code)?.state === 'DEGRADED').length },
        dependencies: { total: dependencies.length, resolved: dependencies.filter((item) => item.state === 'RESOLVED').length, missing: dependencies.filter((item) => item.state === 'MISSING').length, optionalMissing: dependencies.filter((item) => item.state === 'OPTIONAL_MISSING').length, incompatible: dependencies.filter((item) => item.state === 'INCOMPATIBLE').length, conflicts: dependencies.filter((item) => item.state === 'CONFLICT').length, cycles: cycles.length },
      },
    };
  }

  private requiredCapabilities(manifest: PackManifest) { return [...new Set([...Object.values(manifest.capabilities).flat(), ...manifest.modules.flatMap((item) => item.capabilities ?? []), ...manifest.features.flatMap((item) => [item.capability, ...(item.capabilities ?? [])].filter((value): value is string => Boolean(value)))])].sort(); }
  private optionalCapabilities(manifest: PackManifest) { return manifest.features.flatMap((item) => item.optionalCapabilities ?? []).sort(); }
  private collectDependencies(manifest: PackManifest, availability: Map<string, CapabilityAvailability>) {
    const result: CapabilityResolutionResult['dependencies'] = [];
    const add = (sourceRef: string, type: string, targetType: string, targetRef: string, versionRange?: string, resolvedProvider?: string) => result.push({ dependencyId: `${sourceRef}:${targetRef}:${result.length}`, sourceRef, type, targetType, targetRef, versionRange, state: 'RESOLVED', blocking: !['OPTIONAL', 'RECOMMENDS'].includes(type), reasonCode: 'DEPENDENCY_RESOLVED', resolvedProvider });
    for (const item of manifest.dependencies ?? []) add(item.source ?? manifest.pack.code, item.type ?? 'REQUIRED', item.targetType ?? 'CAPABILITY', item.targetRef ?? item.code, undefined, availability.get(item.targetRef ?? item.code)?.provider);
    for (const [source, capabilityCodes] of Object.entries(manifest.capabilities)) for (const code of capabilityCodes) add(source, 'REQUIRED', 'CAPABILITY', code, undefined, availability.get(code)?.provider);
    for (const item of availability.values()) for (const dependency of item.dependencies ?? []) add(item.code, dependency.type ?? 'REQUIRED', 'CAPABILITY', dependency.code, dependency.versionRange, availability.get(item.code)?.provider);
    return result;
  }
  private buildGraph(capabilities: CapabilityAvailability[], dependencies: CapabilityResolutionResult['dependencies']) {
    const nodes = new Map<string, { id: string; type: string; ref: string }>();
    const edges = dependencies.map((item) => { const source = `CAPABILITY:${item.sourceRef}`; const target = `${item.targetType}:${item.targetRef}`; nodes.set(source, { id: source, type: 'CAPABILITY', ref: item.sourceRef }); nodes.set(target, { id: target, type: item.targetType, ref: item.targetRef }); return { source, target, type: item.type, state: item.state, direct: true }; });
    for (const item of capabilities) nodes.set(`CAPABILITY:${item.code}`, { id: `CAPABILITY:${item.code}`, type: 'CAPABILITY', ref: item.code });
    return { nodes: [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id)), edges: edges.sort((left, right) => `${left.source}:${left.target}`.localeCompare(`${right.source}:${right.target}`)) };
  }
  private cycles(edges: CapabilityResolutionResult['graph']['edges']) { const adjacency = new Map<string, string[]>(); for (const edge of edges) adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]); const result: string[][] = []; const visiting = new Set<string>(); const visited = new Set<string>(); const path: string[] = []; const visit = (node: string) => { if (visiting.has(node)) { const index = path.indexOf(node); if (index >= 0) result.push([...path.slice(index), node]); return; } if (visited.has(node)) return; visiting.add(node); path.push(node); for (const target of adjacency.get(node) ?? []) visit(target); path.pop(); visiting.delete(node); visited.add(node); }; for (const node of adjacency.keys()) visit(node); return result; }
}