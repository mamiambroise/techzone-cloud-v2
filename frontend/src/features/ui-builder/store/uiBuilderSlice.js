/**
 * UI Builder — state Redux (state normalisé, undo/redo typés CDC §30).
 *
 * Save states : CLEAN → DIRTY → SAVING → SAVED / ERROR (mission §28).
 * Undo/Redo : opérations ADD_COMPONENT, MOVE_COMPONENT, UPDATE_PROPS,
 * DELETE_COMPONENT, UPDATE_BINDING, UPDATE_ACTION, UPDATE_PAGE_SETTINGS.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as uiBuilderApi from '../services/uiBuilderService.js';
import { createDefaultTree, createNode, DEVICE_KINDS } from '../model/uiDefinition.js';
import { canAcceptChildren, canContainComponent, defaultProps, getComponentDefinition, isKnownComponent } from '../registry/componentRegistry.js';

const MAX_HISTORY = 50;

/* ---------------- Async thunks (API réelle) ---------------- */

export const fetchOverview = createAsyncThunk('uiBuilder/fetchOverview', async (versionId) => uiBuilderApi.getOverview(versionId));
export const fetchPages = createAsyncThunk('uiBuilder/fetchPages', async (versionId) => uiBuilderApi.listPages(versionId));
export const fetchBusinessContext = createAsyncThunk('uiBuilder/fetchBusinessContext', async (versionId) => uiBuilderApi.getBusinessContext(versionId));
export const fetchValidation = createAsyncThunk('uiBuilder/fetchValidation', async (versionId) => uiBuilderApi.validateDefinition(versionId));
export const fetchUiDefinition = createAsyncThunk('uiBuilder/fetchUiDefinition', async (versionId) => uiBuilderApi.getUiDefinition(versionId));

export const submitCreatePage = createAsyncThunk('uiBuilder/submitCreatePage', async (body) => uiBuilderApi.createPage(body));
export const submitDeletePage = createAsyncThunk('uiBuilder/submitDeletePage', async (pageId) => uiBuilderApi.deletePage(pageId));
export const submitReorder = createAsyncThunk('uiBuilder/submitReorder', async ({ applicationVersionId, pageIds }) => uiBuilderApi.reorderPages(applicationVersionId, pageIds));
export const submitTheme = createAsyncThunk('uiBuilder/submitTheme', async ({ applicationVersionId, tokens }) => uiBuilderApi.saveTheme(applicationVersionId, tokens));

/** Sauvegarde de la page courante (composants + settings). */
export const saveCurrentPage = createAsyncThunk('uiBuilder/saveCurrentPage', async (_, { getState }) => {
  const state = getState().uiBuilder;
  const page = state.pages.find((p) => p.id === state.selectedPageId);
  if (!page) throw new Error('Aucune page sélectionnée');
  return uiBuilderApi.updatePage(page.id, {
    key: draftKey(page),
    route: page.route,
    title: page.title,
    description: page.description,
    type: page.type,
    layout: page.layout,
    visibility: page.visibility,
    order: page.order,
    permissions: page.permissions || [],
    components: state.tree,
    metadata: { ...(page.metadata || {}), icon: page.icon ?? null },
  });
}, {
  // Serialize writes so an older request cannot overwrite a newer edit.
  condition: (_, { getState }) => !getState().uiBuilder.pendingSave,
});

function draftKey(page) {
  return page.key;
}

/* ---------------- Helpers d'arbre ---------------- */

function withTree(state, mutator) {
  const nodes = { ...state.tree.nodes };
  const tree = { ...state.tree, nodes };
  mutator(tree, nodes);
  return tree;
}

function collectDescendants(nodes, nodeId, accumulator = []) {
  for (const childId of nodes[nodeId]?.children || []) {
    accumulator.push(childId);
    collectDescendants(nodes, childId, accumulator);
  }
  return accumulator;
}

/* ---------------- State initial ---------------- */

const initialState = {
  applicationVersionId: null,
  tenantId: null,
  requests: {},
  pendingSave: null,
  overview: null,
  businessContext: { entities: [] },
  pages: [],
  pagesStatus: 'IDLE',
  overviewStatus: 'IDLE',
  selectedPageId: null,
  selectedComponentId: null,
  tree: createDefaultTree(),
  device: 'DESKTOP',
  zoom: 1,
  saveState: 'CLEAN',
  saveError: null,
  validation: null,
  validationStatus: 'IDLE',
  themeStatus: 'IDLE',
  undoStack: [],
  redoStack: [],
  lastActionError: null,
};

