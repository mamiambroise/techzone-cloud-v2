/**
 * UI Builder theme editor: governed design tokens with a responsive live site preview.
 * Theme values are persisted by the UI Builder API and shared with the renderer.
 */
import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Monitor, Palette, Smartphone, Tablet } from 'lucide-react';

import { fetchTheme, submitTheme } from '../store/uiBuilderSlice.js';
import UiBuilderLayout from './UiBuilderLayout.jsx';
import { BmBadge, BmButton, BmCard, BmLoading } from '../../../components/business-manager/bm/ui.jsx';

const DEFAULT_TOKENS = {
  colors: {
    primary: '#0866F5',
    primarySoft: '#EDF4FF',
    text: '#101C48',
    muted: '#64748B',
    surface: '#FFFFFF',
    canvas: '#EFF6FF',
    success: '#08A66A',
    warning: '#FF9800',
    error: '#F22640',
  },
  typography: { fontFamily: 'Inter', baseSize: 14 },
  spacing: { unit: 4, container: 1200 },
  radius: { sm: 6, md: 10, lg: 14 },
  shadow: { card: '0 2px 12px rgba(16,28,72,0.05)' },
  breakpoints: { tablet: 834, mobile: 420 },
};

const COLOR_LABELS = {
  primary: 'Primaire',
  primarySoft: 'Primaire doux',
  text: 'Texte',
  muted: 'Texte secondaire',
  surface: 'Surface',
  canvas: 'Fond de page',
  success: 'Succès',
  warning: 'Avertissement',
  error: 'Erreur',
};
const COLOR_PRESETS = [
  { name: 'Techzone', colors: { primary: '#0866F5', primarySoft: '#EDF4FF' } },
  { name: 'Indigo', colors: { primary: '#6258D7', primarySoft: '#F1F0FF' } },
  { name: 'Émeraude', colors: { primary: '#07866F', primarySoft: '#E7F7F2' } },
  { name: 'Corail', colors: { primary: '#D34F62', primarySoft: '#FFF0F1' } },
];
const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'system-ui', label: 'Système' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Georgia', label: 'Georgia' },
];
const SHADOW_OPTIONS = [
  { value: 'none', label: 'Aucune' },
  { value: 'subtle', label: 'Discrète' },
  { value: 'raised', label: 'Élevée' },
];
const SHADOW_VALUES = {
  none: 'none',
  subtle: '0 2px 12px rgba(16,28,72,0.05)',
  raised: '0 10px 28px rgba(16,28,72,0.12)',
};
const DEVICE_WIDTHS = { DESKTOP: 720, TABLET: 600, MOBILE: 360 };
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

function mergeTokens(theme) {
  return Object.fromEntries(
    Object.entries(DEFAULT_TOKENS).map(([group, defaults]) => [
      group,
      { ...defaults, ...(theme?.[group] && typeof theme[group] === 'object' ? theme[group] : {}) },
    ]),
  );
}

export default function UiThemeBuilder() {
  return (
    <UiBuilderLayout subTab="theme">
      <ThemeBody />
    </UiBuilderLayout>
  );
}

