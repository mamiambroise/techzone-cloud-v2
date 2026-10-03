/**
 * Règles de validation de la Business Definition.
 *
 * Chaque règle produit ZERO ou PLUSIOUS problèmes. Un problème porte toujours :
 *  - `code`      identifiant stable (ex. BROKEN_RELATION)
 *  - `severity`  BmqSeverity (BLOCKER / ERROR / WARNING / INFO)
 *  - `message`   message lisible
 *  - `details`   resourceType, resourceId, resourceCode, path : permet à l'UI
 *                d'ouvrir directement l'élément concerné.
 *
 * Les règles sont pures : elles reçoivent l'état déjà chargé de la version et
 * ne touchent jamais la base. Le moteur (`quality-engine.service.ts`) est
 * responsable du chargement, de la persistance et du score.
 */

export type BmIssueSeverity = 'BLOCKER' | 'ERROR' | 'WARNING' | 'INFO';

export type BmValidationIssue = {
  code: string;
  severity: BmIssueSeverity;
  message: string;
  source: string;
  resourceType?: string;
  resourceId?: string;
  resourceCode?: string;
  path?: string;
};

export type BmValidationInput = {
  entities: EntityInput[];
  relations: RelationInput[];
  features: FeatureInput[];
  menus: MenuInput[];
  contracts: ContractInput[];
  configurations: ConfigurationInput[];
  versionFeatures: string[];
  versionCapabilities: { featureCode: string; capabilityCode: string }[];
};

export type EntityInput = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  fields: FieldInput[];
  constraints: { id: string; code: string; constraintType: string; fieldId: string | null }[];
};

export type FieldInput = {
  id: string;
  code: string;
  label: string | null;
  description: string | null;
  type: string;
  required: boolean;
  unique: boolean;
  entityId: string;
};

export type RelationInput = {
  id: string;
  code: string;
  relationType: string;
  sourceEntityId: string;
  targetEntityId: string;
  required: boolean;
};

export type FeatureInput = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: string;
  capabilities: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    requiredEntities: string[];
    dependencies: { targetCapabilityCode: string; dependencyType: string }[];
  }[];
};

export type MenuInput = {
  id: string;
  code: string;
  name: string;
  status: string;
  items: {
    id: string;
    code: string;
    label: string | null;
    itemType: string;
    parentItemId: string | null;
    requiredCapabilities: string[];
  }[];
};

export type ContractInput = { id: string; code: string; status: string };
export type ConfigurationInput = { id: string; key: string; status: string; required: boolean };

const hasText = (value: string | null | undefined): boolean =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Multiplicateurs de sévérité appliqués au score final. Un BLOCKER ou un
 * ERROR pèse plus qu'un WARNING, lui-même plus qu'un INFO.
 */
export const SEVERITY_WEIGHT: Record<BmIssueSeverity, number> = {
  BLOCKER: 8,
  ERROR: 4,
  WARNING: 2,
  INFO: 0.5,
};

/** Entités de référence déclarées par le contrat PUBLIC (non modifiables). */
export const PUBLICATION_CONTRACT_STATUSES = ['LOCKED', 'ACTIVE'] as const;

// =====================================================================
// DATA MODEL
// =====================================================================

