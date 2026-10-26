/**
 * UI Builder — Visual Editor (mission §11-§17, §25-§26, §28, §30).
 *
 * Architecture : barre d'outils (Page | Device | Undo/Redo | Zoom | Validate |
 * Preview | Save) + panneau gauche (Component Library) + Canvas central
 * (drag & drop, sélection, nesting) + Inspector droit (Content / Data /
 * Actions / Responsive) + barre de statut (Validation, save state).
 *
 * - Canvas = Shared Renderer enrichi d'overlays de sélection/drop zones.
 * - Inspector généré depuis le propertiesSchema du Component Registry.
 * - Save states réels : CLEAN / DIRTY / SAVING / SAVED / ERROR.
 * - Drag & drop natif HTML5 (aucune dépendance supplémentaire).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Monitor, Tablet, Smartphone, Undo2, Redo2, Save, ShieldCheck, Eye, Search,
  Trash2, Copy, Plus, GripVertical, ChevronRight, Loader2, Check, TriangleAlert, XCircle, Info, ArrowUp, ArrowDown,
} from 'lucide-react';

import {
  selectPage, selectComponent, setDevice, setZoom, addComponent, moveComponent,
  updateComponentProps, updateComponentResponsive, updateComponentBinding, updateComponentActions,
  deleteComponent, duplicateComponent, undo, redo, saveCurrentPage, fetchValidation, reloadConflictingPage,
} from '../store/uiBuilderSlice.js';
import { DEVICE_KINDS, DEVICE_WIDTHS, BINDING_KINDS, CONTEXT_KEYS, ACTION_TYPES, describeError } from '../model/uiDefinition.js';
import { canAcceptChildren, canContainComponent, componentsByCategory, getComponentDefinition } from '../registry/componentRegistry.js';
import { createBindingResolver } from '../renderer/bindingResolver.js';
import { UiRenderer } from '../renderer/Renderer.jsx';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { resolveEditorPage } from '../model/resolveEditorPage.js';
import { BmButton, BmIconButton, BmBadge, BmEmptyState, BmErrorState, BmLoading, BmSelect } from '../../../components/business-manager/bm/ui.jsx';
import { ROUTES } from '../../../app/routes.js';

/* ============================================================
   Composant racine
   ============================================================ */

export default function UiVisualEditor() {
  return (
    <UiBuilderLayout subTab="editor">
      <EditorBody />
    </UiBuilderLayout>
  );
}