function ThemeBody() {
  const dispatch = useDispatch();
  const { applicationVersionId, theme, themeStatus } = useSelector((state) => state.uiBuilder);
  const [tokens, setTokens] = useState(DEFAULT_TOKENS);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [device, setDevice] = useState('DESKTOP');

  useEffect(() => {
    if (themeStatus === 'LOADED' || themeStatus === 'SAVED') {
      setTokens(mergeTokens(theme));
      setDirty(false);
    }
  }, [theme, themeStatus]);

  const previewStyle = useMemo(() => ({
    backgroundColor: HEX_RE.test(tokens.colors?.canvas || '') ? tokens.colors.canvas : DEFAULT_TOKENS.colors.canvas,
    color: HEX_RE.test(tokens.colors?.text || '') ? tokens.colors.text : DEFAULT_TOKENS.colors.text,
    fontFamily: FONT_OPTIONS.some((font) => font.value === tokens.typography?.fontFamily)
      ? tokens.typography.fontFamily
      : 'Inter',
    fontSize: `${tokens.typography?.baseSize || DEFAULT_TOKENS.typography.baseSize}px`,
    '--theme-primary': HEX_RE.test(tokens.colors?.primary || '') ? tokens.colors.primary : DEFAULT_TOKENS.colors.primary,
    '--theme-primary-soft': HEX_RE.test(tokens.colors?.primarySoft || '') ? tokens.colors.primarySoft : DEFAULT_TOKENS.colors.primarySoft,
    '--theme-surface': HEX_RE.test(tokens.colors?.surface || '') ? tokens.colors.surface : DEFAULT_TOKENS.colors.surface,
    '--theme-muted': HEX_RE.test(tokens.colors?.muted || '') ? tokens.colors.muted : DEFAULT_TOKENS.colors.muted,
    '--theme-radius': `${Math.min(Number(tokens.radius?.md) || 10, 64)}px`,
    '--theme-shadow': Object.values(SHADOW_VALUES).includes(tokens.shadow?.card) ? tokens.shadow.card : SHADOW_VALUES.subtle,
  }), [tokens]);

  const setColor = (key, value) => {
    setTokens((previous) => ({ ...previous, colors: { ...previous.colors, [key]: value } }));
    setDirty(true);
  };
  const setNumber = (group, key, value, min, max) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) return;
    setTokens((previous) => ({ ...previous, [group]: { ...previous[group], [key]: parsed } }));
    setDirty(true);
  };
  const setFont = (fontFamily) => {
    setTokens((previous) => ({ ...previous, typography: { ...previous.typography, fontFamily } }));
    setDirty(true);
  };
  const applyColorPreset = (preset) => {
    setTokens((previous) => ({ ...previous, colors: { ...previous.colors, ...preset.colors } }));
    setDirty(true);
  };

  const handleSave = async () => {
    setError('');
    try {
      await dispatch(submitTheme({ applicationVersionId, tokens })).unwrap();
      setDirty(false);
    } catch (saveError) {
      setError(saveError?.message || 'Enregistrement du thème impossible.');
    }
  };

  const invalidColor = Object.entries(tokens.colors || {}).filter(([, value]) => !HEX_RE.test(String(value)));
  const invalidBreakpoints = tokens.breakpoints.mobile >= tokens.breakpoints.tablet;
  const shadowOption = Object.entries(SHADOW_VALUES).find(([, value]) => value === tokens.shadow.card)?.[0] || 'subtle';
  const previewFont = tokens.typography.fontFamily === 'Georgia' ? 'Georgia, serif' : `${tokens.typography.fontFamily}, system-ui, sans-serif`;
  const canSave = dirty && ['LOADED', 'SAVED', 'SAVE_ERROR'].includes(themeStatus) && invalidColor.length === 0 && !invalidBreakpoints;

  if (themeStatus === 'IDLE' || themeStatus === 'LOADING') return <BmLoading label="Chargement du thème…" />;
  if (themeStatus === 'LOAD_ERROR') {
    return (
      <BmCard title="Thème indisponible">
        <p role="alert" className="mb-3 text-sm text-rose-700">Le thème de cette version n’a pas pu être chargé. Aucune valeur ne sera enregistrée sans le thème actuel.</p>
        <BmButton variant="secondary" onClick={() => dispatch(fetchTheme(applicationVersionId))}>Réessayer</BmButton>
      </BmCard>
    );
  }

  return (
    <div className="uib-content space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900"><Palette className="h-5 w-5 text-indigo-600" />Personnaliser le design du site</h2>
          <p className="mt-1 text-sm text-slate-500">Ajustez les tokens de la version courante et vérifiez leur rendu avant publication.</p>
        </div>
        {themeStatus === 'SAVING' ? <BmBadge tone="blue" dot>Enregistrement…</BmBadge> : dirty ? <BmBadge tone="amber" dot>Modifications non enregistrées</BmBadge> : themeStatus === 'SAVE_ERROR' ? <BmBadge tone="rose" dot>Échec de l’enregistrement</BmBadge> : <BmBadge tone="green" dot>Enregistré</BmBadge>}
      </div>


      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,1.15fr)]">
        <div className="space-y-5">
          <BmCard title="Palette" subtitle="Choisissez une base puis ajustez chaque couleur.">
            <div className="mb-4 flex flex-wrap gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyColorPreset(preset)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: preset.colors.primary }} />
                  {preset.name}
                </button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(tokens.colors).map(([key, value]) => (
                <label key={key} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2">
                  <input
                    type="color"
                    value={HEX_RE.test(String(value)) ? value : '#000000'}
                    onChange={(event) => setColor(key, event.target.value)}
                    className="h-7 w-8 cursor-pointer rounded border-0 bg-transparent p-0"
                    aria-label={`Couleur ${COLOR_LABELS[key] || key}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">{COLOR_LABELS[key] || key}</span>
                  <span className="font-mono text-[10px] text-slate-400">{String(value)}</span>
                </label>
              ))}
            </div>
            {invalidColor.length > 0 && <p role="alert" className="mt-2 text-xs text-rose-600">Format hex invalide : {invalidColor.map(([key]) => COLOR_LABELS[key] || key).join(', ')}</p>}
          </BmCard>

          <BmCard title="Typographie et formes" subtitle="Des réglages gouvernés, identiques dans l’aperçu et le Runtime.">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Police</span>
                <select value={tokens.typography.fontFamily} onChange={(event) => setFont(event.target.value)} aria-label="Police du site" className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                  {FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
                </select>
              </label>
              <NumberToken label="Taille de texte (px)" value={tokens.typography.baseSize} min={8} max={24} onChange={(value) => setNumber('typography', 'baseSize', value, 8, 24)} />
              <NumberToken label="Arrondi petit (px)" value={tokens.radius.sm} min={0} max={32} onChange={(value) => setNumber('radius', 'sm', value, 0, 32)} />
              <NumberToken label="Arrondi moyen (px)" value={tokens.radius.md} min={0} max={40} onChange={(value) => setNumber('radius', 'md', value, 0, 40)} />
              <NumberToken label="Arrondi grand (px)" value={tokens.radius.lg} min={0} max={48} onChange={(value) => setNumber('radius', 'lg', value, 0, 48)} />
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Ombre des cartes</span>
                <select
                  aria-label="Ombre des cartes"
                  value={shadowOption}
                  onChange={(event) => {
                    setTokens((previous) => ({ ...previous, shadow: { ...previous.shadow, card: SHADOW_VALUES[event.target.value] } }));
                    setDirty(true);
                  }}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  {SHADOW_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>
          </BmCard>

          <BmCard title="Espacement et responsive" subtitle="Largeur de contenu et points de rupture du site.">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberToken label="Unité d’espacement (px)" value={tokens.spacing.unit} min={2} max={16} onChange={(value) => setNumber('spacing', 'unit', value, 2, 16)} />
              <NumberToken label="Largeur maximale (px)" value={tokens.spacing.container} min={640} max={1920} onChange={(value) => setNumber('spacing', 'container', value, 640, 1920)} />
              <NumberToken label="Breakpoint tablette (px)" value={tokens.breakpoints.tablet} min={600} max={1600} onChange={(value) => setNumber('breakpoints', 'tablet', value, 600, 1600)} />
              <NumberToken label="Breakpoint mobile (px)" value={tokens.breakpoints.mobile} min={320} max={800} onChange={(value) => setNumber('breakpoints', 'mobile', value, 320, 800)} />
            </div>
            {invalidBreakpoints && <p role="alert" className="mt-2 text-xs text-rose-600">Le breakpoint mobile doit être inférieur au breakpoint tablette.</p>}
          </BmCard>

          <div className="flex justify-end">
            <BmButton onClick={handleSave} disabled={!canSave}>Enregistrer le design</BmButton>
          </div>
          {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
        </div>

        <BmCard title="Aperçu du site" subtitle="Rendu instantané des couleurs, de la typographie, des formes et de l’ombre.">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs text-slate-500">Mode aperçu · aucun changement publié</span>
            <div role="group" aria-label="Format de l’aperçu" className="flex rounded-lg bg-slate-100 p-0.5">
              {[
                ['DESKTOP', Monitor, 'Desktop'],
                ['TABLET', Tablet, 'Tablette'],
                ['MOBILE', Smartphone, 'Mobile'],
              ].map(([kind, Icon, label]) => (
                <button key={kind} type="button" aria-label={label} aria-pressed={device === kind} onClick={() => setDevice(kind)} className={`rounded-md p-1.5 ${device === kind ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500'}`}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200 p-3" style={{ backgroundColor: previewStyle.backgroundColor }}>
            <div
              aria-label="Prévisualisation du site"
              className="mx-auto min-h-[26rem] overflow-hidden border border-slate-200 bg-white transition-[width] duration-200"
              style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%', borderRadius: previewStyle['--theme-radius'], boxShadow: previewStyle['--theme-shadow'], fontFamily: previewFont, fontSize: previewStyle.fontSize }}
            >
              <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3" style={{ backgroundColor: previewStyle['--theme-surface'], color: previewStyle.color }}>
                <span className="font-bold">Votre site</span>
                <nav className="flex gap-3 text-xs" aria-label="Navigation de démonstration"><span>Accueil</span><span>Produits</span><span>À propos</span></nav>
              </header>
              <main className="space-y-4 p-5" style={{ maxWidth: tokens.spacing.container }}>
                <div className="rounded-lg p-4" style={{ backgroundColor: previewStyle['--theme-primary-soft'], borderRadius: `${tokens.radius.lg}px` }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: previewStyle['--theme-primary'] }}>Bienvenue</p>
                  <h3 className="mt-2 text-xl font-bold" style={{ color: previewStyle.color }}>Un design à votre image</h3>
                  <p className="mt-1" style={{ color: previewStyle['--theme-muted'] }}>Personnalisez votre expérience sans écrire de code.</p>
                  <button type="button" className="mt-4 px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: previewStyle['--theme-primary'], borderRadius: previewStyle['--theme-radius'] }}>Découvrir</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <article className="border border-slate-200 p-4" style={{ backgroundColor: previewStyle['--theme-surface'], borderRadius: previewStyle['--theme-radius'], boxShadow: previewStyle['--theme-shadow'] }}>
                    <h4 className="font-semibold" style={{ color: previewStyle.color }}>Carte de contenu</h4>
                    <p className="mt-1" style={{ color: previewStyle['--theme-muted'] }}>La typographie et les espacements s’adaptent à votre thème.</p>
                  </article>
                  <article className="border border-slate-200 p-4" style={{ backgroundColor: previewStyle['--theme-surface'], borderRadius: previewStyle['--theme-radius'], boxShadow: previewStyle['--theme-shadow'] }}>
                    <label className="mb-1 block text-xs font-medium" style={{ color: previewStyle.color }}>Champ de formulaire</label>
                    <input readOnly value="Exemple de saisie" className="w-full border border-slate-200 px-3 py-2" style={{ borderRadius: `${tokens.radius.sm}px`, fontFamily: previewFont }} />
                  </article>
                </div>
              </main>
            </div>
          </div>
        </BmCard>
      </div>
    </div>
  );
}

function NumberToken({ label, value, min, max, onChange }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input type="number" min={min} max={max} value={value ?? ''} onChange={(event) => onChange(event.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
    </label>
  );
}
