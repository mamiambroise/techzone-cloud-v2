/**
 * UI Builder — state Redux (state normalisé, undo/redo typés CDC §30).
 *
 * Save states : CLEAN → DIRTY → SAVING → SAVED / ERROR (mission §28).
 * Undo/Redo : opérations ADD_COMPONENT, MOVE_COMPONENT, UPDATE_PROPS,
 * DELETE_COMPONENT, UPDATE_BINDING, UPDATE_ACTION, UPDATE_PAGE_SETTINGS.
 */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import * as uiBuilderApi from '../services/uiBuilderService.js';
import { createDefaultTree, createNode } from '../model/uiDefinition.js';
import { defaultProps, getComponentDefinition, isKnownComponent } from '../registry/componentRegistry.js';

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
      const { applicationVersionId } = action.payload;
      if (state.applicationVersionId !== applicationVersionId) {
        state.applicationVersionId = applicationVersionId;
        state.overview = null;
        state.pages = [];
        state.selectedPageId = null;
        state.selectedComponentId = null;
        state.tree = createDefaultTree();
        state.saveState = 'CLEAN';
        state.validation = null;
        state.undoStack = [];
        state.redoStack = [];
      }
    },
    selectPage(state, action) {
      const page = state.pages.find((p) => p.id === action.payload);
      state.selectedPageId = page ? page.id : null;
      state.selectedComponentId = page ? state.tree.root : null;
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
      const { type, parentId } = action.payload;
      if (!isKnownComponent(type)) return;
      // Le composant est ajouté dans la sélection si elle accepte des enfants,
      // sinon à la racine (comportement « ajouter à la sélection »).
      const selected = state.selectedComponentId ? state.tree.nodes[state.selectedComponentId] : null;
      const selectedDef = selected ? getComponentDefinition(selected.type) : null;
      const selectedAcceptsChildren = selected && (selectedDef?.allowedChildren === '*' || (selectedDef?.allowedChildren?.length || 0) > 0);
      const parent = parentId || (selectedAcceptsChildren ? selected.id : state.tree.root);
      if (!state.tree.nodes[parent]) return;
      const before = state.tree;
      const node = createNode(type, defaultProps(type));
      state.tree = withTree(state, (tree, nodes) => {
        nodes[node.id] = node;
        nodes[parent] = { ...nodes[parent], children: [...(nodes[parent].children || []), node.id] };
      });
      state.selectedComponentId = node.id;
      pushHistory(state, { type: 'ADD_COMPONENT', doState: before });
      state.saveState = 'DIRTY';
      state.redoStack = [];
    },

    moveComponent(state, action) {
      const { nodeId, newParentId, index } = action.payload;
      const nodes = state.tree.nodes;
      if (!nodes[nodeId] || !nodes[newParentId]) return;
      if (nodeId === newParentId) return;
      // anti-cycle : le parent ne peut pas être un descendant du noeud déplacé
      if (collectDescendants(nodes, nodeId).includes(newParentId)) return;
      const before = state.tree;
      const oldParentId = Object.keys(nodes).find((id) => (nodes[id].children || []).includes(nodeId));
      state.tree = withTree(state, (tree, nextNodes) => {
        if (oldParentId) {
          nextNodes[oldParentId] = { ...nextNodes[oldParentId], children: (nextNodes[oldParentId].children || []).filter((id) => id !== nodeId) };
        }
        const siblings = [...(nextNodes[newParentId].children || [])];
        const at = typeof index === 'number' ? Math.max(0, Math.min(index, siblings.length)) : siblings.length;
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
      .addCase(fetchOverview.pending, (state) => { state.overviewStatus = 'LOADING'; })
      .addCase(fetchOverview.fulfilled, (state, action) => { state.overviewStatus = 'LOADED'; state.overview = action.payload; })
      .addCase(fetchOverview.rejected, (state, action) => { state.overviewStatus = 'ERROR'; state.lastActionError = action.error?.message || 'Erreur'; })

      .addCase(fetchPages.pending, (state) => { state.pagesStatus = 'LOADING'; })
      .addCase(fetchPages.fulfilled, (state, action) => {
        state.pagesStatus = 'LOADED';
        state.pages = action.payload;
        if (state.selectedPageId && !action.payload.some((p) => p.id === state.selectedPageId)) {
          state.selectedPageId = null;
          state.tree = createDefaultTree();
        }
      })
      .addCase(fetchPages.rejected, (state) => { state.pagesStatus = 'ERROR'; })

      .addCase(fetchBusinessContext.fulfilled, (state, action) => { state.businessContext = action.payload; })
      .addCase(fetchValidation.pending, (state) => { state.validationStatus = 'LOADING'; })
      .addCase(fetchValidation.fulfilled, (state, action) => { state.validationStatus = 'LOADED'; state.validation = action.payload; })
      .addCase(fetchValidation.rejected, (state) => { state.validationStatus = 'ERROR'; })

      .addCase(submitCreatePage.fulfilled, (state, action) => {
        state.pages.push(action.payload);
        state.lastActionError = null;
      })
      .addCase(submitCreatePage.rejected, (state, action) => { state.lastActionError = action.error?.message || 'Création impossible'; })
      .addCase(submitDeletePage.fulfilled, (state, action) => {
        state.pages = state.pages.filter((p) => p.id !== action.meta.arg);
        if (state.selectedPageId === action.meta.arg) {
          state.selectedPageId = null;
          state.tree = createDefaultTree();
        }
      })

      .addCase(saveCurrentPage.pending, (state) => { state.saveState = 'SAVING'; state.saveError = null; })
      .addCase(saveCurrentPage.fulfilled, (state, action) => {
        state.saveState = 'SAVED';
        const index = state.pages.findIndex((p) => p.id === action.meta.arg?.id || p.id === action.payload?.id);
        if (action.payload && index !== -1) {
          state.pages[index] = { ...state.pages[index], ...action.payload, components: state.tree };
        }
        state.undoStack = [];
        state.redoStack = [];
      })
      .addCase(saveCurrentPage.rejected, (state, action) => { state.saveState = 'ERROR'; state.saveError = action.error?.message || 'Erreur d’enregistrement'; })

      .addCase(submitTheme.pending, (state) => { state.themeStatus = 'SAVING'; })
      .addCase(submitTheme.fulfilled, (state) => { state.themeStatus = 'SAVED'; })
      .addCase(submitTheme.rejected, (state) => { state.themeStatus = 'ERROR'; });
  },
});

function pushHistory(state, entry) {
  state.undoStack.push(entry);
  if (state.undoStack.length > MAX_HISTORY) state.undoStack.shift();
}

export const {
  setContext,
  selectPage,
  selectComponent,
  setDevice,
  setZoom,
  addComponent,
  moveComponent,
  updateComponentProps,
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