export function validateDataModel(input: BmValidationInput): BmValidationIssue[] {
  const issues: BmValidationIssue[] = [];
  const entities = input.entities;
  const entityById = new Map(entities.map((entity) => [entity.id, entity]));

  // --- Entités -------------------------------------------------------
  for (const entity of entities) {
    if (entity.fields.length === 0) {
      issues.push({
        code: 'ENTITY_WITHOUT_FIELD',
        severity: 'ERROR',
        message: `L'entité ${entity.name || entity.code} ne possède aucun champ`,
        source: 'data-model',
        resourceType: 'BmEntity',
        resourceId: entity.id,
        resourceCode: entity.code,
        path: `Modèles de données / Entités / ${entity.code}`,
      });
    }

    if (!hasText(entity.description)) {
      issues.push({
        code: 'MISSING_DESCRIPTION',
        severity: 'WARNING',
        message: `L'entité ${entity.name || entity.code} ne possède pas de description`,
        source: 'data-model',
        resourceType: 'BmEntity',
        resourceId: entity.id,
        resourceCode: entity.code,
        path: `Modèles de données / Entités / ${entity.code}`,
      });
    }

    if (!hasText(entity.name)) {
      issues.push({
        code: 'MISSING_LABEL',
        severity: 'WARNING',
        message: `L'entité ${entity.code} ne possède pas de nom lisible`,
        source: 'data-model',
        resourceType: 'BmEntity',
        resourceId: entity.id,
        resourceCode: entity.code,
        path: `Modèles de données / Entités / ${entity.code}`,
      });
    }

    // --- Champs ------------------------------------------------------
    for (const field of entity.fields) {
      if (!hasText(field.label)) {
        issues.push({
          code: 'MISSING_LABEL',
          severity: 'INFO',
          message: `Le champ ${entity.code}.${field.code} n'a pas de libellé`,
          source: 'data-model',
          resourceType: 'BmField',
          resourceId: field.id,
          resourceCode: `${entity.code}.${field.code}`,
          path: `Modèles de données / ${entity.code} / Champs / ${field.code}`,
        });
      }

      // Un champ d'énumération sans options ne peut pas être contraint.
      if ((field.type === 'ENUM' || field.type === 'MULTI_ENUM') && !field.description) {
        issues.push({
          code: 'ENUM_WITHOUT_OPTIONS',
          severity: 'WARNING',
          message: `Le champ ${entity.code}.${field.code} est de type ${field.type} sans description des valeurs autorisées`,
          source: 'data-model',
          resourceType: 'BmField',
          resourceId: field.id,
          resourceCode: `${entity.code}.${field.code}`,
          path: `Modèles de données / ${entity.code} / Champs / ${field.code}`,
        });
      }
    }

    // --- Contraintes -------------------------------------------------
    for (const constraint of entity.constraints) {
      if (constraint.fieldId) {
        const owned = entity.fields.some((field) => field.id === constraint.fieldId);
        if (!owned) {
          issues.push({
            code: 'BROKEN_CONSTRAINT',
            severity: 'ERROR',
            message: `La contrainte ${entity.code}.${constraint.code} référence un champ absent de l'entité`,
            source: 'data-model',
            resourceType: 'BmConstraint',
            resourceId: constraint.id,
            resourceCode: `${entity.code}.${constraint.code}`,
            path: `Modèles de données / ${entity.code} / Contraintes / ${constraint.code}`,
          });
        }
      }
    }
  }

  // --- Relations ----------------------------------------------------
  for (const relation of input.relations) {
    const source = entityById.get(relation.sourceEntityId);
    const target = entityById.get(relation.targetEntityId);

    if (!source || !target) {
      issues.push({
        code: 'BROKEN_RELATION',
        severity: 'ERROR',
        message: `La relation ${relation.code} référence une entité inexistante${
          !source ? ' (source)' : ''
        }${!source && !target ? ' et' : ''}${!target ? ' (cible)' : ''}`,
        source: 'data-model',
        resourceType: 'BmRelation',
        resourceId: relation.id,
        resourceCode: relation.code,
        path: `Modèles de données / Relations / ${relation.code}`,
      });
      continue;
    }

    if (source.id === target.id) {
      issues.push({
        code: 'SELF_RELATION',
        severity: 'WARNING',
        message: `La relation ${relation.code} relie ${source.code} à lui-même`,
        source: 'data-model',
        resourceType: 'BmRelation',
        resourceId: relation.id,
        resourceCode: relation.code,
        path: `Modèles de données / Relations / ${relation.code}`,
      });
    }
  }

  return issues;
}

// =====================================================================
// FEATURES / CAPABILITIES / PERMISSIONS MÉTIER
// =====================================================================

