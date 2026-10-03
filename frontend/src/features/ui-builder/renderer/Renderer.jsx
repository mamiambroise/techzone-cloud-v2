/**
 * UI Builder — Shared Renderer (UI-BUILDER CDC V1 §26).
 *
 * MOTEUR UNIQUE : le builder preview ET le runtime affichent la même
 * UI Definition via ce renderer. Aucun dangerouslySetInnerHTML, aucune
 * expression libre : les bindings sont résolus via un resolver injecté.
 *
 * Resolver : ({ kind, value, entity, field, context, variable }) => données.
 * Le preview passe un resolver alimenté par le business-context BM ; le
 * runtime branchera le même renderer sur Data Runtime.
 */
import React, { useMemo } from 'react';
import {
  Box, PanelTop, Square, Grid3X3, Columns3, Heading1, Type, TextCursorInput,
  AlignLeft, ChevronDownSquare, CheckSquare, Calendar, Braces, ClipboardList,
  Table, Tag, TriangleAlert, Image as ImageIcon, Link2, PanelsTopLeft as FolderTabs, Loader2,
  MousePointerClick, Component as ComponentIcon,
} from 'lucide-react';

const ICONS = {
  Box, PanelTop, Square, Grid3X3, Columns3, Heading1, Type, TextCursorInput,
  AlignLeft, ChevronDownSquare, CheckSquare, Calendar, Braces, ClipboardList,
  Table, Tag, TriangleAlert, Image: ImageIcon, Link2, FolderTabs, Loader2,
  MousePointerClick,
};

const SPACING = {
  none: '0',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
};

const TONE_CLASSES = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
};

function pad(value) {
  return SPACING[value] ?? SPACING.md;
}

