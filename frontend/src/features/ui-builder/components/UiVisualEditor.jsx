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
import {
  Monitor, Tablet, Smartphone, Undo2, Redo2, Save, ShieldCheck, Eye, Search,
  Trash2, Copy, Plus, GripVertical, ChevronRight, Loader2, Check, TriangleAlert, XCircle, Info,
} from 'lucide-react';

import {
  selectPage, selectComponent, setDevice, setZoom, addComponent, moveComponent,
  updateComponentProps, updateComponentBinding, updateComponentActions,
  deleteComponent, duplicateComponent, undo, redo, saveCurrentPage, fetchValidation,
} from '../store/uiBuilderSlice.js';
import { DEVICE_KINDS, DEVICE_WIDTHS, BINDING_KINDS, CONTEXT_KEYS, ACTION_TYPES, describeError } from '../model/uiDefinition.js';
import { componentsByCategory, getComponentDefinition } from '../registry/componentRegistry.js';
import { createBindingResolver } from '../renderer/bindingResolver.js';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { BmButton, BmIconButton, BmBadge, BmEmptyState, BmSelect } from '../../../components/business-manager/bm/ui.jsx';

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
  const state = useSelector((s) => s.uiBuilder);
  const { pages, selectedPageId, tree, saveState, saveError, device, zoom, undoStack, redoStack, validation, businessContext } = state;

  const page = pages.find((p) => p.id === selectedPageId);
  const [libraryQuery, setLibraryQuery] = useState('');
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

  if (!page) {
    return (
      <BmEmptyState
        title="Aucune page sélectionnée"
        description="Choisissez ou créez une page dans l'écran Pages pour ouvrir l'éditeur visuel."
      />
    );
  }

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
    <div className="flex flex-col gap-3" data-testid="ui-visual-editor">
      {/* ------- Toolbar ------- */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-2xs">
        <select
          aria-label="Page en cours d'édition"
          value={selectedPageId || ''}
          onChange={(event) => dispatch(selectPage(event.target.value))}
          className="max-w-[220px] rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400"
        >
          {pages.map((p) => <option key={p.id} value={p.id}>{p.title} — {p.route}</option>)}
        </select>

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
                className={`rounded-md p-1.5 transition-colors duration-150 ${device === kind ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
        <SaveButton saveState={saveState} onClick={handleSave} />
      </div>

      {/* ------- 3 panneaux ------- */}
      <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        {/* LEFT : Component Library */}
        <aside className={`rounded-xl border border-slate-200 bg-white shadow-2xs ${mobilePanel === 'library' ? '' : 'hidden lg:block'}`} aria-label="Bibliothèque de composants">
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
        </aside>

        {/* CENTER : Canvas */}
        <section className="min-w-0 rounded-xl border border-slate-200 bg-[#f1f5f9] shadow-2xs" aria-label="Canvas" style={{ padding: '1.25rem' }}>
          <div className="mx-auto transition-[width] duration-200" style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%', transform: `scale(${zoom})`, transformOrigin: 'top center' }}>
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{page.route} · {device}</span>
              <span className="text-[10px] text-slate-400">{page.layout}</span>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <CanvasNode nodeId={tree.root} />
            </div>
          </div>
        </section>

        {/* RIGHT : Inspector */}
        <aside className={`rounded-xl border border-slate-200 bg-white shadow-2xs ${mobilePanel === 'inspector' ? '' : 'hidden lg:block'}`} aria-label="Inspecteur du composant sélectionné">
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
  function CanvasNode({ nodeId }) {
    const node = tree.nodes[nodeId];
    if (!node) return null;
    const isSelected = state.selectedComponentId === nodeId;
    const def = getComponentDefinition(node.type);
    const childNodes = (node.children || []).map((id) => tree.nodes[id]).filter(Boolean);
    const isContainer = (def?.allowedChildren === '*') || (def?.allowedChildren?.length || 0) > 0 || childNodes.length > 0;

    return (
      <div
        role="button"
        tabIndex={0}
        aria-selected={isSelected}
        aria-label={`Composant ${node.type}`}
        onClick={(event) => { event.stopPropagation(); dispatch(selectComponent(nodeId)); }}
        onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.stopPropagation(); dispatch(selectComponent(nodeId)); } }}
        className={`relative rounded-lg transition-[box-shadow,outline] duration-150 ${isSelected ? 'outline outline-2 outline-blue-500 outline-offset-2' : 'outline outline-1 outline-dashed outline-transparent hover:outline-slate-300'}`}
      >
        {isSelected && (
          <span className="absolute -top-2 left-2 z-10 rounded bg-blue-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow-sm">
            {node.type}
          </span>
        )}
        {isSelected && !isContainer && (
          <span className="absolute -top-2.5 right-1 z-10 flex gap-0.5">
            <CanvasAction label="Dupliquer" onClick={() => dispatch(duplicateComponent(nodeId))}><Copy className="h-3 w-3" /></CanvasAction>
            <CanvasAction label="Supprimer" disabled={nodeId === tree.root} onClick={() => dispatch(deleteComponent(nodeId))}><Trash2 className="h-3 w-3" /></CanvasAction>
          </span>
        )}
        <div onDragOver={(event) => isContainer && event.preventDefault()} onDrop={handleCanvasDrop(nodeId)}>
          {childNodes.length === 0 && isContainer ? (
            <EmptyDropZone parentId={nodeId} />
          ) : (
            <EditorTree node={node} childNodes={childNodes} parentId={nodeId} />
          )}
        </div>
      </div>
    );
  }

  function EditorTree({ node, childNodes, parentId }) {
    const def = getComponentDefinition(node.type);
    // Les types feuilles rendent via UiRenderer-like simple : on réutilise
    // le rendu Shared Renderer pour les feuilles sans enfants éditables.
    if (childNodes.length === 0 && !def?.allowedChildren?.length && def?.allowedChildren !== '*') {
      return <LeafPreview node={node} resolveBinding={resolveBinding} />;
    }
    return (
      <div className="flex flex-col" style={{ gap: '0.75rem' }}>
        {childNodes.map((child) => <CanvasNode key={child.id} nodeId={child.id} />)}
      </div>
    );
  }

  function EmptyDropZone({ parentId }) {
    return (
      <div
        onDragOver={(event) => { event.preventDefault(); event.currentTarget.dataset.over = 'true'; event.currentTarget.classList.add('border-blue-400', 'bg-blue-50/40'); }}
        onDragLeave={(event) => { event.currentTarget.classList.remove('border-blue-400', 'bg-blue-50/40'); }}
        onDrop={(event) => { handleCanvasDrop(parentId)(event); }}
        className="flex min-h-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50/50 text-center transition-colors duration-150 hover:border-slate-300"
        onClick={(event) => { event.stopPropagation(); dispatch(selectComponent(parentId)); }}
      >
        <Plus className="h-4 w-4 text-slate-300" />
        <p className="px-2 text-[10px] text-slate-400">Glissez un composant ici</p>
      </div>
    );
  }

  function handleCanvasDrop(parentId) {
    return (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.classList?.remove('border-blue-400', 'bg-blue-50/40');
      const type = event.dataTransfer.getData('text/ui-component');
      const sourceId = event.dataTransfer.getData('text/ui-component-id');
      if (type) dispatch(addComponent({ type, parentId }));
      else if (sourceId) dispatch(moveComponent({ nodeId: sourceId, newParentId: parentId }));
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

const INSPECTOR_TABS = ['CONTENT', 'DATA', 'ACTIONS', 'RESPONSIVE'];

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
      <div role="tablist" aria-label="Onglets Inspector" className="flex gap-0.5 border-b border-slate-100 px-2">
        {INSPECTOR_TABS.map((tabId) => (
          <button
            key={tabId}
            role="tab"
            aria-selected={tab === tabId}
            onClick={() => onTab(tabId)}
            className={`rounded-t-lg px-2.5 py-2 text-[10px] font-bold transition-colors duration-150 ${tab === tabId ? 'border-b-2 border-violet-500 text-violet-700' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {tabId === 'CONTENT' ? 'Contenu' : tabId === 'DATA' ? 'Data' : tabId === 'ACTIONS' ? 'Actions' : 'Responsive'}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
        {tab === 'CONTENT' && <ContentTab node={node} def={def} onChange={(props) => dispatch(updateComponentProps({ nodeId: node.id, props }))} />}
        {tab === 'DATA' && <DataTab node={node} def={def} businessContext={businessContext} onChange={(prop, binding) => dispatch(updateComponentBinding({ nodeId: node.id, prop, binding }))} />}
        {tab === 'ACTIONS' && <ActionsTab node={node} def={def} onChange={(actions) => dispatch(updateComponentActions({ nodeId: node.id, actions }))} />}
        {tab === 'RESPONSIVE' && <ResponsiveTab node={node} onChange={(props) => dispatch(updateComponentProps({ nodeId: node.id, props }))} />}
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
      <BmSelect label={label} value={String(value ?? '')} onChange={(event) => onChange(schema.options.find((o) => String(o.value) === event.target.value)?.value ?? event.target.value)} options={schema.options.map((o) => ({ value: String(o.value), label: o.label }))} />
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
              onChange={(event) => {
                const kind = event.target.value;
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
                  onChange={(event) => onChange(prop, { ...binding, entity: event.target.value, field: '' })}
                  options={entities.map((entity) => ({ value: entity.code, label: `${entity.name} (${entity.code})` }))}
                />
                {binding.kind === 'ENTITY_FIELD' && (
                  <BmSelect
                    label="Champ"
                    value={binding.field || ''}
                    onChange={(event) => onChange(prop, { ...binding, field: event.target.value })}
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
                  onChange={(event) => onChange(prop, { ...binding, context: event.target.value })}
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
              onChange={(event) => update(index, { type: event.target.value, config: {} })}
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
          {action.type === 'CALL_API' && (
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
          {['REFRESH', 'OPEN_MODAL', 'CLOSE_MODAL'].includes(action.type) && (
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
  const setResponsiveProp = (device, patch) => onChange({ [`${device}`]: { ...(responsive[device] || {}), ...patch } });
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
              onChange={(event) => setResponsiveProp(device, { visible: event.target.value })}
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

function LeafPreview({ node, resolveBinding }) {
  const props = node.props || {};
  switch (node.type) {
    case 'Heading':
      return <p className={`font-semibold text-slate-900 ${Number(props.level) === 1 ? 'text-xl' : 'text-base'}`}>{String(resolveBinding(node, 'text', props.text) ?? '')}</p>;
    case 'Text':
      return <p className={`text-sm ${props.tone === 'muted' ? 'text-slate-500' : props.tone === 'strong' ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{String(resolveBinding(node, 'text', props.text) ?? '')}</p>;
    case 'Button':
      return (
        <span className={`inline-flex w-fit cursor-pointer items-center rounded-lg px-4 py-2 text-xs font-semibold ${props.variant === 'secondary' ? 'border border-slate-200 bg-white text-slate-700' : props.variant === 'ghost' ? 'text-slate-600' : props.variant === 'danger' ? 'border border-rose-200 bg-white text-rose-600' : 'bg-blue-600 text-white'}`}>
          {props.label || 'Bouton'}
          {(node.actions || []).length > 0 && <span className="ml-1.5 rounded bg-black/10 px-1 text-[9px] font-bold">{node.actions[0].type}</span>}
        </span>
      );
    case 'Badge':
      return <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700">{String(resolveBinding(node, 'text', props.text) ?? '')}</span>;
    case 'Input':
    case 'FormField':
      return (
        <label className="flex w-full flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">{props.label || 'Champ'}</span>
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">{props.placeholder || '—'}</span>
        </label>
      );
    case 'Alert':
      return <div className={`rounded-lg border px-3 py-2 text-xs ${props.tone === 'danger' ? 'border-rose-200 bg-rose-50 text-rose-700' : props.tone === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-700' : props.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>{String(resolveBinding(node, 'message', props.message) ?? '')}</div>;
    case 'DataTable':
      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-xs font-semibold text-slate-500">{props.title || 'Table de données'}{node.bindings?.rows && <span className="ml-2 font-mono text-[10px] text-blue-600">⌗ {node.bindings.rows.entity}</span>}</div>
          <div className="flex min-h-[64px] items-center justify-center text-xs text-slate-300">{props.emptyMessage || 'Aucun enregistrement'}</div>
        </div>
      );
    case 'Image':
      return <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">{props.alt || 'Image'}</div>;
    case 'Link':
      return <span className="text-sm font-medium text-blue-600 underline decoration-dotted">{String(resolveBinding(node, 'text', props.text) ?? '')}</span>;
    case 'Checkbox':
      return <span className="flex items-center gap-2 text-sm text-slate-700"><span className="h-4 w-4 rounded border border-slate-300" />{props.label}</span>;
    case 'DatePicker':
      return (
        <label className="flex w-full flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">{props.label || 'Date'}</span>
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">jj/mm/aaaa</span>
        </label>
      );
    case 'Spinner':
      return <span className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-blue-500" />{props.label || 'Chargement…'}</span>;
    case 'Select':
    case 'Textarea':
      return (
        <label className="flex w-full flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">{props.label || 'Champ'}</span>
          <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">{props.placeholder || '—'}</span>
        </label>
      );
    case 'FormField': // bindings affichés
    default:
      return (
        <div className="rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2">
          <p className="text-xs font-medium text-slate-600">{props.label || node.type}</p>
          {(node.bindings && Object.keys(node.bindings).length > 0) && (
            <p className="mt-0.5 font-mono text-[10px] text-blue-600">
              {Object.entries(node.bindings).map(([prop, binding]) => `⌗ ${prop}:${binding.entity ? `${binding.entity}.${binding.field || '*'}` : binding.context || binding.kind}`).join(' · ')}
            </p>
          )}
        </div>
      );
  }
}

/* ============================================================
   Save state + petits utilitaires
   ============================================================ */

function SaveButton({ saveState, onClick }) {
  const label = saveState === 'SAVING' ? 'Enregistrement…' : saveState === 'SAVED' ? 'Enregistré' : saveState === 'ERROR' ? 'Réessayer' : 'Enregistrer';
  return (
    <BmButton size="sm" onClick={onClick} disabled={saveState === 'SAVING' || saveState === 'CLEAN'} icon={saveState === 'SAVING' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saveState === 'SAVED' ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}>
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