export function validateFeatures(input: BmValidationInput): BmValidationIssue[] {
  const issues: BmValidationIssue[] = [];
  const entityCodes = new Set(input.entities.map((entity) => entity.code));
  const activeFeatures = input.features.filter((feature) => feature.status !== 'ARCHIVED');

  // Une version exploitable doit décrire au moins une fonctionnalité.
  if (activeFeatures.length === 0) {
    issues.push({
      code: 'NO_FEATURE',
      severity: 'ERROR',
      message: 'La version ne déclare aucune fonctionnalité métier',
      source: 'features',
      resourceType: 'ApplicationVersion',
      path: 'Fonctionnalités',
    });
    return issues;
  }

  // Permissions métier = codes de capacités. Ils doivent être uniques et
  // exploitables : ce sont eux que le Runtime et l'UI Builder référencent.
  const capabilityOwner = new Map<string, string>();

  for (const feature of activeFeatures) {
    if (!hasText(feature.description)) {
      issues.push({
        code: 'MISSING_DESCRIPTION',
        severity: 'WARNING',
        message: `La fonctionnalité ${feature.name || feature.code} ne possède pas de description`,
        source: 'features',
        resourceType: 'BmFeature',
        resourceId: feature.id,
        resourceCode: feature.code,
        path: `Fonctionnalités / ${feature.code}`,
      });
    }

    if (feature.capabilities.length === 0) {
      issues.push({
        code: 'FEATURE_WITHOUT_CAPABILITY',
        severity: 'WARNING',
        message: `La fonctionnalité ${feature.name || feature.code} ne déclare aucune capacité`,
        source: 'features',
        resourceType: 'BmFeature',
        resourceId: feature.id,
        resourceCode: feature.code,
        path: `Fonctionnalités / ${feature.code}`,
      });
    }

    for (const capability of feature.capabilities) {
      const owner = capabilityOwner.get(capability.code);
      if (owner) {
        issues.push({
          code: 'DUPLICATE_PERMISSION',
          severity: 'ERROR',
          message: `La permission métier "${capability.code}" est déclarée deux fois (${owner} et ${feature.code})`,
          source: 'features',
          resourceType: 'BmFeatureCapability',
          resourceId: capability.id,
          resourceCode: capability.code,
          path: `Fonctionnalités / ${feature.code} / ${capability.code}`,
        });
      } else {
        capabilityOwner.set(capability.code, feature.code);
      }

      for (const requiredEntity of capability.requiredEntities) {
        if (!entityCodes.has(requiredEntity)) {
          issues.push({
            code: 'UNKNOWN_REQUIRED_ENTITY',
            severity: 'ERROR',
            message: `La permission métier ${capability.code} requiert l'entité "${requiredEntity}" qui n'existe pas`,
            source: 'features',
            resourceType: 'BmFeatureCapability',
            resourceId: capability.id,
            resourceCode: capability.code,
            path: `Fonctionnalités / ${feature.code} / ${capability.code}`,
          });
        }
      }

      for (const dependency of capability.dependencies) {
        if (dependency.targetCapabilityCode === capability.code) {
          issues.push({
            code: 'SELF_DEPENDENCY',
            severity: 'ERROR',
            message: `La permission métier ${capability.code} dépend d'elle-même`,
            source: 'features',
            resourceType: 'BmFeatureCapability',
            resourceId: capability.id,
            resourceCode: capability.code,
            path: `Fonctionnalités / ${feature.code} / ${capability.code}`,
          });
        }
      }
    }
  }

  // Dépendances pointant vers une permission inexistante.
  for (const feature of activeFeatures) {
    for (const capability of feature.capabilities) {
      for (const dependency of capability.dependencies) {
        if (!capabilityOwner.has(dependency.targetCapabilityCode)) {
          issues.push({
            code: 'BROKEN_CAPABILITY_DEPENDENCY',
            severity: 'ERROR',
            message: `La dépendance de ${capability.code} cible la permission métier "${dependency.targetCapabilityCode}" qui n'existe pas`,
            source: 'features',
            resourceType: 'BmFeatureCapability',
            resourceId: capability.id,
            resourceCode: capability.code,
            path: `Fonctionnalités / ${feature.code} / Dépendances`,
          });
        }
      }
    }
  }

  // Activations par version : le code activé doit exister.
  for (const activation of input.versionFeatures) {
    if (!activeFeatures.some((feature) => feature.code === activation)) {
      issues.push({
        code: 'BROKEN_FEATURE_ACTIVATION',
        severity: 'ERROR',
        message: `La fonctionnalité activée "${activation}" n'existe pas sur cette version`,
        source: 'features',
        resourceType: 'BmVersionFeature',
        resourceCode: activation,
        path: 'Fonctionnalités / Activations',
      });
    }
  }

  for (const activation of input.versionCapabilities) {
    if (!capabilityOwner.has(activation.capabilityCode)) {
      issues.push({
        code: 'BROKEN_CAPABILITY_ACTIVATION',
        severity: 'ERROR',
        message: `La permission métier activée "${activation.capabilityCode}" n'existe pas sur cette version`,
        source: 'features',
        resourceType: 'BmVersionCapability',
        resourceCode: activation.capabilityCode,
        path: 'Fonctionnalités / Activations',
      });
    }
  }

  return issues;
}

// =====================================================================
// NAVIGATION
// =====================================================================