/** Rendu d'un composant selon son type (registry-driven). */
function renderNode(node, ctx) {
  const props = node.props || {};
  const childNodes = (node.children || []).map((childId) => ctx.nodes[childId]).filter(Boolean);

  switch (node.type) {
    case 'Container':
      return (
        <div
          className="flex flex-col"
          style={{ padding: pad(props.padding), gap: pad(props.gap), alignItems: props.align === 'center' ? 'center' : props.align === 'end' ? 'flex-end' : 'flex-start' }}
        >
          {childNodes.map((child) => <RendererNode key={child.id} node={child} ctx={ctx} />)}
        </div>
      );

    case 'Section':
      return (
        <section className="rounded-xl border border-slate-200 bg-white" style={{ padding: pad(props.padding) }}>
          {props.title && <h2 className="mb-3 text-sm font-bold text-slate-900">{props.title}</h2>}
          <div className="flex flex-col" style={{ gap: pad('md') }}>
            {childNodes.map((child) => <RendererNode key={child.id} node={child} ctx={ctx} />)}
          </div>
        </section>
      );

    case 'Card':
      return (
        <section className="rounded-xl border border-slate-200 bg-white shadow-2xs" style={{ padding: pad(props.padding) }}>
          {props.title && <h3 className="text-sm font-bold text-slate-900">{props.title}</h3>}
          {props.description && <p className="mt-0.5 text-xs text-slate-500">{props.description}</p>}
          <div className="flex flex-col" style={{ gap: pad('md'), marginTop: props.title ? '0.75rem' : 0 }}>
            {childNodes.map((child) => <RendererNode key={child.id} node={child} ctx={ctx} />)}
          </div>
        </section>
      );

    case 'Grid':
      return (
        <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(Number(props.columns) || 2, 6)}, minmax(0, 1fr))`, gap: pad(props.gap) }}>
          {childNodes.map((child) => <RendererNode key={child.id} node={child} ctx={ctx} />)}
        </div>
      );

    case 'Stack':
      return (
        <div className="flex flex-row flex-wrap items-start" style={{ gap: pad(props.gap), justifyContent: props.align === 'center' ? 'center' : props.align === 'end' ? 'flex-end' : 'flex-start' }}>
          {childNodes.map((child) => <RendererNode key={child.id} node={child} ctx={ctx} />)}
        </div>
      );

    case 'Heading': {
      const text = ctx.resolveBinding(node, 'text', props.text) ?? '';
      const Level = `h${Math.min(Number(props.level) || 2, 4)}`;
      return <Level className={Number(props.level) === 1 ? 'text-xl font-bold text-slate-900' : 'text-base font-semibold text-slate-900'} style={{ textAlign: props.align === 'center' ? 'center' : props.align === 'end' ? 'right' : 'left' }}>{String(text)}</Level>;
    }

    case 'Text': {
      const text = ctx.resolveBinding(node, 'text', props.text) ?? '';
      const toneClass = props.tone === 'muted' ? 'text-slate-500' : props.tone === 'strong' ? 'text-slate-900 font-semibold' : 'text-slate-700';
      return <p className={`text-sm ${toneClass}`}>{String(text)}</p>;
    }

    case 'Input':
      return (
        <label className="flex flex-col gap-1">
          {props.label && <span className="text-xs font-medium text-slate-600">{props.label}</span>}
          <input
            type={['text', 'email', 'number', 'tel', 'url'].includes(props.inputType) ? props.inputType : 'text'}
            placeholder={props.placeholder || ''}
            required={Boolean(props.required)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
            style={{ width: '100%' }}
          />
        </label>
      );

    case 'Textarea':
      return (
        <label className="flex flex-col gap-1">
          {props.label && <span className="text-xs font-medium text-slate-600">{props.label}</span>}
          <textarea
            rows={Math.min(Number(props.rows) || 3, 12)}
            placeholder={props.placeholder || ''}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
          />
        </label>
      );

    case 'Select': {
      const options = Array.isArray(props.options) ? props.options : String(props.options || '').split('\n').map((s) => s.trim()).filter(Boolean);
      return (
        <label className="flex flex-col gap-1">
          {props.label && <span className="text-xs font-medium text-slate-600">{props.label}</span>}
          <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50">
            {props.placeholder && <option value="">{props.placeholder}</option>}
            {options.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      );
    }

    case 'Checkbox':
      return (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" defaultChecked={Boolean(props.checked)} className="h-4 w-4 rounded border-slate-300" />
          {props.label}
        </label>
      );

    case 'DatePicker':
      return (
        <label className="flex flex-col gap-1">
          {props.label && <span className="text-xs font-medium text-slate-600">{props.label}</span>}
          <input type="date" className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50" />
        </label>
      );

    case 'FormField': {
      const value = ctx.resolveBinding(node, 'value', props.label);
      const schema = ctx.fieldSchemas.get(node.id);
      return (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-600">{props.label || schema?.label || 'Champ métier'}</span>
          <input
            type={['text', 'email', 'number', 'date'].includes(props.inputType) ? props.inputType : 'text'}
            placeholder={props.placeholder || ''}
            required={Boolean(props.required ?? schema?.required)}
            disabled={Boolean(props.readonly ?? schema?.readonly)}
            defaultValue={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 disabled:bg-slate-50 disabled:text-slate-400"
          />
        </label>
      );
    }

    case 'Form':
      return (
        <form className="rounded-xl border border-slate-200 bg-white" style={{ padding: pad('md') }} onSubmit={(event) => event.preventDefault()}>
          {props.title && <h3 className="mb-3 text-sm font-bold text-slate-900">{props.title}</h3>}
          <div className="flex flex-col" style={{ gap: pad('md') }}>
            {childNodes.map((child) => <RendererNode key={child.id} node={child} ctx={ctx} />)}
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors duration-150">{props.submitLabel || 'Enregistrer'}</button>
            <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors duration-150">{props.cancelLabel || 'Annuler'}</button>
          </div>
          <FormActionsHint node={node} />
        </form>
      );

    case 'DataTable': {
      const rows = ctx.resolveBinding(node, 'rows', null);
      const columns = Array.isArray(rows) && rows.length > 0 ? Object.keys(rows[0]) : [];
      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {props.title && <div className="border-b border-slate-100 px-4 py-2.5 text-sm font-bold text-slate-900">{props.title}</div>}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  {columns.map((column) => <th key={column} className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{column}</th>)}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(rows) && rows.slice(0, Math.min(Number(props.pageSize) || 20, 100)).map((row, index) => (
                  <tr key={index} className="border-b border-slate-50 last:border-0">
                    {columns.map((column) => <td key={column} className="px-4 py-2 text-slate-700">{String(row[column] ?? '')}</td>)}
                  </tr>
                ))}
                {(!Array.isArray(rows) || rows.length === 0) && (
                  <tr><td colSpan={Math.max(columns.length, 1)} className="px-4 py-6 text-center text-xs text-slate-400">{props.emptyMessage || 'Aucun enregistrement'}</td></tr>
                )}
              </tbody>
            </table>
            <FormActionsHint node={node} />
          </div>
        </div>
        );
    }

    case 'Badge': {
      const text = ctx.resolveBinding(node, 'text', props.text) ?? '';
      return <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${TONE_CLASSES[props.tone] || TONE_CLASSES.neutral}`}>{String(text)}</span>;
    }

    case 'Alert':
      return (
        <div className={`rounded-lg border px-3 py-2 text-xs ${TONE_CLASSES[props.tone === 'info' ? 'blue' : props.tone === 'success' ? 'green' : props.tone === 'warning' ? 'amber' : props.tone === 'danger' ? 'rose' : 'blue']}`}>
          {props.title && <p className="font-semibold">{props.title}</p>}
          <p>{String(ctx.resolveBinding(node, 'message', props.message) ?? '')}</p>
        </div>
      );

    case 'Image': {
      const src = typeof props.src === 'string' && /^https:\/\//.test(props.src) ? props.src : '';
      return src
        ? <img src={src} alt={props.alt || ''} style={{ height: Math.min(Number(props.height) || 160, 600), width: 'auto' }} className="rounded-lg object-cover" />
        : <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-slate-300 text-xs text-slate-400">{props.alt || 'Image indisponible'}</div>;
    }

    case 'Link': {
      const href = typeof props.href === 'string' && (/^\//.test(props.href) || /^https:\/\//.test(props.href)) ? props.href : '#';
      return <a href={href} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">{String(ctx.resolveBinding(node, 'text', props.text) ?? props.text ?? '')}</a>;
    }

    case 'Tabs': {
      const labels = Array.isArray(props.tabs) ? props.tabs : String(props.tabs || '').split('\n').map((s) => s.trim()).filter(Boolean);
      return (
        <div className="rounded-xl border border-slate-200 bg-white" style={{ padding: pad('md') }}>
          <div role="tablist" className="mb-3 flex gap-1 border-b border-slate-100">
            {labels.map((label, index) => (
              <span key={label} role="tab" aria-selected={index === 0} className={`rounded-t-lg px-3 py-1.5 text-xs font-semibold ${index === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>{label}</span>
            ))}
          </div>
          <div className="flex flex-col" style={{ gap: pad('md') }}>
            {childNodes.map((child) => <RendererNode key={child.id} node={child} ctx={ctx} />)}
          </div>
        </div>
      );
    }

    case 'Spinner':
      return (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" aria-hidden="true" />
          {props.label || 'Chargement…'}
        </div>
      );

    case 'Button': {
      const variantClass = props.variant === 'secondary' ? 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
        : props.variant === 'ghost' ? 'text-slate-600 hover:bg-slate-100'
        : props.variant === 'danger' ? 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50'
        : 'bg-blue-600 text-white hover:bg-blue-700';
      const sizeClass = props.size === 'sm' ? 'px-3 py-1.5 text-[11px]' : props.size === 'lg' ? 'px-5 py-2.5 text-sm' : 'px-4 py-2 text-xs';
      return (
        <button
          type="button"
          className={`rounded-lg font-semibold transition-colors duration-150 ${variantClass} ${sizeClass}`}
          title={describeActions(node.actions)}
        >
          {props.label || 'Bouton'}
          <ButtonActionBadge node={node} />
        </button>
      );
    }

    default:
      // Fail-closed : un type inconnu ne rend RIEN d'exécutable.
      return (
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700" role="alert">
          Composant inconnu : « {node.type} » — non rendu par le Shared Renderer.
          {ctx.onUnknownComponent ? null : null}
        </div>
      );
  }
}

function FormActionsHint({ node }) {
  const actions = (node.actions || []).map((action) => action.type).filter(Boolean);
  if (actions.length === 0) return null;
  return <p className="mt-2 text-[10px] text-slate-400">Actions : {actions.join(', ')}</p>;
}

function ButtonActionBadge({ node }) {
  const actions = (node.actions || []).map((action) => action.type).filter(Boolean);
  if (actions.length === 0) return null;
  return <span className="ml-1.5 rounded bg-white/20 px-1 text-[9px] font-bold">{actions[0]}</span>;
}

function describeActions(actions) {
  const types = (actions || []).map((action) => action.type).filter(Boolean);
  return types.length ? `Actions : ${types.join(', ')}` : undefined;
}

function RendererNode({ node, ctx }) {
  return renderNode(node, ctx);
}

/**
 * Rendu racine d'une page.
 * resolveBinding(node, prop, fallback) : résolution structurée injectée.
 */
export function UiRenderer({ tree, resolveBinding, businessContext, mode = 'preview' }) {
  const ctx = useMemo(() => ({
    nodes: tree?.nodes || {},
    businessContext,
    mode,
    resolveBinding: resolveBinding || (() => null),
    fieldSchemas: new Map(),
  }), [tree, resolveBinding, businessContext, mode]);

  const rootNode = ctx.nodes[tree?.root];
  if (!rootNode) {
    return (
      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 text-center">
        <ComponentIcon className="mb-2 h-6 w-6 text-slate-300" aria-hidden="true" />
        <p className="text-sm font-medium text-slate-500">Page vide</p>
        <p className="text-xs text-slate-400">Ajoutez un composant depuis la bibliothèque.</p>
      </div>
    );
  }
  return <RendererNode node={rootNode} ctx={ctx} />;
}

export default UiRenderer;