function EditorBody() {
  const dispatch = useDispatch();
  const { pageId: routePageId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const state = useSelector((s) => s.uiBuilder);
  const { pages, pagesStatus, selectedPageId, tree, saveState, saveError, device, zoom, undoStack, redoStack, validation, businessContext, theme } = state;
  const initializedRouteRef = useRef(null);

  const page = pages.find((p) => p.id === selectedPageId);
  const [libraryQuery, setLibraryQuery] = useState('');
  const [leftTab, setLeftTab] = useState('COMPONENTS');
  const [inspectorTab, setInspectorTab] = useState('CONTENT');
  const [mobilePanel, setMobilePanel] = useState(null); // 'library' | 'inspector' | null

  const undoPossible = undoStack.length > 0;
  const redoPossible = redoStack.length > 0;
  const errors = validation?.issues?.filter((i) => i.level === 'ERROR') || [];
  const warnings = validation?.issues?.filter((i) => i.level === 'WARNING') || [];

  const resolveBinding = useMemo(
    () => createBindingResolver({
      businessContext,
      tenantName: page?.metadata?.tenantName,
      userName: page?.metadata?.userName,
      applicationName: page?.metadata?.applicationName,
    }),
    [businessContext, page?.metadata],
  );

  // Initialize a direct URL once the tenant-scoped page list arrives. A valid
  // deep link wins initially; the generic /ui/builder/editor entry falls back
  // to the first page. Subsequent picker changes must remain user-controlled.
  useEffect(() => {
    if (pagesStatus !== 'LOADED' || pages.length === 0) return;
    const pageSet = pages.map((page) => page.id).join('|');
    const initializationKey = `${routePageId || ''}:${pageSet}`;
    if (initializedRouteRef.current === initializationKey) return;
    initializedRouteRef.current = initializationKey;

    const nextPageId = resolveEditorPage({ routePageId, pages, selectedPageId })?.id;
    if (nextPageId && selectedPageId !== nextPageId) dispatch(selectPage(nextPageId));
    if (nextPageId && routePageId !== nextPageId) {
      navigate(ROUTES.uiBuilder.replace(':pageId', nextPageId), { replace: true });
    }
  }, [dispatch, navigate, pages, pagesStatus, routePageId, selectedPageId]);

  useEffect(() => {
    const componentId = searchParams.get('component');
    if (page?.id === routePageId && componentId && tree.nodes[componentId]) dispatch(selectComponent(componentId));
  }, [dispatch, searchParams, page?.id, routePageId, tree.nodes]);

  // Debounced autosave keeps the server as the source of truth without sending
  // a request for each keystroke. Manual Save remains available for retries.
  const autosaveTimer = useRef(null);
  useEffect(() => {
    if (saveState !== 'DIRTY' || !selectedPageId || state.pendingSave || state.saveConflict) return undefined;
    autosaveTimer.current = window.setTimeout(() => {
      dispatch(saveCurrentPage());
    }, 750);
    return () => window.clearTimeout(autosaveTimer.current);
  }, [dispatch, saveState, selectedPageId, tree, state.pendingSave, state.saveConflict]);

  if (pagesStatus === 'LOADING' || pagesStatus === 'IDLE') {
    return <BmLoading label="Chargement des pages…" />;
  }
  if (pagesStatus === 'ERROR') {
    return <BmErrorState message="Les pages de cette version sont indisponibles." />;
  }
  if (!page && pages.length === 0) {
    return (
      <BmEmptyState
        title="Aucune page"
        description="Créez votre première page avant de commencer la conception visuelle."
        action={<Link to={ROUTES.uiPages} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">Créer une page</Link>}
      />
    );
  }
  if (!page) return <BmLoading label="Ouverture de la page…" />;

  const handleSelectPage = (pageId) => {
    dispatch(selectPage(pageId));
    navigate(ROUTES.uiBuilder.replace(':pageId', pageId));
    setMobilePanel(null);
  };

  const handleSave = async () => {
    try {
      await dispatch(saveCurrentPage()).unwrap();
    } catch (error) {
      /* saveError exposé dans la barre de statut */
    }
  };

  const handleValidate = () => {
    if (state.applicationVersionId) dispatch(fetchValidation(state.applicationVersionId));
  };

  return (
    <div className="uib-editor flex flex-col gap-3" data-testid="ui-visual-editor">
      {/* ------- Toolbar ------- */}
      <div className="uib-editor-toolbar flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
        <select
          aria-label="Page en cours d'édition"
          value={selectedPageId || ''}
          onChange={(event) => handleSelectPage(event.target.value)}
          className="max-w-[220px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
        >
          {pages.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.route}</option>)}
        </select>

        <div className="flex items-center gap-1 lg:hidden" role="group" aria-label="Panneaux de l’éditeur">
          <BmIconButton label="Composants" onClick={() => { setLeftTab('COMPONENTS'); setMobilePanel((panel) => panel === 'library' ? null : 'library'); }}>
            <Plus className="h-4 w-4" />
          </BmIconButton>
          <BmIconButton label="Propriétés" onClick={() => setMobilePanel((panel) => panel === 'inspector' ? null : 'inspector')}>
            <Info className="h-4 w-4" />
          </BmIconButton>
        </div>

        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />

        {/* Device switcher (Responsive §25) */}
        <div role="group" aria-label="Aperçu responsive" className="flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5">
          {DEVICE_KINDS.map((kind) => {
            const Icon = kind === 'DESKTOP' ? Monitor : kind === 'TABLET' ? Tablet : Smartphone;
            return (
              <button
                key={kind}
                onClick={() => dispatch(setDevice(kind))}
                aria-pressed={device === kind}
                title={kind}
                className={`rounded-md p-1.5 transition-colors duration-150 ${device === kind ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <BmIconButton label="Annuler (Ctrl+Z)" disabled={!undoPossible} onClick={() => dispatch(undo())}><Undo2 className="h-4 w-4" /></BmIconButton>
          <BmIconButton label="Rétablir (Ctrl+Y)" disabled={!redoPossible} onClick={() => dispatch(redo())}><Redo2 className="h-4 w-4" /></BmIconButton>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1" role="group" aria-label="Zoom">
          <button onClick={() => dispatch(setZoom(zoom - 0.1))} className="rounded px-1.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100" aria-label="Réduire le zoom">−</button>
          <span className="w-10 text-center text-xs font-semibold text-slate-600">{Math.round(zoom * 100)}%</span>
          <button onClick={() => dispatch(setZoom(zoom + 0.1))} className="rounded px-1.5 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100" aria-label="Augmenter le zoom">+</button>
        </div>

        <span className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />

        <BmButton variant="secondary" size="sm" icon={<ShieldCheck className="h-3.5 w-3.5" />} onClick={handleValidate}>
          Valider
        </BmButton>
        <Link to={ROUTES.uiPreview} className="bm-focus inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-700"><Eye className="h-4 w-4" />Aperçu</Link>
        <SaveButton saveState={state.saveConflict ? 'CONFLICT' : saveState} onClick={handleSave} />
      </div>

      {state.saveConflict && <section role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <h2 className="font-semibold">Conflit de sauvegarde</h2>
        <p>Votre travail local est conservé. Comparez les versions avant de recharger.</p>
        <p className="mt-2 text-xs">Révision locale : {page.updatedAt || '—'} · Révision serveur : {state.saveConflict.serverPage?.updatedAt || 'indisponible'}</p>
        <details className="my-3"><summary className="cursor-pointer font-medium">Comparer les définitions</summary><div className="grid gap-3 md:grid-cols-2"><pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(tree, null, 2)}</pre><pre className="max-h-64 overflow-auto text-xs">{JSON.stringify(state.saveConflict.serverPage?.components || null, null, 2)}</pre></div></details>
        <BmButton variant="secondary" disabled={!state.saveConflict.serverPage} onClick={() => { if (window.confirm('Remplacer les modifications locales par la version serveur ?')) dispatch(reloadConflictingPage()); }}>Recharger la version serveur</BmButton>
      </section>}
      {/* ------- 3 panneaux ------- */}
      <div className="uib-editor-grid grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* LEFT : Component Library */}
        <aside className={`uib-editor-panel rounded-xl border border-slate-200 bg-white shadow-2xs ${mobilePanel === 'library' ? '' : 'hidden lg:block'}`} aria-label="Bibliothèque de composants">
          <nav role="tablist" aria-label="Navigation du panneau éditeur" className="flex border-b border-slate-100 p-1">
            {[
              { id: 'PAGES', label: 'Pages' },
              { id: 'COMPONENTS', label: 'Composants' },
              { id: 'LAYERS', label: 'Calques' },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={leftTab === tab.id}
                onClick={() => setLeftTab(tab.id)}
                className={`flex-1 rounded-md px-2 py-2 text-[10px] font-bold transition-colors ${leftTab === tab.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          {leftTab === 'PAGES' && (
            <PageList pages={pages} selectedPageId={selectedPageId} onSelect={handleSelectPage} />
          )}
          {leftTab === 'COMPONENTS' && (
            <>
              <div className="border-b border-slate-100 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    value={libraryQuery}
                    onChange={(event) => setLibraryQuery(event.target.value)}
                    placeholder="Rechercher un composant…"
                    aria-label="Rechercher un composant"
                    className="w-full rounded-lg border border-slate-200 py-2 pl-8 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
                  />
                </div>
              </div>
              <ComponentLibrary query={libraryQuery} onAdd={(type) => dispatch(addComponent({ type }))} />
            </>
          )}
          {leftTab === 'LAYERS' && (
            <LayerTree
              tree={tree}
              selectedComponentId={state.selectedComponentId}
              onSelect={(nodeId) => { dispatch(selectComponent(nodeId)); setMobilePanel(null); }}
            />
          )}
        </aside>

        {/* CENTER : Canvas */}
        <section className="uib-canvas min-w-0 rounded-xl border border-slate-200 shadow-2xs" aria-label="Canvas" style={{ padding: '1.25rem' }}>
          <div className="mx-auto transition-[width] duration-200" style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%', transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{page.route} · {device}</span>
              <span className="text-[10px] text-slate-400">{page.layout}</span>
            </div>
            <div className="uib-canvas-frame rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <UiRenderer tree={tree} resolveBinding={resolveBinding} businessContext={businessContext} theme={theme} mode="preview" device={device} decorateNode={(node, content) => {
                const parentId = Object.keys(tree.nodes).find((id) => tree.nodes[id].children?.includes(node.id)) || null;
                const index = parentId ? tree.nodes[parentId].children.indexOf(node.id) : null;
                return <CanvasNode nodeId={node.id} parentId={parentId} index={index} content={content} />;
              }} />
            </div>
          </div>
        </section>

        {/* RIGHT : Inspector */}
        <aside className={`uib-editor-panel rounded-xl border border-slate-200 bg-white shadow-2xs ${mobilePanel === 'inspector' ? '' : 'hidden lg:block'}`} aria-label="Inspecteur du composant sélectionné">
          {tree.nodes[state.selectedComponentId]
            ? <Inspector node={tree.nodes[state.selectedComponentId]} tab={inspectorTab} onTab={setInspectorTab} />
            : <EmptyInspector />}
        </aside>
      </div>

      {/* ------- Status bar ------- */}
      <footer className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-2xs" role="status">
        <SaveStateBadge saveState={saveState} error={saveError} />
        <span className="h-4 w-px bg-slate-200" />
        {validation ? (
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1 font-semibold text-rose-600"><XCircle className="h-3.5 w-3.5" />{errors.length} erreur(s)</span>
            <span className="flex items-center gap-1 font-semibold text-amber-600"><TriangleAlert className="h-3.5 w-3.5" />{warnings.length} alerte(s)</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 text-slate-400"><Info className="h-3.5 w-3.5" />Validation non exécutée</span>
        )}
        <span className="ml-auto text-slate-400">{Object.keys(tree.nodes).length} composant(s) · sélection : {tree.nodes[state.selectedComponentId]?.type || '—'}</span>
      </footer>
    </div>
  );

  /* ----- Canvas récursif : rendu + overlays d'édition ----- */
  function CanvasNode({ nodeId, parentId = null, index = null, content }) {
    const node = tree.nodes[nodeId];
    if (!node) return null;
    const isSelected = state.selectedComponentId === nodeId;
    const def = getComponentDefinition(node.type);
    const childNodes = (node.children || []).map((id) => tree.nodes[id]).filter(Boolean);
    const siblings = parentId ? tree.nodes[parentId]?.children || [] : [];
    const siblingIndex = siblings.indexOf(nodeId);
    const isContainer = canAcceptChildren(node.type);
    const isHidden = node.responsive?.[device]?.visible === 'hidden';

    return (
      <div
        role="button"
        tabIndex={0}
        draggable={nodeId !== tree.root}
        aria-selected={isSelected}
        aria-label={`Composant ${node.type}`}
        onClick={(event) => { event.stopPropagation(); dispatch(selectComponent(nodeId)); }}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); dispatch(selectComponent(nodeId)); } }}
        onDragStart={(event) => {
          if (nodeId === tree.root) { event.preventDefault(); return; }
          event.dataTransfer.setData('text/ui-component-id', nodeId);
          event.dataTransfer.effectAllowed = 'move';
        }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleCanvasDrop({ nodeId, parentId, index })}
        className={`relative rounded-lg transition-[box-shadow,outline] duration-150 ${isSelected ? 'outline outline-2 outline-indigo-500 outline-offset-2' : 'outline outline-1 outline-dashed outline-transparent hover:outline-slate-300'} ${isHidden ? 'opacity-40' : ''}`}
      >
        {isSelected && (
          <span className="absolute -top-2 left-2 z-10 rounded bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
            {node.type}{isHidden ? ' · Masqué' : ''}
          </span>
        )}
        {isSelected && nodeId !== tree.root && (
          <span className="absolute -top-2.5 right-1 z-10 flex gap-0.5">
            <CanvasAction label="Déplacer vers le haut" disabled={siblingIndex <= 0} onClick={() => dispatch(moveComponent({ nodeId, newParentId: parentId, index: siblingIndex - 1 }))}><ArrowUp className="h-3 w-3" /></CanvasAction>
            <CanvasAction label="Déplacer vers le bas" disabled={siblingIndex < 0 || siblingIndex >= siblings.length - 1} onClick={() => dispatch(moveComponent({ nodeId, newParentId: parentId, index: siblingIndex + 2 }))}><ArrowDown className="h-3 w-3" /></CanvasAction>
            <CanvasAction label="Dupliquer" onClick={() => dispatch(duplicateComponent(nodeId))}><Copy className="h-3 w-3" /></CanvasAction>
            <CanvasAction label="Supprimer" disabled={nodeId === tree.root} onClick={() => dispatch(deleteComponent(nodeId))}><Trash2 className="h-3 w-3" /></CanvasAction>
          </span>
        )}
        <div onDragOver={(event) => event.preventDefault()} onDrop={handleCanvasDrop({ nodeId, parentId, index })}>
          {childNodes.length === 0 && isContainer ? (
            <EmptyDropZone parentId={nodeId} />
          ) : (
            content
          )}
        </div>
      </div>
    );
  }

  function EmptyDropZone({ parentId }) {
    return (
      <div
        onDragOver={(event) => { event.preventDefault(); event.currentTarget.dataset.over = 'true'; event.currentTarget.classList.add('border-blue-400', 'bg-blue-50/40'); }}
        onDragLeave={(event) => { event.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/40'); }}
        onDrop={handleCanvasDrop({ nodeId: parentId })}
        className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 text-center transition-colors duration-150 hover:border-slate-300"
        onClick={(event) => { event.stopPropagation(); dispatch(selectComponent(parentId)); }}
      >
        <Plus className="h-4 w-4 text-slate-300" />
        <p className="px-2 text-[10px] text-slate-400">Glissez un composant ici</p>
      </div>
    );
  }

  function handleCanvasDrop(target) {
    return (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.classList?.remove('border-blue-400', 'bg-blue-50/40');
      const type = event.dataTransfer.getData('text/ui-component');
      const sourceId = event.dataTransfer.getData('text/ui-component-id');
      const targetNode = tree.nodes[target.nodeId];
      if (sourceId) {
        const sourceNode = tree.nodes[sourceId];
        if (!sourceNode || sourceId === target.nodeId) return;
        if (targetNode && canContainComponent(targetNode.type, sourceNode.type)) {
          dispatch(moveComponent({ nodeId: sourceId, newParentId: target.nodeId }));
        } else if (target.parentId && typeof target.index === 'number') {
          dispatch(moveComponent({ nodeId: sourceId, newParentId: target.parentId, index: target.index }));
        }
        return;
      }
      if (!type) return;
      if (targetNode && canContainComponent(targetNode.type, type)) {
        dispatch(addComponent({ type, parentId: target.nodeId }));
      } else if (target.parentId && typeof target.index === 'number') {
        dispatch(addComponent({ type, parentId: target.parentId, index: target.index }));
      } else if (canContainComponent(tree.nodes[tree.root]?.type, type)) {
        dispatch(addComponent({ type, parentId: tree.root }));
      }
    };
  }
}

/* ============================================================
   Component Library (gauche)
   ============================================================ */

function ComponentLibrary({ query, onAdd }) {
  const [openCategories, setOpenCategories] = useState(() => new Set(['LAYOUT']));
  const groups = useMemo(() => {
    const all = componentsByCategory();
    const q = query.trim().toLocaleLowerCase();
    if (!q) return all;
    return all
      .map((group) => ({ ...group, items: group.items.filter((c) => `${c.label} ${c.key}`.toLocaleLowerCase().includes(q)) }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <div className="max-h-[520px] overflow-y-auto p-2 [scrollbar-width:thin]">
      {groups.length === 0 && <p className="p-3 text-center text-xs text-slate-400">Aucun composant trouvé.</p>}
      {groups.map((group) => {
        const isOpen = openCategories.has(group.category) || Boolean(query.trim());
        return (
          <div key={group.category} className="mb-1">
            <button
              onClick={() => setOpenCategories((prev) => { const next = new Set(prev); if (next.has(group.category)) next.delete(group.category); else next.add(group.category); return next; })}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-50"
            >
              {group.label}
              <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
            {isOpen && (
              <ul className="mt-0.5 space-y-0.5">
                {group.items.map((component) => (
                  <li
                    key={component.key}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('text/ui-component', component.key);
                      event.dataTransfer.effectAllowed = 'copy';
                    }}
                    className="group flex cursor-grab items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 transition-colors duration-150 hover:border-slate-200 hover:bg-slate-50 active:cursor-grabbing"
                    title={component.description}
                  >
                    <GripVertical className="h-3 w-3 shrink-0 text-slate-300" />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">{component.label}</span>
                    <button
                      onClick={() => onAdd(component.key)}
                      aria-label={`Ajouter ${component.label} à la sélection`}
                      className="rounded p-1 text-slate-300 opacity-0 transition-opacity duration-150 hover:bg-blue-50 hover:text-blue-600 group-hover:opacity-100"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PageList({ pages, selectedPageId, onSelect }) {
  if (pages.length === 0) {
    return <p className="p-4 text-center text-xs text-slate-400">Aucune page dans cette version.</p>;
  }
  return (
    <ul aria-label="Pages de l’application" className="max-h-[520px] space-y-1 overflow-y-auto p-2 [scrollbar-width:thin]">
      {[...pages].sort((a, b) => a.order - b.order).map((page) => (
        <li key={page.id}>
          <button
            type="button"
            aria-current={selectedPageId === page.id ? 'page' : undefined}
            onClick={() => onSelect(page.id)}
            className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${selectedPageId === page.id ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'}`}
          >
            <span className="block truncate text-xs font-semibold">{page.title}</span>
            <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-400">{page.route}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function LayerTree({ tree, selectedComponentId, onSelect }) {
  const rootNode = tree.nodes[tree.root];
  if (!rootNode) return <p className="p-4 text-center text-xs text-slate-400">Aucun composant sur cette page.</p>;
  return (
    <ul role="tree" aria-label="Arborescence des composants" className="max-h-[520px] overflow-y-auto p-2 [scrollbar-width:thin]">
      <LayerTreeNode node={rootNode} tree={tree} selectedComponentId={selectedComponentId} onSelect={onSelect} depth={0} />
    </ul>
  );
}

function LayerTreeNode({ node, tree, selectedComponentId, onSelect, depth }) {
  const definition = getComponentDefinition(node.type);
  const children = (node.children || []).map((id) => tree.nodes[id]).filter(Boolean);
  return (
    <li role="treeitem" aria-label={definition?.label || node.type} aria-selected={selectedComponentId === node.id}>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`w-full truncate rounded-md py-1.5 pr-2 text-left text-xs transition-colors ${selectedComponentId === node.id ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {definition?.label || node.type}
      </button>
      {children.length > 0 && (
        <ul role="group">
          {children.map((child) => (
            <LayerTreeNode
              key={child.id}
              node={child}
              tree={tree}
              selectedComponentId={selectedComponentId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ============================================================
   Inspector (droite) — généré depuis propertiesSchema
   ============================================================ */

function EmptyInspector() {
  return (
    <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-sm font-semibold text-slate-500">Aucun composant sélectionné</p>
      <p className="text-xs text-slate-400">Cliquez sur un composant du canvas pour éditer ses propriétés, bindings et actions.</p>
    </div>
  );
}

const INSPECTOR_TABS = ['CONTENT', 'DATA', 'ACTIONS', 'VISIBILITY', 'RESPONSIVE', 'ADVANCED'];

function Inspector({ node, tab, onTab }) {
  const dispatch = useDispatch();
  const { businessContext, tree } = useSelector((s) => s.uiBuilder);
  const def = getComponentDefinition(node.type);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-4 py-3">
        <p className="text-sm font-bold text-slate-900">{def?.label || node.type}</p>
        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">{node.id}</p>
      </div>
      <div role="tablist" aria-label="Onglets Inspector" className="flex flex-wrap gap-0.5 border-b border-slate-100 px-2">
        {INSPECTOR_TABS.map((tabId) => (
          <button
            key={tabId}
            role="tab"
            aria-selected={tab === tabId}
            onClick={() => onTab(tabId)}
            className={`rounded-t-lg px-2.5 py-2 text-[10px] font-bold transition-colors duration-150 ${tab === tabId ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {({ CONTENT: 'Propriétés', DATA: 'Données', ACTIONS: 'Actions', VISIBILITY: 'Visibilité', RESPONSIVE: 'Responsive', ADVANCED: 'Avancé' })[tabId]}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
        {tab === 'CONTENT' && <ContentTab node={node} def={def} onChange={(props) => dispatch(updateComponentProps({ nodeId: node.id, props }))} />}
        {tab === 'DATA' && <DataTab node={node} def={def} businessContext={businessContext} onChange={(prop, binding) => dispatch(updateComponentBinding({ nodeId: node.id, prop, binding }))} />}
        {tab === 'ACTIONS' && <ActionsTab node={node} def={def} onChange={(actions) => dispatch(updateComponentActions({ nodeId: node.id, actions }))} />}
        {tab === 'VISIBILITY' && <ResponsiveTab node={node} onChange={(device, patch) => dispatch(updateComponentResponsive({ nodeId: node.id, device, patch }))} />}
        {tab === 'ADVANCED' && <div className="space-y-3"><p className="text-xs text-slate-600">Définition du composant en lecture seule.</p><pre className="max-h-96 overflow-auto rounded-lg bg-slate-50 p-3 text-xs">{JSON.stringify(node, null, 2)}</pre></div>}
        {tab === 'RESPONSIVE' && <ResponsiveTab node={node} onChange={(device, patch) => dispatch(updateComponentResponsive({ nodeId: node.id, device, patch }))} />}
      </div>
      {node.id !== tree.root && (
        <div className="flex gap-2 border-t border-slate-100 p-3">
          <BmButton variant="secondary" size="sm" icon={<Copy className="h-3.5 w-3.5" />} onClick={() => dispatch(duplicateComponent(node.id))}>Dupliquer</BmButton>
          <BmButton variant="danger" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} onClick={() => dispatch(deleteComponent(node.id))}>Supprimer</BmButton>
        </div>
      )}
    </div>
  );
}

function ContentTab({ node, def, onChange }) {
  if (!def) return <p className="text-xs text-rose-600">Composant inconnu du registry.</p>;
  return (
    <div className="space-y-3">
      {Object.entries(def.propertiesSchema).map(([prop, schema]) => (
        <PropertyField
          key={prop}
          prop={prop}
          schema={schema}
          value={node.props?.[prop] ?? schema.defaultValue ?? ''}
          onChange={(value) => onChange({ [prop]: value })}
        />
      ))}
      {Object.keys(def.propertiesSchema).length === 0 && <p className="text-xs text-slate-400">Ce composant n'a pas de propriété de contenu.</p>}
    </div>
  );
}

function PropertyField({ prop, schema, value, onChange }) {
  const label = schema.label || prop;
  if (schema.type === 'select') {
    return (
      <BmSelect label={label} value={String(value ?? '')} onChange={(nextValue) => onChange(schema.options.find((o) => String(o.value) === nextValue)?.value ?? nextValue)} options={schema.options.map((o) => ({ value: String(o.value), label: o.label }))} />
    );
  }
  if (schema.type === 'boolean') {
    return (
      <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded border-slate-300" />
        {label}
      </label>
    );
  }
  if (schema.type === 'number') {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <input type="number" min={schema.min} max={schema.max} value={value ?? ''} onChange={(event) => onChange(event.target.value === '' ? undefined : Number(event.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
      </label>
    );
  }
  if (schema.type === 'textList') {
    const text = Array.isArray(value) ? value.join('\n') : String(value ?? '');
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
        <textarea rows={3} value={text} onChange={(event) => onChange(event.target.value.split('\n').map((s) => s.trim()).filter(Boolean))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
      </label>
    );
  }
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}{schema.required && ' *'}</span>
      <input value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
    </label>
  );
}

function DataTab({ node, def, businessContext, onChange }) {
  const bindable = def?.bindingCapabilities || [];
  if (bindable.length === 0) {
    return <p className="text-xs text-slate-400">Ce composant ne supporte aucun binding de données.</p>;
  }
  const entities = businessContext?.entities || [];
  return (
    <div className="space-y-4">
      {bindable.map((prop) => {
        const binding = node.bindings?.[prop];
        return (
          <div key={prop} className="rounded-lg border border-slate-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Propriété « {prop} »</span>
              {binding && (
                <button onClick={() => onChange(prop, null)} className="text-[10px] font-semibold text-rose-500 hover:text-rose-600">Retirer</button>
              )}
            </div>
            <BmSelect
              value={binding?.kind || ''}
              onChange={(kind) => {
                if (!kind) { onChange(prop, null); return; }
                onChange(prop, kind === 'ENTITY_FIELD' || kind === 'ENTITY_LIST' ? { kind, entity: entities[0]?.code || '', field: '' } : kind === 'CONTEXT' ? { kind, context: 'currentTenant' } : { kind, value: '' });
              }}
              options={[{ value: '', label: '— Aucun binding —' }, ...BINDING_KINDS.map((k) => ({ value: k, label: k }))]}
            />
            {binding && (binding.kind === 'ENTITY_FIELD' || binding.kind === 'ENTITY_LIST') && (
              <div className="mt-2 grid gap-2">
                <BmSelect
                  label="Entité (Business Manager)"
                  value={binding.entity || ''}
                  onChange={(entity) => onChange(prop, { ...binding, entity, field: '' })}
                  options={entities.map((entity) => ({ value: entity.code, label: `${entity.name} (${entity.code})` }))}
                />
                {binding.kind === 'ENTITY_FIELD' && (
                  <BmSelect
                    label="Champ"
                    value={binding.field || ''}
                    onChange={(field) => onChange(prop, { ...binding, field })}
                    options={[{ value: '', label: '— Choisir —' }, ...(entities.find((entity) => entity.code === binding.entity)?.fields || []).map((field) => ({ value: field.code, label: `${field.label} (${field.type})` }))]}
                  />
                )}
              </div>
            )}
            {binding && binding.kind === 'CONTEXT' && (
              <div className="mt-2">
                <BmSelect
                  label="Contexte"
                  value={binding.context || 'currentTenant'}
                  onChange={(context) => onChange(prop, { ...binding, context })}
                  options={CONTEXT_KEYS.map((key) => ({ value: key, label: key }))}
                />
              </div>
            )}
            {binding && binding.kind === 'STATIC' && (
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Valeur</span>
                <input value={binding.value ?? ''} onChange={(event) => onChange(prop, { ...binding, value: event.target.value })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </label>
            )}
            {binding && binding.kind === 'VARIABLE' && (
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Nom de variable</span>
                <input value={binding.variable ?? ''} onChange={(event) => onChange(prop, { ...binding, variable: event.target.value.toLocaleLowerCase().replace(/[^a-z0-9-]/g, '-') })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </label>
            )}
          </div>
        );
      })}
      {entities.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] text-amber-700">
          Aucune entité Business Manager pour cette version. Créez vos modèles dans BM → Modèles de données.
        </p>
      )}
    </div>
  );
}

function ActionsTab({ node, def, onChange }) {
  const allowed = def?.supportedActions || [];
  const actions = node.actions || [];
  if (allowed.length === 0) {
    return <p className="text-xs text-slate-400">Ce composant ne supporte aucune action.</p>;
  }
  const update = (index, patch) => onChange(actions.map((action, i) => (i === index ? { ...action, ...patch } : action)));

  return (
    <div className="space-y-3">
      {actions.map((action, index) => (
        <div key={index} className="rounded-lg border border-slate-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <BmSelect
              value={action.type}
              onChange={(type) => update(index, { type, config: {} })}
              options={allowed.map((type) => ({ value: type, label: type }))}
            />
            <button onClick={() => onChange(actions.filter((_, i) => i !== index))} className="ml-2 text-rose-500 hover:text-rose-600" aria-label="Supprimer l'action"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          {action.type === 'NAVIGATE' && (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Route interne</span>
              <input value={action.config?.route || ''} onChange={(event) => update(index, { config: { ...action.config, route: event.target.value } })} placeholder="/customers" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </label>
          )}
          {action.type === 'TRIGGER_AUTOMATION' && (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Code du workflow (Automation)</span>
              <input value={action.config?.workflowCode || ''} onChange={(event) => update(index, { config: { ...action.config, workflowCode: event.target.value } })} placeholder="ex. onboarding-notify" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </label>
          )}
          {['CREATE_RECORD', 'UPDATE_RECORD', 'DELETE_RECORD'].includes(action.type) && (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Resource Data Runtime</span>
              <input value={action.config?.resource || ''} onChange={(event) => update(index, { config: { ...action.config, resource: event.target.value } })} placeholder="ex. customers" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </label>
          )}
          {action.type === 'SHOW_NOTIFICATION' && (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Message</span>
              <input value={action.config?.message || ''} onChange={(event) => update(index, { config: { ...action.config, message: event.target.value } })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </label>
          )}
          {action.type === 'SET_VARIABLE' && (
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Variable</span>
              <input value={action.config?.name || ''} onChange={(event) => update(index, { config: { ...action.config, name: event.target.value } })} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400" />
            </label>
          )}
          {['REFRESH_DATA', 'OPEN_MODAL', 'OPEN_DRAWER', 'CLOSE_MODAL'].includes(action.type) && (
            <p className="text-[10px] text-slate-400">Action sans configuration supplémentaire.</p>
          )}
        </div>
      ))}
      <BmButton
        variant="secondary"
        size="sm"
        icon={<Plus className="h-3.5 w-3.5" />}
        onClick={() => onChange([...actions, { type: allowed[0], config: {} }])}
        disabled={actions.length >= 20}
      >
        Ajouter une action
      </BmButton>
    </div>
  );
}

function ResponsiveTab({ node, onChange }) {
  const responsive = node.responsive || {};
  const setResponsiveProp = (device, patch) => onChange(device, patch);
  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">Propriétés structurées par device — sérialisées dans l'UI Definition.</p>
      {DEVICE_KINDS.map((device) => (
        <div key={device} className="rounded-lg border border-slate-200 p-3">
          <p className="mb-2 text-xs font-bold text-slate-700">{device}</p>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Visibilité</span>
            <BmSelect
              value={responsive[device]?.visible ?? 'default'}
              onChange={(visible) => setResponsiveProp(device, { visible })}
              options={[
                { value: 'default', label: 'Hérite du desktop' },
                { value: 'visible', label: 'Visible' },
                { value: 'hidden', label: 'Masqué' },
              ]}
            />
          </label>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Leaf preview (feuilles sans enfants éditables)
   ============================================================ */

/* ============================================================
   Save state + petits utilitaires
   ============================================================ */

function SaveButton({ saveState, onClick }) {
  const label = saveState === 'SAVING' ? 'Enregistrement…' : saveState === 'SAVED' ? 'Enregistré' : saveState === 'ERROR' ? 'Réessayer' : 'Enregistrer';
  return (
    <BmButton size="sm" onClick={onClick} disabled={saveState === 'SAVING' || saveState === 'CLEAN' || saveState === 'CONFLICT'} icon={saveState === 'SAVING' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saveState === 'SAVED' ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}>
      {label}
    </BmButton>
  );
}

function SaveStateBadge({ saveState, error }) {
  const map = {
    CLEAN: { tone: 'neutral', label: 'Aucune modification' },
    DIRTY: { tone: 'amber', label: 'Modifications non enregistrées' },
    SAVING: { tone: 'blue', label: 'Enregistrement…' },
    SAVED: { tone: 'green', label: 'Enregistré' },
    ERROR: { tone: 'rose', label: error || 'Erreur d’enregistrement' },
    CONFLICT: { tone: 'amber', label: 'Conflit de sauvegarde' },
  };
  const entry = map[saveState] || map.CLEAN;
  return <BmBadge tone={entry.tone} dot>{entry.label}</BmBadge>;
}

function CanvasAction({ label, onClick, disabled, children }) {
  return (
    <button
      onClick={(event) => { event.stopPropagation(); if (!disabled) onClick(); }}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded bg-white p-1 text-slate-500 shadow-sm transition-colors duration-150 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