export function validateNavigation(input: BmValidationInput): BmValidationIssue[] {
  const issues: BmValidationIssue[] = [];
  const capabilityCodes = new Set<string>();

  for (const feature of input.features) {
    if (feature.status === 'ARCHIVED') continue;
    for (const capability of feature.capabilities) capabilityCodes.add(capability.code);
  }

  const menus = input.menus.filter((menu) => menu.status !== 'ARCHIVED');

  if (menus.length === 0) {
    issues.push({
      code: 'NO_MENU',
      severity: 'WARNING',
      message: 'Aucune structure de navigation fonctionnelle n’est définie',
      source: 'navigation',
      resourceType: 'ApplicationVersion',
      path: 'Navigation',
    });
    return issues;
  }

  for (const menu of menus) {
    if (menu.items.length === 0) {
      issues.push({
        code: 'MENU_WITHOUT_ITEM',
        severity: 'WARNING',
        message: `Le menu ${menu.name || menu.code} ne contient aucun élément`,
        source: 'navigation',
        resourceType: 'BmMenu',
        resourceId: menu.id,
        resourceCode: menu.code,
        path: `Navigation / ${menu.code}`,
      });
    }

    const itemIds = new Set(menu.items.map((item) => item.id));

    for (const item of menu.items) {
      if (item.parentItemId && !itemIds.has(item.parentItemId)) {
        issues.push({
          code: 'BROKEN_NAVIGATION_ITEM',
          severity: 'ERROR',
          message: `L’élément de navigation ${item.label || item.code} référence un parent inexistant`,
          source: 'navigation',
          resourceType: 'BmNavigationItem',
          resourceId: item.id,
          resourceCode: item.code,
          path: `Navigation / ${menu.code} / ${item.code}`,
        });
      }

      // Une entrée de navigation doit pointer une permission métier existante,
      // sinon elle sera inaccessible au Runtime.
      for (const capabilityCode of item.requiredCapabilities) {
        if (!capabilityCodes.has(capabilityCode)) {
          issues.push({
            code: 'BROKEN_NAVIGATION_PERMISSION',
            severity: 'ERROR',
            message: `L’entrée ${item.label || item.code} exige la permission métier "${capabilityCode}" qui n’est déclarée par aucune fonctionnalité`,
            source: 'navigation',
            resourceType: 'BmNavigationItem',
            resourceId: item.id,
            resourceCode: item.code,
            path: `Navigation / ${menu.code} / ${item.code}`,
          });
        }
      }
    }
  }

  return issues;
}

// =====================================================================
// CONFIGURATION MÉTIER
// =====================================================================

export function validateConfiguration(input: BmValidationInput): BmValidationIssue[] {
  const issues: BmValidationIssue[] = [];

  if (input.configurations.length === 0) {
    issues.push({
      code: 'NO_CONFIGURATION',
      severity: 'WARNING',
      message: 'Aucune configuration métier n’est définie pour cette version',
      source: 'configuration',
      resourceType: 'ApplicationVersion',
      path: 'Configuration',
    });
  }

  for (const configuration of input.configurations) {
    if (configuration.required && configuration.status === 'DRAFT') {
      issues.push({
        code: 'REQUIRED_CONFIGURATION_DRAFT',
        severity: 'WARNING',
        message: `La configuration métier requise "${configuration.key}" est encore en brouillon`,
        source: 'configuration',
        resourceType: 'Configuration',
        resourceId: configuration.id,
        resourceCode: configuration.key,
        path: `Configuration / ${configuration.key}`,
      });
    }
  }

  return issues;
}

// =====================================================================
// CONTRAT DE PUBLICATION
// =====================================================================

export function validateContracts(input: BmValidationInput): BmValidationIssue[] {
  const issues: BmValidationIssue[] = [];
  const publishable = input.contracts.some((contract) =>
    (PUBLICATION_CONTRACT_STATUSES as readonly string[]).includes(contract.status),
  );

  if (!publishable) {
    issues.push({
      code: 'NO_PUBLISHABLE_CONTRACT',
      severity: 'BLOCKER',
      message: 'Aucun contrat métier verrouillé ou actif : la version ne peut pas être publiée',
      source: 'contracts',
      resourceType: 'ApplicationVersion',
      path: 'Validation & publication',
    });
  }

  return issues;
}

/** Exécute l'ensemble des règles sur une version. */
export function runBusinessDefinitionValidation(input: BmValidationInput): BmValidationIssue[] {
  return [
    ...validateDataModel(input),
    ...validateFeatures(input),
    ...validateNavigation(input),
    ...validateConfiguration(input),
    ...validateContracts(input),
  ];
}