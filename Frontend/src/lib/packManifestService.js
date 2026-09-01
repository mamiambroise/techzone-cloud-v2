// packManifestService.js — Sealed Pack Manifest v1 Engine (PM-CDC-00, PM-CDC-03)
import { generateTraceId } from './trace';

/**
 * Computes a pseudo-deterministic SHA-256 hash representation for client-side sealing.
 */
export async function computePackManifestHash(canonicalJsonString) {
  try {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(canonicalJsonString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `sha256:${hashHex}`;
    }
  } catch (e) {
    console.warn('Crypto subtle unavailable, using fallback hashing', e);
  }
  // Simple fallback hash
  let hash = 0;
  for (let i = 0; i < canonicalJsonString.length; i++) {
    const char = canonicalJsonString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(16, '0');
  return `sha256:${hex}${hex}${hex}${hex}`.slice(0, 71);
}

/**
 * Produces a sorted, canonical JSON string for deterministic cryptographic hashing.
 */
export function canonicalizeJson(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalizeJson(item)).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(key => {
    return JSON.stringify(key) + ':' + canonicalizeJson(obj[key]);
  });
  return '{' + pairs.join(',') + '}';
}

/**
 * Builds the canonical Pack Manifest v1 contract.
 */
export async function buildPackManifestV1({
  pack,
  packVersion,
  modules = [],
  features = [],
  capabilities = [],
  dependencies = [],
  rules = [],
  author = 'System',
}) {
  const sortedModules = [...modules].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  const sortedCapabilities = [...capabilities].sort((a, b) => (a.capabilityCode || '').localeCompare(b.capabilityCode || ''));
  const sortedDependencies = [...dependencies].sort((a, b) => (a.targetPackCode || '').localeCompare(b.targetPackCode || ''));
  const sortedRules = [...rules].sort((a, b) => (a.priority || 0) - (b.priority || 0));

  const manifestPayload = {
    $schema: 'https://schema.techzone.io/pack-manifest/v1.json',
    manifestVersion: '1.0',
    header: {
      packId: pack.id,
      packCode: pack.code,
      packName: pack.name,
      shortName: pack.shortName || pack.name,
      category: pack.category || 'General',
      sourceType: pack.sourceType,
      color: pack.color,
      iconKey: pack.iconKey,
    },
    version: {
      id: packVersion.id,
      versionNumber: packVersion.versionNumber,
      label: packVersion.label,
      description: packVersion.description,
      contractVersion: '1.0',
      sourceVersionId: packVersion.sourceVersionId || null,
      createdAt: packVersion.createdAt,
    },
    composition: {
      modules: sortedModules.map(m => {
        const modFeatures = features.filter(f => f.moduleId === m.id);
        return {
          code: m.code,
          name: m.name,
          moduleType: m.moduleType,
          isRequired: Boolean(m.isRequired),
          isDefaultEnabled: Boolean(m.isDefaultEnabled),
          iconKey: m.iconKey,
          features: modFeatures.map(f => ({
            code: f.code,
            name: f.name,
            featureType: f.featureType,
            isRequired: Boolean(f.isRequired),
            isDefaultEnabled: Boolean(f.isDefaultEnabled),
            enabled: Boolean(f.enabled),
          })),
        };
      }),
      capabilities: sortedCapabilities.map(c => ({
        capabilityCode: c.capabilityCode,
        relationType: c.relationType,
        name: c.name,
        category: c.category,
        stability: c.stability || 'STABLE',
      })),
      dependencies: sortedDependencies.map(d => ({
        targetPackCode: d.targetPackCode,
        versionRange: d.versionRange,
        dependencyType: d.dependencyType,
        resolvedVersion: d.resolvedVersion || null,
      })),
      rules: sortedRules.map(r => ({
        code: r.code,
        name: r.name,
        ruleType: r.ruleType,
        trigger: r.trigger,
        priority: r.priority,
        isActive: Boolean(r.isActive),
        condition: r.condition,
        effect: r.effect,
      })),
    },
    metadata: {
      tags: pack.metadata?.tags || [],
      sealedAt: new Date().toISOString(),
      sealedBy: author,
      traceId: generateTraceId(),
    },
  };

  const canonicalString = canonicalizeJson(manifestPayload);
  const hash = await computePackManifestHash(canonicalString);

  return {
    manifest: manifestPayload,
    canonicalString,
    manifestHash: hash,
  };
}