const uiBuilderSlice = createSlice({
  name: 'uiBuilder',
  initialState,
  reducers: {
    setContext(state, action) {
      const { applicationVersionId, tenantId = null } = action.payload;
      if (state.applicationVersionId !== applicationVersionId || state.tenantId !== tenantId) {
        Object.assign(state, initialState, { applicationVersionId, tenantId });
      }
    },
    selectPage(state, action) {
      const page = state.pages.find((p) => p.id === action.payload);
      state.selectedPageId = page ? page.id : null;
      state.selectedComponentId = page ? (page.components?.root || 'root') : null;
      const tree = page?.components && page.components.root ? page.components : createDefaultTree();
      state.tree = tree;
      state.saveState = 'CLEAN';
      state.saveError = null;
      state.undoStack = [];
      state.redoStack = [];
    },
    selectComponent(state, action) {
      state.selectedComponentId = action.payload;
    },
    setDevice(state, action) {
      state.device = action.payload;
    },
    setZoom(state, action) {
      const zoom = Number(action.payload);
      if (Number.isFinite(zoom)) state.zoom = Math.min(Math.max(zoom, 0.5), 1.5);
    },

    /* ----- Opérations canvas (undoables) ----- */

    addComponent(state, action) {
      const { type, parentId, index } = action.payload;
      if (!isKnownComponent(type)) return;
      // Le composant est ajouté dans la sélection si elle accepte des enfants,
      // sinon à la racine (comportement « ajouter à la sélection »).
      const selected = state.selectedComponentId ? state.tree.nodes[state.selectedComponentId] : null;
      const selectedAcceptsComponent = selected && canContainComponent(selected.type, type);
      const parent = parentId || (selectedAcceptsComponent ? selected.id : state.tree.root);
      if (!state.tree.nodes[parent] || !canContainComponent(state.tree.nodes[parent].type, type)) return;
      const before = state.tree;
      const node = createNode(type, defaultProps(type));
      state.tree = withTree(state, (tree, nodes) => {
        nodes[node.id] = node;
        const children = [...(nodes[parent].children || [])];
        const at = typeof index === 'number' ? Math.max(0, Math.min(index, children.length)) : children.length;
        children.splice(at, 0, node.id);
        nodes[parent] = { ...nodes[parent], children };
      });
      state.selectedComponentId = node.id;
      pushHistory(state, { type: 'ADD_COMPONENT', doState: before });
      state.saveState = 'DIRTY';
      state.redoStack = [];
    },

    generateFormFromEntity(state, action) {
      const { entity, fields } = action.payload || {};
      if (!entity || !Array.isArray(fields)) return;
      const before = state.tree;
      const parentId = state.selectedComponentId && state.tree.nodes[state.selectedComponentId]
        && canContainComponent(state.tree.nodes[state.selectedComponentId].type, 'Form')
        ? state.selectedComponentId : state.tree.root;
      if (!canContainComponent(state.tree.nodes[parentId]?.type, 'Form')) return;
      const form = createNode('Form', { ...defaultProps('Form'), title: `Ajouter ${entity}` });
      const nodes = { ...state.tree.nodes, [form.id]: form };
      const parent = nodes[parentId];
      nodes[parentId] = { ...parent, children: [...(parent.children || []), form.id] };
      for (const field of fields.slice(0, 30)) {
        const node = createNode('FormField', {
          ...defaultProps('FormField'), label: field.label || field.code,
          required: Boolean(field.required), readonly: Boolean(field.readonly), inputType: fieldInputType(field.type),
        });
        node.bindings = { value: { kind: 'ENTITY_FIELD', entity, field: field.code } };
        nodes[node.id] = node;
        nodes[form.id] = { ...nodes[form.id], children: [...nodes[form.id].children, node.id] };
      }
      state.tree = { ...state.tree, nodes };
      state.selectedComponentId = form.id;
      pushHistory(state, { type: 'GENERATE_FORM', doState: before });
      state.saveState = 'DIRTY';
      state.redoStack = [];
    },

    moveComponent(state, action) {
      const { nodeId, newParentId, index } = action.payload;
      const nodes = state.tree.nodes;
      if (!nodes[nodeId] || !nodes[newParentId] || nodeId === state.tree.root || nodeId === newParentId) return;
      if (!canContainComponent(nodes[newParentId].type, nodes[nodeId].type)) return;
      // anti-cycle : le parent ne peut pas être un descendant du noeud déplacé
      if (collectDescendants(nodes, nodeId).includes(newParentId)) return;
      const before = state.tree;
      const oldParentId = Object.keys(nodes).find((id) => (nodes[id].children || []).includes(nodeId));
      state.tree = withTree(state, (tree, nextNodes) => {
        const oldSiblings = [...(nextNodes[oldParentId]?.children || [])];
        const oldIndex = oldSiblings.indexOf(nodeId);
        if (oldParentId) {
          nextNodes[oldParentId] = { ...nextNodes[oldParentId], children: oldSiblings.filter((id) => id !== nodeId) };
        }
        const siblings = [...(nextNodes[newParentId].children || [])];
        const requestedIndex = typeof index === 'number' ? index : siblings.length;
        const adjustedIndex = oldParentId === newParentId && oldIndex < requestedIndex ? requestedIndex - 1 : requestedIndex;
        const at = Math.max(0, Math.min(adjustedIndex, siblings.length));
        siblings.splice(at, 0, nodeId);
        nextNodes[newParentId] = { ...nextNodes[newParentId], children: siblings };
      });
      pushHistory(state, { type: 'MOVE_COMPONENT', doState: before });
      state.saveState = 'DIRTY';
      state.redoStack = [];
    },

    updateComponentProps(state, action) {
      const { nodeId, props } = action.payload;
      if (!state.tree.nodes[nodeId]) return;
      const before = state.tree;
      state.tree = withTree(state, (tree, nodes) => {
        nodes[nodeId] = { ...nodes[nodeId], props: { ...nodes[nodeId].props, ...props } };
      });
      pushHistory(state, { type: 'UPDATE_PROPS', doState: before });
      state.saveState = 'DIRTY';
      state.redoStack = [];
    },

    updateComponentResponsive(state, action) {
      const { nodeId, device, patch } = action.payload;
      if (!state.tree.nodes[nodeId] || !DEVICE_KINDS.includes(device) || !patch || typeof patch !== 'object') return;
      const before = state.tree;
      state.tree = withTree(state, (tree, nodes) => {
        const responsive = { ...(nodes[nodeId].responsive || {}) };
        responsive[device] = { ...(responsive[device] || {}), ...patch };
        nodes[nodeId] = { ...nodes[nodeId], responsive };
      });
      pushHistory(state, { type: 'UPDATE_RESPONSIVE', doState: before });
      state.saveState = 'DIRTY';
      state.redoStack = [];
    },

    updateComponentBinding(state, action) {
      const { nodeId, prop, binding } = action.payload;
      if (!state.tree.nodes[nodeId]) return;
      const before = state.tree;
      state.tree = withTree(state, (tree, nodes) => {
        const bindings = { ...(nodes[nodeId].bindings || {}) };
        if (binding) bindings[prop] = binding; else delete bindings[prop];
        nodes[nodeId] = { ...nodes[nodeId], bindings };
      });
      pushHistory(state, { type: 'UPDATE_BINDING', doState: before });
      state.saveState = 'DIRTY';
      state.redoStack = [];
    },

    updateComponentActions(state, action) {
      const { nodeId, actions } = action.payload;
      if (!state.tree.nodes[nodeId]) return;
      const before = state.tree;
      state.tree = withTree(state, (tree, nodes) => {
        nodes[nodeId] = { ...nodes[nodeId], actions };
      });
      pushHistory(state, { type: 'UPDATE_ACTION', doState: before });
      state.saveState = 'DIRTY';
      state.redoStack = [];
    },

    deleteComponent(state, action) {
      const nodeId = action.payload;
      const nodes = state.tree.nodes;
      if (!nodes[nodeId] || nodeId === state.tree.root) return;
      const before = state.tree;
      const parent = Object.keys(nodes).find((id) => (nodes[id].children || []).includes(nodeId));
      state.tree = withTree(state, (tree, nextNodes) => {
        if (parent) {
          nextNodes[parent] = { ...nextNodes[parent], children: (nextNodes[parent].children || []).filter((id) => id !== nodeId) };
        }
        for (const doomed of [nodeId, ...collectDescendants(nextNodes, nodeId)]) {
          delete nextNodes[doomed];
        }
      });
      if (state.selectedComponentId === nodeId || collectDescendants(nodes, nodeId).includes(state.selectedComponentId)) {
        state.selectedComponentId = state.tree.root;
      }
      pushHistory(state, { type: 'DELETE_COMPONENT', doState: before });
      if (state.selectedComponentId === nodeId || collectDescendants(nodes, nodeId).includes(state.selectedComponentId)) {
        state.selectedComponentId = parent || state.tree.root;
      }
      state.saveState = 'DIRTY';
      state.redoStack = [];
    },

    duplicateComponent(state, action) {
      const nodeId = action.payload;
      const nodes = state.tree.nodes;
      if (!nodes[nodeId]) return;
      const parent = Object.keys(nodes).find((id) => (nodes[id].children || []).includes(nodeId));
      if (!parent) return;
      const before = state.tree;
      const idMap = new Map();
      const newNodes = {};
      const cloneSubtree = (id) => {
        const source = nodes[id];
        const newId = idMap.get(id) || (id + '-c' + Math.random().toString(36).slice(2, 6));
        idMap.set(id, newId);
        const clone = { ...JSON.parse(JSON.stringify(source)), id: newId, children: [] };
        clone.children = (source.children || []).map(cloneSubtree);
        newNodes[newId] = clone;
        return newId;
      };
      const cloneRootId = cloneSubtree(nodeId);
      state.tree = { root: state.tree.root, nodes: { ...nodes, ...newNodes, [parent]: { ...nodes[parent], children: [...(nodes[parent].children || []), cloneRootId] } } };
      state.selectedComponentId = cloneRootId;
      pushHistory(state, { type: 'ADD_COMPONENT', doState: before });
      state.saveState = 'DIRTY';
      state.redoStack = [];
    },

    updatePageSettings(state, action) {
      const { pageId, patch } = action.payload;
      const page = state.pages.find((p) => p.id === pageId);
      if (!page) return;
      Object.assign(page, patch);
      if (state.selectedPageId === pageId) state.saveState = 'DIRTY';
    },

    /* ----- Undo / Redo ----- */
    undo(state) {
      const previous = state.undoStack.pop();
      if (!previous) return;
      state.redoStack.push({ type: previous.type, doState: state.tree });
      state.tree = previous.doState;
      if (!state.tree.nodes[state.selectedComponentId]) state.selectedComponentId = state.tree.root;
      state.saveState = 'DIRTY';
    },
    redo(state) {
      const next = state.redoStack.pop();
      if (!next) return;
      state.undoStack.push({ type: next.type, doState: state.tree });
      state.tree = next.doState;
      if (!state.tree.nodes[state.selectedComponentId]) state.selectedComponentId = state.tree.root;
      state.saveState = 'DIRTY';
    },
    clearActionError(state) {
      state.lastActionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverview.pending, (state, action) => { state.requests.fetchOverview = action.meta.requestId; state.overviewStatus = 'LOADING'; })
      .addCase(fetchOverview.fulfilled, (state, action) => {
        if (state.requests.fetchOverview !== action.meta.requestId) return;
        state.overviewStatus = 'LOADED'; state.overview = action.payload; })
      .addCase(fetchOverview.rejected, (state, action) => {
        if (state.requests.fetchOverview !== action.meta.requestId) return;
        state.overviewStatus = 'ERROR'; state.lastActionError = action.error?.message || 'Erreur'; })

      .addCase(fetchPages.pending, (state, action) => { state.requests.fetchPages = action.meta.requestId; state.pagesStatus = 'LOADING'; })
      .addCase(fetchPages.fulfilled, (state, action) => {
        if (state.requests.fetchPages !== action.meta.requestId) return;
        state.pagesStatus = 'LOADED';
        state.pages = action.payload;
        if (state.selectedPageId && !action.payload.some((p) => p.id === state.selectedPageId)) {
          state.selectedPageId = null;
          state.tree = createDefaultTree();
        }
      })
      .addCase(fetchPages.rejected, (state, action) => {
        if (state.requests.fetchPages !== action.meta.requestId) return;
        state.pagesStatus = 'ERROR'; })

      .addCase(fetchBusinessContext.pending, (state, action) => { state.requests.fetchBusinessContext = action.meta.requestId; })
      .addCase(fetchBusinessContext.fulfilled, (state, action) => {
        if (state.requests.fetchBusinessContext !== action.meta.requestId) return;
        state.businessContext = action.payload; })
      .addCase(fetchValidation.pending, (state, action) => { state.requests.fetchValidation = action.meta.requestId; state.validationStatus = 'LOADING'; })
      .addCase(fetchValidation.fulfilled, (state, action) => {
        if (state.requests.fetchValidation !== action.meta.requestId) return;
        state.validationStatus = 'LOADED'; state.validation = action.payload; })
      .addCase(fetchValidation.rejected, (state, action) => {
        if (state.requests.fetchValidation !== action.meta.requestId) return;
        state.validationStatus = 'ERROR'; })

      .addCase(submitCreatePage.pending, (state, action) => { state.requests[action.meta.requestId] = true; })
      .addCase(submitCreatePage.fulfilled, (state, action) => {
        if (!state.requests[action.meta.requestId]) return;
        delete state.requests[action.meta.requestId];
        state.pages.push(action.payload);
        state.lastActionError = null;
      })
      .addCase(submitCreatePage.rejected, (state, action) => {
        if (!state.requests[action.meta.requestId]) return;
        delete state.requests[action.meta.requestId];
        state.lastActionError = action.error?.message || 'Création impossible'; })
      .addCase(submitDeletePage.pending, (state, action) => { state.requests[action.meta.requestId] = true; })
      .addCase(submitDeletePage.fulfilled, (state, action) => {
        if (!state.requests[action.meta.requestId]) return;
        delete state.requests[action.meta.requestId];
        state.pages = state.pages.filter((p) => p.id !== action.meta.arg);
        if (state.selectedPageId === action.meta.arg) {
          state.selectedPageId = null;
          state.tree = createDefaultTree();
        }
      })

      .addCase(saveCurrentPage.pending, (state, action) => {
        state.pendingSave = { requestId: action.meta.requestId, pageId: state.selectedPageId, tree: state.tree, page: state.pages.find((p) => p.id === state.selectedPageId) };
        state.saveState = 'SAVING';
        state.saveError = null;
      })
      .addCase(saveCurrentPage.fulfilled, (state, action) => {
        const saved = state.pendingSave;
        if (!saved || saved.requestId !== action.meta.requestId) return;
        const index = state.pages.findIndex((p) => p.id === saved.pageId);
        const pageChanged = index !== -1 && JSON.stringify(state.pages[index]) !== JSON.stringify(saved.page);
        if (action.payload && index !== -1) {
          state.pages[index] = { ...state.pages[index], ...(pageChanged ? {} : action.payload), components: saved.tree };
        }
        if (state.selectedPageId === saved.pageId) {
          state.saveState = !pageChanged && JSON.stringify(state.tree) === JSON.stringify(saved.tree) ? 'SAVED' : 'DIRTY';
        }
        state.pendingSave = null;
      })
      .addCase(saveCurrentPage.rejected, (state, action) => {
        if (state.pendingSave?.requestId !== action.meta.requestId) return;
        if (state.selectedPageId === state.pendingSave.pageId) {
          state.saveState = 'ERROR';
          state.saveError = action.error?.message || 'Erreur d’enregistrement';
        }
        state.pendingSave = null;
      })

      .addCase(submitTheme.pending, (state, action) => { state.requests[action.meta.requestId] = true; state.themeStatus = 'SAVING'; })
      .addCase(submitTheme.fulfilled, (state, action) => {
        if (!state.requests[action.meta.requestId]) return;
        delete state.requests[action.meta.requestId];
        state.themeStatus = 'SAVED'; })
      .addCase(submitTheme.rejected, (state, action) => {
        if (!state.requests[action.meta.requestId]) return;
        delete state.requests[action.meta.requestId];
        state.themeStatus = 'ERROR'; });
  },
});

function pushHistory(state, entry) {
  state.undoStack.push(entry);
  if (state.undoStack.length > MAX_HISTORY) state.undoStack.shift();
}

function fieldInputType(type) {
  const normalized = String(type || '').toUpperCase();
  if (['INT', 'INTEGER', 'DECIMAL', 'FLOAT', 'NUMBER'].includes(normalized)) return 'number';
  if (['DATE', 'DATETIME', 'TIMESTAMP'].includes(normalized)) return 'date';
  if (normalized === 'EMAIL') return 'email';
  return 'text';
}

export const {
  setContext,
  selectPage,
  selectComponent,
  setDevice,
  setZoom,
  addComponent,
  generateFormFromEntity,
  moveComponent,
  updateComponentProps,
  updateComponentResponsive,
  updateComponentBinding,
  updateComponentActions,
  deleteComponent,
  duplicateComponent,
  updatePageSettings,
  undo,
  redo,
  clearActionError,
} = uiBuilderSlice.actions;

export default uiBuilderSlice.reducer;
