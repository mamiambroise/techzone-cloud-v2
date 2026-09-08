import { createSlice } from '@reduxjs/toolkit';

export const CONFIG_SCOPES = [
  'PLATFORM',
  'APPLICATION',
  'APPLICATION_VERSION',
  'ENVIRONMENT',
  'TENANT',
];

export const CONFIG_TYPES = [
  'STRING',
  'NUMBER',
  'BOOLEAN',
  'ENUM',
  'JSON',
  'URL',
  'DURATION',
];

const initialConfigs = [
  // PLATFORM Scope
  {
    id: 'cfg-plat-1',
    key: 'platform.http.timeout_ms',
    scope: 'PLATFORM',
    scopeId: 'platform-root',
    type: 'NUMBER',
    value: '5000',
    defaultValue: '5000',
    required: true,
    isSecret: false,
    schema: { min: 100, max: 60000 },
    version: 3,
    status: 'VALID',
    description: 'Délai d’attente maximal global pour les appels réseau inter-services.',
    updatedAt: '2026-07-10T09:00:00Z',
    updatedBy: 'alex.admin@techzone.io',
  },
  {
    id: 'cfg-plat-2',
    key: 'platform.security.vault_endpoint',
    scope: 'PLATFORM',
    scopeId: 'platform-root',
    type: 'URL',
    value: 'https://vault.internal.techzone.cloud/v1',
    defaultValue: 'https://vault.internal.techzone.cloud/v1',
    required: true,
    isSecret: false,
    schema: { protocol: 'https' },
    version: 1,
    status: 'VALID',
    description: 'Endpoint du gestionnaire de secrets HashiCorp Vault de la plateforme.',
    updatedAt: '2026-06-01T12:00:00Z',
    updatedBy: 'alex.admin@techzone.io',
  },
  {
    id: 'cfg-plat-3',
    key: 'platform.security.master_signing_key_ref',
    scope: 'PLATFORM',
    scopeId: 'platform-root',
    type: 'STRING',
    value: 'vault://platform/secrets/keys/master-ed25519-2026',
    defaultValue: '',
    required: true,
    isSecret: true,
    schema: { pattern: '^vault://' },
    version: 2,
    status: 'VALID',
    description: 'Référence sécurisée Vault de la clé de signature du Platform Contract v1.',
    updatedAt: '2026-06-15T08:00:00Z',
    updatedBy: 'alex.admin@techzone.io',
  },

  // APPLICATION Scope
  {
    id: 'cfg-app-1',
    key: 'gateway.rate_limit.max_rps',
    scope: 'APPLICATION',
    scopeId: 'app-core-api',
    type: 'NUMBER',
    value: '2500',
    defaultValue: '1000',
    required: true,
    isSecret: false,
    schema: { min: 10, max: 50000 },
    version: 4,
    status: 'VALID',
    description: 'Plafond de requêtes par seconde pour le CORE-API.',
    updatedAt: '2026-08-14T11:20:00Z',
    updatedBy: 'c.leroy@techzone.io',
  },
  {
    id: 'cfg-app-2',
    key: 'erp.sync.batch_size',
    scope: 'APPLICATION',
    scopeId: 'app-erp-connector',
    type: 'NUMBER',
    value: '1000',
    defaultValue: '500',
    required: true,
    isSecret: false,
    schema: { min: 50, max: 10000 },
    version: 2,
    status: 'VALID',
    description: 'Taille des lots de transactions synchronisés avec l’ERP SAP.',
    updatedAt: '2026-07-22T14:10:00Z',
    updatedBy: 'c.leroy@techzone.io',
  },

  // APPLICATION_VERSION Scope
  {
    id: 'cfg-ver-1',
    key: 'gateway.opentelemetry.enabled',
    scope: 'APPLICATION_VERSION',
    scopeId: 'ver-core-1.2.0-rc1',
    type: 'BOOLEAN',
    value: 'true',
    defaultValue: 'false',
    required: true,
    isSecret: false,
    schema: {},
    version: 1,
    status: 'VALID',
    description: 'Activation du traçage OpenTelemetry sur la release candidate v1.2.0.',
    updatedAt: '2026-08-25T11:45:00Z',
    updatedBy: 'c.leroy@techzone.io',
  },

  // ENVIRONMENT Scope
  {
    id: 'cfg-env-1',
    key: 'platform.logging.level',
    scope: 'ENVIRONMENT',
    scopeId: 'env-prod',
    type: 'ENUM',
    value: 'WARN',
    defaultValue: 'INFO',
    required: true,
    isSecret: false,
    schema: { options: ['DEBUG', 'INFO', 'WARN', 'ERROR'] },
    version: 3,
    status: 'VALID',
    description: 'Niveau d’alerte des logs système en environnement de PRODUCTION.',
    updatedAt: '2026-06-15T02:30:00Z',
    updatedBy: 'alex.admin@techzone.io',
  },
  {
    id: 'cfg-env-2',
    key: 'platform.logging.level',
    scope: 'ENVIRONMENT',
    scopeId: 'env-dev',
    type: 'ENUM',
    value: 'DEBUG',
    defaultValue: 'INFO',
    required: true,
    isSecret: false,
    schema: { options: ['DEBUG', 'INFO', 'WARN', 'ERROR'] },
    version: 1,
    status: 'VALID',
    description: 'Niveau détaillé de journalisation pour le développement.',
    updatedAt: '2026-05-10T10:00:00Z',
    updatedBy: 'c.leroy@techzone.io',
  },
  {
    id: 'cfg-env-3',
    key: 'platform.metrics.sample_rate',
    scope: 'ENVIRONMENT',
    scopeId: 'env-test',
    type: 'NUMBER',
    value: 'invalid_string_not_a_number', // Intentional validation defect to illustrate PF-CDC-05 & Cockpit KPI
    defaultValue: '0.1',
    required: true,
    isSecret: false,
    schema: { min: 0, max: 1 },
    version: 1,
    status: 'INVALID',
    description: 'Taux d’échantillonnage des traces télémétriques (0.0 à 1.0).',
    updatedAt: '2026-09-02T11:00:00Z',
    updatedBy: 'n.blanc@techzone.io',
  },

  // TENANT Scope
  {
    id: 'cfg-tenant-1',
    key: 'business.currency.primary',
    scope: 'TENANT',
    scopeId: 'tenant-retail-fr',
    type: 'STRING',
    value: 'EUR',
    defaultValue: 'EUR',
    required: true,
    isSecret: false,
    schema: { pattern: '^[A-Z]{3}$' },
    version: 1,
    status: 'VALID',
    description: 'Devise monétaire par défaut pour le tenant Retail France.',
    updatedAt: '2026-04-12T16:00:00Z',
    updatedBy: 'alex.admin@techzone.io',
  },
  {
    id: 'cfg-tenant-2',
    key: 'gateway.rate_limit.max_rps',
    scope: 'TENANT',
    scopeId: 'tenant-logistics-de',
    type: 'NUMBER',
    value: '4000', // Override of application rate limit
    defaultValue: '1000',
    required: true,
    isSecret: false,
    schema: { min: 10, max: 50000 },
    version: 2,
    status: 'VALID',
    description: 'Dérogation négociée de débit pour le flux logistique allemand.',
    updatedAt: '2026-08-01T09:40:00Z',
    updatedBy: 'alex.admin@techzone.io',
  },
];

