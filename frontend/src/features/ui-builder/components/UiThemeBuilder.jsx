/**
 * UI Builder — Theme Builder (mission §24) : design tokens structurés
 * (colors, typography, spacing, radius, shadow, breakpoints), persistence
 * réelle via PUT /api/ui-builder/theme, preview temps réel par variables
 * CSS locales (aucune injection de CSS arbitraire).
 */
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Palette } from 'lucide-react';

import { fetchOverview, submitTheme } from '../store/uiBuilderSlice.js';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { BmCard, BmBadge, BmButton } from '../../../components/business-manager/bm/ui.jsx';

const DEFAULT_TOKENS = {
  colors: { primary: '#2563eb', primarySoft: '#eff6ff', text: '#0f172a', muted: '#64748b', surface: '#ffffff', canvas: '#f8fafc' },
  typography: { fontFamily: 'Plus Jakarta Sans', baseSize: 14, headingScale: 1.25 },
  spacing: { unit: 4, container: 1200 },
  radius: { sm: 8, md: 12, lg: 14 },
  shadow: { card: '0 1px 2px rgba(15,23,42,0.06)' },
  breakpoints: { tablet: 834, mobile: 420 },
};

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export default function UiThemeBuilder() {
  return (
    <UiBuilderLayout subTab="theme">
      <ThemeBody />
    </UiBuilderLayout>
  );
}

function ThemeBody() {
  const dispatch = useDispatch();
  const { applicationVersionId, overview, themeStatus } = useSelector((state) => state.uiBuilder);
  const [tokens, setTokens] = useState(DEFAULT_TOKENS);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');

  // Chargement des tokens réels depuis l'UI Definition (overview → validation
  // ne renvoie pas le thème ; on requiert le backend via uidefinition).
  useEffect(() => {
    let live = true;
    if (!applicationVersionId) return undefined;
    import('../services/uiBuilderService.js').then(({ getUiDefinition }) => {
      getUiDefinition(applicationVersionId)
        .then((definition) => {
          if (live && definition?.theme) { setTokens({ ...DEFAULT_TOKENS, ...definition.theme }); setDirty(false); }
        })
        .catch(() => { /* thème absent : valeurs par défaut affichées explicitement */ });
    });
    return () => { live = false; };
  }, [applicationVersionId]);

  const cssVars = useMemo(() => ({
    '--preview-primary': HEX_RE.test(tokens.colors?.primary || '') ? tokens.colors.primary : '#2563eb',
    '--preview-radius': `${Math.min(Number(tokens.radius?.md) || 12, 24)}px`,
    '--preview-canvas': HEX_RE.test(tokens.colors?.canvas || '') ? tokens.colors.canvas : '#f8fafc',
    '--preview-text': HEX_RE.test(tokens.colors?.text || '') ? tokens.colors.text : '#0f172a',
  }), [tokens]);

  const setColor = (key, value) => {
    setTokens((previous) => ({ ...previous, colors: { ...previous.colors, [key]: value } }));
    setDirty(true);
  };
  const setNumber = (group, key, value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return;
    setTokens((previous) => ({ ...previous, [group]: { ...previous[group], [key]: parsed } }));
    setDirty(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      await dispatch(submitTheme({ applicationVersionId, tokens })).unwrap();
      setDirty(false);
      dispatch(fetchOverview(applicationVersionId));
    } catch (saveError) {
      setError(saveError?.message || 'Enregistrement du thème impossible.');
    }
  };

  const invalidColor = Object.values(tokens.colors || {}).filter((value) => typeof value === 'string' && value !== '' && !HEX_RE.test(value));

  return (
    <div className="space-y-5" style={cssVars}>
      <div className="grid gap-5 lg:grid-cols-2">
        <BmCard
          title="Design tokens"
          subtitle="Structure validée côté backend (JSON typé, aucun CSS arbitraire)"
          headerExtra={themeStatus === 'SAVING' ? <BmBadge tone="blue" dot>Enregistrement…</BmBadge> : dirty ? <BmBadge tone="amber" dot>Non enregistré</BmBadge> : <BmBadge tone="green" dot>Enregistré</BmBadge>}
        >
          <div className="space-y-4">
            <section>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Couleurs</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(tokens.colors || {}).map(([key, value]) => (
                  <label key={key} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2">
                    <input type="color" value={HEX_RE.test(String(value)) ? value : '#000000'} onChange={(event) => setColor(key, event.target.value)} className="h-6 w-6 cursor-pointer rounded border-0" aria-label={`Couleur ${key}`} />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">{key}</span>
                    <span className="font-mono text-[10px] text-slate-400">{String(value)}</span>
                  </label>
                ))}
              </div>
              {invalidColor.length > 0 && <p role="alert" className="mt-2 text-[11px] text-rose-600">Format hex attendu (#rrggbb) pour : {invalidColor.join(', ')}</p>}
            </section>

            <section className="grid gap-2 sm:grid-cols-3">
              <NumberToken label="Taille de base (px)" value={tokens.typography?.baseSize} min={12} max={20} onChange={(v) => setNumber('typography', 'baseSize', v)} />
              <NumberToken label="Radius md (px)" value={tokens.radius?.md} min={4} max={20} onChange={(v) => setNumber('radius', 'md', v)} />
              <NumberToken label="Breakpoint mobile (px)" value={tokens.breakpoints?.mobile} min={320} max={600} onChange={(v) => setNumber('breakpoints', 'mobile', v)} />
            </section>

            <div className="flex justify-end">
              <BmButton onClick={handleSave} disabled={!dirty || themeStatus === 'SAVING' || invalidColor.length > 0}>Enregistrer le thème</BmButton>
            </div>
            {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
          </div>
        </BmCard>

        <BmCard title="Aperçu temps réel" subtitle="Tokens appliqués via variables CSS locales">
          <div className="rounded-xl p-4" style={{ background: cssVars['--preview-canvas'] }}>
            <div className="rounded-xl bg-white p-4" style={{ borderRadius: cssVars['--preview-radius'], boxShadow: tokens.shadow?.card }}>
              <p className="text-sm font-bold" style={{ color: cssVars['--preview-text'] }}>Carte d'exemple</p>
              <p className="mt-1 text-xs" style={{ color: cssVars['--preview-text'], opacity: 0.6 }}>
                Typographie {tokens.typography?.fontFamily} — taille de base {tokens.typography?.baseSize}px.
              </p>
              <button className="mt-3 rounded-lg px-4 py-2 text-xs font-semibold text-white" style={{ background: cssVars['--preview-primary'], borderRadius: cssVars['--preview-radius'] }}>
                Action principale
              </button>
            </div>
            <p className="mt-3 text-center text-[10px]" style={{ color: cssVars['--preview-text'], opacity: 0.45 }}>
              Breakpoints : tablet {tokens.breakpoints?.tablet}px · mobile {tokens.breakpoints?.mobile}px
            </p>
          </div>
        </BmCard>
      </div>
    </div>
  );
}

function NumberToken({ label, value, min, max, onChange }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
    </label>
  );
}
