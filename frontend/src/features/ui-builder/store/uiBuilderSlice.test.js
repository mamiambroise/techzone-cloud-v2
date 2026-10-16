/**
 * Tests UI Builder — slice Redux (opérations canvas, undo/redo, dirty states).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

import reducer, {
  fetchPages, fetchBusinessContext, saveCurrentPage, submitCreatePage, submitDeletePage, submitTheme, setContext, selectPage, selectComponent, addComponent, moveComponent,
  updateComponentProps, updateComponentResponsive, updateComponentBinding, updateComponentActions, generateFormFromEntity,
  deleteComponent, updatePageSettings, undo, redo,
} from './uiBuilderSlice.js';
import { createDefaultTree } from '../model/uiDefinition.js';

const initial = () => reducer(undefined, { type: '@@init' });

describe('uiBuilderSlice — contexte', () => {
  it('setContext réinitialise l’état à un changement de version', () => {
    let state = initial();
    state = reducer(state, setContext({ applicationVersionId: 'v1' }));
    state = reducer(state, addComponent({ type: 'Heading' }));
    expect(state.tree.nodes.root.children.length).toBe(1);

    state = reducer(state, setContext({ applicationVersionId: 'v2' }));
    expect(state.tree.nodes.root.children).toEqual([]);
    expect(state.saveState).toBe('CLEAN');
    expect(state.undoStack).toHaveLength(0);
  });
});

describe('uiBuilderSlice — opérations canvas', () => {
  let state;
  beforeEach(() => {
    state = initial();
    state = reducer(state, setContext({ applicationVersionId: 'v1' }));
  });

  it('addComponent ajoute un enfant à la racine et sélectionne le composant', () => {
    state = reducer(state, addComponent({ type: 'Heading' }));
    expect(state.tree.nodes.root.children).toHaveLength(1);
    expect(state.selectedComponentId).toBe(state.tree.nodes.root.children[0]);
    expect(state.saveState).toBe('DIRTY');
    expect(state.undoStack).toHaveLength(1);
    expect(state.undoStack[0].type).toBe('ADD_COMPONENT');
  });

  it('moveComponent déplace un composant vers un autre parent (nesting)', () => {
    state = reducer(state, addComponent({ type: 'Card' })); // card
    state = reducer(state, addComponent({ type: 'Grid' }));  // grid (selected)
    const gridId = state.selectedComponentId;
    const cardId = state.tree.nodes.root.children[0];
    state = reducer(state, selectComponent(cardId));
    state = reducer(state, addComponent({ type: 'Section' })); // section dans card
    const sectionId = state.selectedComponentId;

    state = reducer(state, moveComponent({ nodeId: sectionId, newParentId: gridId }));
    expect(state.tree.nodes[gridId].children).toContain(sectionId);
    expect(state.tree.nodes[cardId].children).not.toContain(sectionId);
    expect(state.undoStack.at(-1).type).toBe('MOVE_COMPONENT');
  });

  it('moveComponent refuse un cycle (parent = descendant)', () => {
    state = reducer(state, addComponent({ type: 'Card' }));
    const cardId = state.selectedComponentId;
    state = reducer(state, addComponent({ type: 'Section' }));
    const sectionId = state.selectedComponentId;
    // Déplace Section dans Card, puis tente de déplacer Card (ancêtre de Section) dans Section → refus.
    state = reducer(state, moveComponent({ nodeId: sectionId, newParentId: cardId }));
    const before = JSON.stringify(state.tree);

    state = reducer(state, moveComponent({ nodeId: cardId, newParentId: sectionId }));
    expect(JSON.stringify(state.tree)).toBe(before);
  });

  it('moveComponent réordonne les frères et refuse les conteneurs incompatibles', () => {
    state = reducer(state, addComponent({ type: 'Heading' }));
    const headingId = state.selectedComponentId;
    state = reducer(state, addComponent({ type: 'Text' }));
    const textId = state.selectedComponentId;
    state = reducer(state, addComponent({ type: 'Form' }));
    const formId = state.selectedComponentId;

    state = reducer(state, moveComponent({ nodeId: headingId, newParentId: 'root', index: 2 }));
    expect(state.tree.nodes.root.children).toEqual([textId, headingId, formId]);

    const before = JSON.stringify(state.tree);
    state = reducer(state, moveComponent({ nodeId: headingId, newParentId: formId }));
    expect(JSON.stringify(state.tree)).toBe(before);
  });

  it('addComponent refuse les types interdits par le registre du conteneur', () => {
    state = reducer(state, addComponent({ type: 'Form' }));
    const formId = state.selectedComponentId;
    const before = JSON.stringify(state.tree);

    state = reducer(state, addComponent({ type: 'Heading', parentId: formId }));

    expect(JSON.stringify(state.tree)).toBe(before);
  });

  it('enregistre les overrides responsifs sur le nœud et les restaure avec undo', () => {
    state = reducer(state, addComponent({ type: 'Heading' }));
    const headingId = state.selectedComponentId;

    state = reducer(state, updateComponentResponsive({ nodeId: headingId, device: 'MOBILE', patch: { visible: 'hidden' } }));

    expect(state.tree.nodes[headingId].responsive).toEqual({ MOBILE: { visible: 'hidden' } });
    expect(state.tree.nodes[headingId].props.MOBILE).toBeUndefined();
    expect(state.saveState).toBe('DIRTY');
    state = reducer(state, undo());
    expect(state.tree.nodes[headingId].responsive).toEqual({});
  });

  it('updateComponentProps / Binding / Actions marquent DIRTY et empilent l’undo', () => {
    state = reducer(state, addComponent({ type: 'Text' }));
    const id = state.selectedComponentId;

    state = reducer(state, updateComponentProps({ nodeId: id, props: { text: 'Bonjour' } }));
    expect(state.tree.nodes[id].props.text).toBe('Bonjour');
    expect(state.undoStack.at(-1).type).toBe('UPDATE_PROPS');

    state = reducer(state, updateComponentBinding({ nodeId: id, prop: 'text', binding: { kind: 'ENTITY_FIELD', entity: 'customer', field: 'name' } }));
    expect(state.tree.nodes[id].bindings.text.kind).toBe('ENTITY_FIELD');
    expect(state.undoStack.at(-1).type).toBe('UPDATE_BINDING');

    state = reducer(state, updateComponentActions({ nodeId: id, actions: [{ type: 'NAVIGATE', config: { route: '/customers' } }] }));
    expect(state.tree.nodes[id].actions[0].type).toBe('NAVIGATE');
    expect(state.undoStack.at(-1).type).toBe('UPDATE_ACTION');
    expect(state.saveState).toBe('DIRTY');
  });

  it('deleteComponent supprime le sous-arbre et remonte la sélection', () => {
    state = reducer(state, addComponent({ type: 'Card' }));
    const cardId = state.selectedComponentId;
    state = reducer(state, selectComponent('root'));
    state = reducer(state, addComponent({ type: 'Text' })); // feuille → ajouté à la racine
    const textId = state.selectedComponentId;
    expect(state.tree.nodes[textId]).toBeTruthy();

    state = reducer(state, selectComponent(textId));
    state = reducer(state, deleteComponent(textId));
    expect(state.tree.nodes[textId]).toBeUndefined();
    expect(state.tree.nodes.root.children).not.toContain(textId);
    expect(state.selectedComponentId).toBe('root');
    expect(state.undoStack.at(-1).type).toBe('DELETE_COMPONENT');
  });

  it('addComponent niche dans la sélection conteneur, sinon ajoute à la racine', () => {
    state = reducer(state, addComponent({ type: 'Card' }));
    const cardId = state.selectedComponentId;
    // Card est un conteneur → le prochain addComponent niche dedans.
    state = reducer(state, addComponent({ type: 'Text' }));
    const textId = state.selectedComponentId;
    expect(state.tree.nodes[cardId].children).toContain(textId);
    // Text est une feuille → le prochain composant va à la racine.
    state = reducer(state, addComponent({ type: 'Button' }));
    expect(state.tree.nodes.root.children).toContain(state.selectedComponentId);
  });

  it('deleteComponent refuse de supprimer la racine', () => {
    const before = JSON.stringify(state.tree);
    state = reducer(state, deleteComponent('root'));
    expect(JSON.stringify(state.tree)).toBe(before);
  });

  it('génère un formulaire lié aux champs Business Manager sans modèle dupliqué', () => {
    state = reducer(state, generateFormFromEntity({ entity: 'product', fields: [
      { code: 'name', label: 'Nom', required: true, type: 'STRING' },
      { code: 'price', label: 'Prix', type: 'DECIMAL' },
    ] }));
    const form = state.tree.nodes[state.selectedComponentId];
    expect(form.type).toBe('Form');
    expect(form.children).toHaveLength(2);
    expect(state.tree.nodes[form.children[1]].bindings.value).toEqual({ kind: 'ENTITY_FIELD', entity: 'product', field: 'price' });
    expect(state.tree.nodes[form.children[1]].props.inputType).toBe('number');
  });
});

describe('uiBuilderSlice — Undo / Redo', () => {
  let state;
  beforeEach(() => {
    state = initial();
    state = reducer(state, setContext({ applicationVersionId: 'v1' }));
  });

  it('undo restaure l’arbre précédent puis redo le réapplique', () => {
    state = reducer(state, addComponent({ type: 'Heading' }));
    expect(state.tree.nodes.root.children).toHaveLength(1);

    state = reducer(state, undo());
    expect(state.tree.nodes.root.children).toHaveLength(0);
    expect(state.redoStack).toHaveLength(1);

    state = reducer(state, redo());
    expect(state.tree.nodes.root.children).toHaveLength(1);
  });

  it('redoStack est purgé après une nouvelle opération', () => {
    state = reducer(state, addComponent({ type: 'Heading' }));
    state = reducer(state, undo());
    expect(state.redoStack).toHaveLength(1);
    state = reducer(state, addComponent({ type: 'Text' }));
    expect(state.redoStack).toHaveLength(0);
  });
});

describe('uiBuilderSlice — selectPage', () => {
  it('charge l’arbre de la page et repart à CLEAN', () => {
    let state = initial();
    state = reducer(state, setContext({ applicationVersionId: 'v1' }));
    state = reducer(state, reducerHelperPage());
    state = reducer(state, addComponent({ type: 'Text' }));
    expect(state.saveState).toBe('DIRTY');

    state = reducer(state, selectPage('p-1'));
    expect(state.saveState).toBe('CLEAN');
    expect(state.tree).toEqual(createDefaultTree());
  });
});

function reducerHelperPage() {
  return (dispatchState) => dispatchState;
}


describe('UI Builder — isolation et sauvegarde asynchrone', () => {
  const page = (id, root = 'root') => ({ id, components: { root, nodes: { [root]: { id: root, type: 'Container', props: {}, children: [] } } } });
  function loaded() {
    let state = reducer(initial(), setContext({ applicationVersionId: 'v1', tenantId: 'a' }));
    state = reducer(state, fetchPages.pending('pages', 'v1'));
    state = reducer(state, fetchPages.fulfilled([page('p1'), page('p2', 'other-root')], 'pages', 'v1'));
    return reducer(state, selectPage('p1'));
  }
  it('ignore les réponses du contexte précédent', () => {
    let state = loaded();
    state = reducer(state, fetchBusinessContext.pending('business', 'v1'));
    state = reducer(state, setContext({ applicationVersionId: 'v2', tenantId: 'b' }));
    state = reducer(state, fetchPages.fulfilled([page('foreign')], 'pages', 'v1'));
    state = reducer(state, fetchBusinessContext.fulfilled({ entities: [{ code: 'foreign' }] }, 'business', 'v1'));
    expect(state.pages).toEqual([]);
    expect(state.businessContext.entities).toEqual([]);
    expect(state.pagesStatus).toBe('IDLE');
  });
  it('ignore une réponse dépassée dans la même version', () => {
    let state = loaded();
    state = reducer(state, fetchPages.pending('old', 'v1'));
    state = reducer(state, fetchPages.pending('new', 'v1'));
    state = reducer(state, fetchPages.fulfilled([page('current')], 'new', 'v1'));
    state = reducer(state, fetchPages.fulfilled([page('obsolete')], 'old', 'v1'));
    expect(state.pages[0].id).toBe('current');
  });
  it('conserve les modifications effectuées pendant une sauvegarde', () => {
    let state = loaded();
    const sentTree = state.tree;
    state = reducer(state, saveCurrentPage.pending('save'));
    state = reducer(state, addComponent({ type: 'Text' }));
    state = reducer(state, saveCurrentPage.fulfilled(page('p1'), 'save'));
    expect(state.saveState).toBe('DIRTY');
    expect(state.tree.nodes.root.children).toHaveLength(1);
    expect(state.pages[0].components).toEqual(sentTree);
    expect(state.undoStack).toHaveLength(1);
  });
  it('ne copie pas le canvas de la page suivante dans la page sauvegardée', () => {
    let state = loaded();
    const sentTree = state.tree;
    state = reducer(state, saveCurrentPage.pending('save'));
    state = reducer(state, selectPage('p2'));
    state = reducer(state, saveCurrentPage.fulfilled(page('p1'), 'save'));
    expect(state.pages[0].components).toEqual(sentTree);
    expect(state.tree.root).toBe('other-root');
    expect(state.selectedComponentId).toBe('other-root');
    expect(state.saveState).toBe('CLEAN');
  });
  it('refuse de lancer une deuxième sauvegarde pendant la première', async () => {
    const state = reducer(loaded(), saveCurrentPage.pending('save'));
    const store = configureStore({ reducer: { uiBuilder: reducer }, preloadedState: { uiBuilder: state } });
    const result = await store.dispatch(saveCurrentPage());
    expect(result.meta.condition).toBe(true);
    expect(store.getState().uiBuilder.pendingSave.requestId).toBe('save');
  });
  it('préserve les paramètres de page modifiés pendant la sauvegarde', () => {
    let state = loaded();
    state = reducer(state, saveCurrentPage.pending('save'));
    state = reducer(state, updatePageSettings({ pageId: 'p1', patch: { title: 'Titre récent' } }));
    state = reducer(state, saveCurrentPage.fulfilled({ ...page('p1'), title: 'Ancien titre' }, 'save'));
    expect(state.pages[0].title).toBe('Titre récent');
    expect(state.saveState).toBe('DIRTY');
  });
  it('purge aussi le contexte quand seul le tenant change', () => {
    let state = loaded();
    state = reducer(state, setContext({ applicationVersionId: 'v1', tenantId: 'b' }));
    expect(state.pages).toEqual([]);
    expect(state.tenantId).toBe('b');
  });
  it('ignore les mutations terminées après un changement de contexte', () => {
    let state = loaded();
    state = reducer(state, submitCreatePage.pending('create', {}));
    state = reducer(state, submitDeletePage.pending('delete', 'p1'));
    state = reducer(state, submitTheme.pending('theme', {}));
    state = reducer(state, setContext({ applicationVersionId: 'v2', tenantId: 'b' }));
    state = reducer(state, submitCreatePage.fulfilled(page('foreign'), 'create', {}));
    state = reducer(state, submitDeletePage.fulfilled({}, 'delete', 'p1'));
    state = reducer(state, submitTheme.fulfilled({}, 'theme', {}));
    expect(state.pages).toEqual([]);
    expect(state.themeStatus).toBe('IDLE');
  });
  it('ignore une sauvegarde terminée après un changement de contexte', () => {
    let state = loaded();
    state = reducer(state, saveCurrentPage.pending('save'));
    state = reducer(state, setContext({ applicationVersionId: 'v2' }));
    state = reducer(state, saveCurrentPage.fulfilled(page('p1'), 'save'));
    expect(state.pages).toEqual([]);
    expect(state.saveState).toBe('CLEAN');
  });
});

describe('optimistic save conflict recovery', () => {
  it('keeps local edits and blocks writes until server reload is explicit', async () => {
    let state = initial();
    state = reducer(state, fetchPages.pending('pages', 'v1'));
    const serverPage = { id: 'p', key: 'page', updatedAt: '2026-10-16T10:00:00.000Z', components: createDefaultTree() };
    state = reducer(state, fetchPages.fulfilled([serverPage], 'pages', 'v1'));
    state = reducer(state, selectPage('p'));
    state = reducer(state, addComponent({ type: 'Text' }));
    const local = state.tree;
    state = reducer(state, saveCurrentPage.pending('save'));
    state = reducer(state, saveCurrentPage.rejected(null, 'save', undefined, { code: 'UI_SAVE_CONFLICT', serverPage, message: 'Conflit' }));
    expect(state.saveState).toBe('CONFLICT');
    expect(state.tree).toEqual(local);
    const store = configureStore({ reducer: { uiBuilder: reducer }, preloadedState: { uiBuilder: state } });
    expect((await store.dispatch(saveCurrentPage())).meta.condition).toBe(true);
    state = reducer(state, { type: 'uiBuilder/reloadConflictingPage' });
    expect(state.tree).toEqual(serverPage.components);
    expect(state.saveConflict).toBeNull();
    expect(state.saveState).toBe('CLEAN');
  });
});
