import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  getConfigs,
  createConfig,
  updateConfig,
  getEffective,
} from '../services/api/platformConfigService.js';

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

// REAL DATA ONLY : les configurations proviennent exclusivement de l'API
// réelle (fetchConfigsAsync → /business-manager/configurations).

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

export const fetchConfigsAsync = createAsyncThunk(
  'config/fetchConfigs',
  async (_, { getState }) => {
    return getConfigs();
  },
  { condition: (_, { getState }) => !getState().config.loading }
);

export const addConfigItemAsync = createAsyncThunk(
  'config/addConfigItem',
  async (body, { getState }) => {
    return createConfig(body);
  }
);

export const updateConfigItemAsync = createAsyncThunk(
  'config/updateConfigItem',
  async ({ id, body, ...fields }, { getState }) => {
    return updateConfig(id, body ?? fields);
  }
);

const configSlice = createSlice({
  name: 'config',
  initialState: {
    items: [],
    loading: false,
    error: null,
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
  extraReducers: (builder) => {
    builder
      .addCase(fetchConfigsAsync.pending, state => { state.loading = true; state.error = null; state.items = []; })
      .addCase(fetchConfigsAsync.rejected, (state, action) => { state.loading = false; state.error = action.error.message; })
      .addCase(fetchConfigsAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (!action.payload.skipped && action.payload) {
          state.items = action.payload;
        }
      })
      .addCase(addConfigItemAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          state.items.unshift({
            ...action.payload,
            description: action.payload.description || '—',
            updatedBy: action.payload.updatedBy || '—',
            isSecret: false,
          });
        }
      })
      .addCase(updateConfigItemAsync.fulfilled, (state, action) => {
        if (!action.payload.skipped && action.payload) {
          const idx = state.items.findIndex((c) => c.id === action.payload.id);
          if (idx !== -1) {
            state.items[idx] = {
              ...state.items[idx],
              ...action.payload,
              description: action.payload.description || state.items[idx].description,
              updatedBy: action.payload.updatedBy || state.items[idx].updatedBy,
              isSecret: state.items[idx].isSecret,
            };
          }
        }
      });
  },
});

export const { setSelectedScope, setSelectedScopeId, addConfigItem, updateConfigItem, deleteConfigItem } =
  configSlice.actions;

export default configSlice.reducer;