// Validation helper function
export function validateConfigEntry(config) {
  if (!config.key || config.key.trim() === '') {
    return { valid: false, message: 'La clé de configuration est requise.' };
  }
  if (config.required && (config.value === undefined || config.value === '')) {
    return { valid: false, message: 'Cette configuration est marquée comme obligatoire.' };
  }
  if (config.isSecret && !config.value.startsWith('vault://') && !config.value.startsWith('kms://')) {
    return { valid: false, message: 'Règle de sécurité : Un secret doit référencer un URI sécurisé (ex: vault://...).' };
  }

  switch (config.type) {
    case 'NUMBER': {
      const num = Number(config.value);
      if (isNaN(num)) {
        return { valid: false, message: 'La valeur doit être un nombre valide.' };
      }
      if (config.schema?.min !== undefined && num < config.schema.min) {
        return { valid: false, message: `Valeur inférieure au minimum (${config.schema.min}).` };
      }
      if (config.schema?.max !== undefined && num > config.schema.max) {
        return { valid: false, message: `Valeur supérieure au maximum (${config.schema.max}).` };
      }
      break;
    }
    case 'BOOLEAN': {
      if (config.value !== 'true' && config.value !== 'false' && typeof config.value !== 'boolean') {
        return { valid: false, message: 'La valeur doit être "true" ou "false".' };
      }
      break;
    }
    case 'ENUM': {
      if (config.schema?.options && !config.schema.options.includes(config.value)) {
        return { valid: false, message: `Valeur non permise. Options: ${config.schema.options.join(', ')}` };
      }
      break;
    }
    case 'URL': {
      try {
        new URL(config.value);
      } catch (e) {
        return { valid: false, message: 'Format d’URL invalide (ex: https://...)' };
      }
      break;
    }
    case 'JSON': {
      try {
        JSON.parse(config.value);
      } catch (e) {
        return { valid: false, message: 'Format JSON invalide.' };
      }
      break;
    }
    case 'DURATION': {
      if (!/^\d+[smhd]$/.test(config.value)) {
        return { valid: false, message: 'Format de durée attendu (ex: 500ms, 30s, 5m, 1h).' };
      }
      break;
    }
    default:
      break;
  }
  return { valid: true };
}

const configSlice = createSlice({
  name: 'config',
  initialState: {
    items: initialConfigs,
    selectedScope: 'ALL',
    selectedScopeId: '',
  },
  reducers: {
    setSelectedScope: (state, action) => {
      state.selectedScope = action.payload;
    },
    setSelectedScopeId: (state, action) => {
      state.selectedScopeId = action.payload;
    },
    addConfigItem: (state, action) => {
      const validation = validateConfigEntry(action.payload);
      const newItem = {
        id: 'cfg-' + Date.now().toString(36),
        version: 1,
        status: validation.valid ? 'VALID' : 'INVALID',
        validationError: validation.valid ? null : validation.message,
        updatedAt: new Date().toISOString(),
        ...action.payload,
      };
      state.items.unshift(newItem);
    },
    updateConfigItem: (state, action) => {
      const idx = state.items.findIndex((c) => c.id === action.payload.id);
      if (idx !== -1) {
        const validation = validateConfigEntry({ ...state.items[idx], ...action.payload });
        state.items[idx] = {
          ...state.items[idx],
          ...action.payload,
          version: (state.items[idx].version || 1) + 1,
          status: validation.valid ? 'VALID' : 'INVALID',
          validationError: validation.valid ? null : validation.message,
          updatedAt: new Date().toISOString(),
        };
      }
    },
    deleteConfigItem: (state, action) => {
      state.items = state.items.filter((c) => c.id !== action.payload);
    },
  },
});

export const { setSelectedScope, setSelectedScopeId, addConfigItem, updateConfigItem, deleteConfigItem } =
  configSlice.actions;

export default configSlice.reducer;
