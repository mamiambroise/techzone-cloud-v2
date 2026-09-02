// packDependencyResolver.js — Dependency Graph & Semantic Version Engine (PM-CDC-06)

/**
 * Checks if a version satisfies a basic semver expression.
 */
export function satisfiesSemver(versionStr, rangeStr) {
  if (!versionStr || !rangeStr) return false;
  const cleanVer = versionStr.replace(/^[vV]/, '').split('-')[0];
  const parts = cleanVer.split('.').map(n => parseInt(n, 10) || 0);
  const [major, minor = 0, patch = 0] = parts;

  const cleanRange = rangeStr.trim();

  // Exact match
  if (/^\d+\.\d+\.\d+$/.test(cleanRange)) {
    return cleanVer === cleanRange;
  }

  // Caret match ^1.2.0 (compatible with 1.x.x >= 1.2.0)
  if (cleanRange.startsWith('^')) {
    const target = cleanRange.slice(1).split('.').map(n => parseInt(n, 10) || 0);
    const [tMaj, tMin = 0, tPatch = 0] = target;
    if (major !== tMaj) return false;
    if (minor > tMin) return true;
    if (minor === tMin) return patch >= tPatch;
    return false;
  }

  // Greater than or equal >=2.0.0
  if (cleanRange.startsWith('>=')) {
    const target = cleanRange.slice(2).trim().split('.').map(n => parseInt(n, 10) || 0);
    const [tMaj, tMin = 0, tPatch = 0] = target;
    if (major > tMaj) return true;
    if (major === tMaj && minor > tMin) return true;
    if (major === tMaj && minor === tMin) return patch >= tPatch;
    return false;
  }

  // Tilde match ~1.2.0 (compatible with 1.2.x >= 1.2.0)
  if (cleanRange.startsWith('~')) {
    const target = cleanRange.slice(1).split('.').map(n => parseInt(n, 10) || 0);
    const [tMaj, tMin = 0, tPatch = 0] = target;
    if (major !== tMaj || minor !== tMin) return false;
    return patch >= tPatch;
  }

  return true;
}

/**
 * Evaluates all dependencies for a source pack version against known available packs.
 */
export function evaluatePackDependencies({
  dependencies = [],
  allPacks = [],
  allPackVersions = [],
}) {
  const evaluated = dependencies.map(dep => {
    const targetPack = allPacks.find(p => p.code === dep.targetPackCode);
    if (!targetPack) {
      return {
        ...dep,
        resolutionStatus: 'UNRESOLVED',
        resolvedVersion: null,
        error: `Le pack cible "${dep.targetPackCode}" est inexistant dans le registre.`,
      };
    }

    // Find available versions of target pack
    const targetVersions = allPackVersions.filter(
      v => v.packId === targetPack.id && (v.status === 'PUBLISHED' || v.status === 'READY')
    );

    if (targetVersions.length === 0) {
      return {
        ...dep,
        resolutionStatus: 'UNRESOLVED',
        resolvedVersion: null,
        error: `Aucune version publiée disponible pour "${targetPack.name}".`,
      };
    }

    // Find best matching version
    const matching = targetVersions.find(v =>
      satisfiesSemver(v.versionNumber, dep.versionRange)
    );

    if (matching) {
      return {
        ...dep,
        resolutionStatus: 'RESOLVED',
        resolvedVersion: matching.versionNumber,
        resolvedVersionId: matching.id,
        targetPackName: targetPack.name,
        targetPackIcon: targetPack.iconKey,
        targetPackColor: targetPack.color,
        error: null,
      };
    } else {
      return {
        ...dep,
        resolutionStatus: 'CONFLICT',
        resolvedVersion: null,
        targetPackName: targetPack.name,
        targetPackIcon: targetPack.iconKey,
        targetPackColor: targetPack.color,
        error: `Aucune version ne satisfait l’exigence "${dep.versionRange}". Versions dispos: ${targetVersions.map(v => v.versionNumber).join(', ')}`,
      };
    }
  });

  return evaluated;
}

/**
 * Detects circular dependency cycles across all pack dependencies using DFS.
 */
export function detectCycles(allDependencies = []) {
  // Build adjacency list: packCode -> Array of targetPackCodes
  const adj = new Map();

  allDependencies.forEach(dep => {
    if (!dep.sourcePackCode || !dep.targetPackCode) return;
    if (!adj.has(dep.sourcePackCode)) {
      adj.set(dep.sourcePackCode, new Set());
    }
    adj.get(dep.sourcePackCode).add(dep.targetPackCode);
  });

  const visited = new Set();
  const recStack = new Set();
  const cycles = [];

  function dfs(node, path) {
    visited.add(node);
    recStack.add(node);
    path.push(node);

    const neighbors = adj.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recStack.has(neighbor)) {
        // Cycle detected
        const cycleStartIndex = path.indexOf(neighbor);
        const cyclePath = path.slice(cycleStartIndex).concat(neighbor);
        cycles.push(cyclePath);
      }
    }

    recStack.delete(node);
  }

  for (const node of adj.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

export function isValidSemver(versionStr) {
  if (!versionStr || typeof versionStr !== 'string') return false;
  const clean = versionStr.trim().replace(/^[vV]/, '');
  return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/.test(clean);
}

export function suggestNextSemver(currentVersion = '1.0.0', type = 'patch') {
  if (!currentVersion) return '1.0.0';
  const clean = currentVersion.replace(/^[vV]/, '').split('-')[0];
  const parts = clean.split('.').map(n => parseInt(n, 10) || 0);
  let [major = 1, minor = 0, patch = 0] = parts;

  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor') {
    minor += 1;
    patch = 0;
  } else {
    patch += 1;
  }

  return `${major}.${minor}.${patch}`;
}
