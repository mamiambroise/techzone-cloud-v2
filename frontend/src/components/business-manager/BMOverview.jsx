import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  FileText,
  Layers3,
  Plus,
  Rocket,
  Settings2,
  ShieldCheck,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { BmPage } from './bm/ui.jsx';

const cards = [
  {
    id: 1,
    title: 'Tableau de bord BM',
    subtitle: 'Vue d’ensemble des applications, statuts et actions rapides.',
    accent: 'blue',
    kind: 'dashboard',
  },
  {
    id: 2,
    title: 'Création d’une application',
    subtitle: 'Créer une application métier pas à pas.',
    accent: 'cyan',
    kind: 'creation',
  },
  {
    id: 3,
    title: 'Modélisation du modèle métier',
    subtitle: 'Définir les entités, relations et règles métier.',
    accent: 'slate',
    kind: 'model',
  },
  {
    id: 4,
    title: 'Configuration des interfaces',
    subtitle: 'Construire les écrans et les formulaires.',
    accent: 'indigo',
    kind: 'interfaces',
  },
  {
    id: 5,
    title: 'Règles métier et automatisations',
    subtitle: 'Orchestrer les workflows et actions.',
    accent: 'emerald',
    kind: 'rules',
  },
  {
    id: 6,
    title: 'Appui et test de l’application',
    subtitle: 'Valider le comportement avant mise en production.',
    accent: 'violet',
    kind: 'validation',
  },
  {
    id: 7,
    title: 'Gestion des versions',
    subtitle: 'Historiser les livraisons et recettes.',
    accent: 'amber',
    kind: 'versions',
  },
  {
    id: 8,
    title: 'Packaging de l’application',
    subtitle: 'Générer les paquets et artefacts.',
    accent: 'rose',
    kind: 'packaging',
  },
  {
    id: 9,
    title: 'Publication',
    subtitle: 'Déployer et rendre disponible l’application.',
    accent: 'green',
    kind: 'publish',
  },
  {
    id: 10,
    title: 'Exécution dans Pack Runtime',
    subtitle: 'Démarrer et surveiller l’exécution.',
    accent: 'slate',
    kind: 'runtime',
  },
];

const statRows = [
  { name: 'Pack Vante', status: 'Publiée', value: '12' },
  { name: 'Pack WISP', status: 'En cours', value: '8' },
  { name: 'Pack Formation', status: 'Publie', value: '4' },
  { name: 'Pack Entreprise', status: 'Brouillon', value: '3' },
];

const quickStats = [
  { label: 'Applications', value: 12 },
  { label: 'Actives', value: 8 },
  { label: 'Brouillons', value: 3 },
  { label: 'Prêtes', value: 2 },
];

function Panel({ title, subtitle, children, tone = 'default', className = '' }) {
  const tones = {
    default: 'border-slate-200 bg-white text-slate-800',
    blue: 'border-blue-100 bg-slate-900 text-white',
    cyan: 'border-cyan-100 bg-cyan-50 text-slate-800',
    slate: 'border-slate-200 bg-slate-100 text-slate-800',
    indigo: 'border-indigo-100 bg-indigo-50 text-slate-800',
    emerald: 'border-emerald-100 bg-emerald-50 text-slate-800',
    violet: 'border-violet-100 bg-violet-50 text-slate-800',
    amber: 'border-amber-100 bg-amber-50 text-slate-800',
    rose: 'border-rose-100 bg-rose-50 text-slate-800',
    green: 'border-emerald-100 bg-emerald-50 text-slate-800',
  };

  return (
    <section className={`overflow-hidden rounded-2xl border shadow-[0_8px_30px_rgba(15,23,42,0.05)] ${tones[tone]} ${className}`}>
      <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3">
        <div>
          <h3 className="text-[13px] font-semibold leading-tight">{title}</h3>
          {subtitle && <p className="mt-1 text-[11px] opacity-75">{subtitle}</p>}
        </div>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-current">
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export default function BMOverview() {
  const navigate = useNavigate();

  const metrics = useMemo(
    () => [
      { label: 'Application', value: 'Business Manager' },
      { label: 'Version', value: 'v1.2.0' },
      { label: 'Statut', value: 'Actif' },
      { label: 'Tenant', value: 'Techzone Cloud' },
    ],
    [],
  );

  return (
    <BmPage>
      <div className="space-y-5 rounded-2xl bg-slate-100 p-4">
        <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
          <Panel tone="blue" className="min-h-[170px] border-slate-800 bg-slate-900">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-sky-200">
                  <Boxes className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-300">Techzone Cloud</p>
                  <p className="mt-1 text-xs text-slate-300">Une plateforme, plusieurs possibilités</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/business-manager/applications')}
                className="inline-flex items-center gap-2 rounded-lg border border-sky-400/40 bg-sky-500/10 px-3 py-2 text-xs font-semibold text-sky-100 hover:bg-sky-500/20"
              >
                Ouvrir <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">Business Manager (BM)</h1>
                <p className="mt-2 max-w-xl text-sm text-slate-300">
                  Modéliser et gérer les applications métier sans code, prêtes pour le packaging et l’exécution.
                </p>
              </div>
              <div className="rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1.5 text-xs font-medium text-sky-100">
                CDC 01
              </div>
            </div>
          </Panel>

          <Panel title="Objectif" subtitle="Pilote de la conception" tone="cyan" className="min-h-[170px]">
            <div className="flex items-start gap-3">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 text-sm text-slate-700">
                Permettre de créer, configurer et gérer des applications métier complètes sans code, prêtes pour le packaging et l’exécution.
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Tableau de bord BM" subtitle="Vue globale" tone="default" className="xl:col-span-1">
            <div className="space-y-3">
              {quickStats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <span className="text-sm text-slate-600">{stat.label}</span>
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-sm font-semibold text-blue-700">{stat.value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Création d’une application" subtitle="Créer une application pas à pas" tone="cyan" className="xl:col-span-1">
            <div className="space-y-3">
              <button
                type="button"
                className="inline-flex w-full items-center justify-between rounded-xl border border-dashed border-sky-300 bg-white px-3 py-2 text-sm font-medium text-sky-700"
              >
                <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Nouvelle application</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-white p-2">
                  <p className="text-slate-500">Nom</p>
                  <p className="mt-1 font-semibold text-slate-800">Business Manager</p>
                </div>
                <div className="rounded-lg bg-white p-2">
                  <p className="text-slate-500">Catégorie</p>
                  <p className="mt-1 font-semibold text-slate-800">Service</p>
                </div>
              </div>
            </div>
          </Panel>

          <Panel title="Modélisation du modèle métier" subtitle="Définir les entités" tone="slate" className="xl:col-span-1">
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm">
                <Layers3 className="h-4 w-4 text-blue-600" />
                Liste des entités
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                {['Client', 'Produit', 'Commande', 'Facture'].map((entity) => (
                  <div key={entity} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-2">
                    <span>{entity}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600">{entity === 'Client' ? 'Actif' : 'Planifié'}</span>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Configuration des interfaces" subtitle="Formulaires et écrans" tone="indigo" className="xl:col-span-1">
            <div className="space-y-3">
              <div className="grid gap-2">
                {['Champ texte', 'Liste déroulante', 'Case à cocher', 'Date'].map((field) => (
                  <div key={field} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                    <span>{field}</span>
                    <Settings2 className="h-4 w-4 text-indigo-500" />
                  </div>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Règles métier et automatisations" subtitle="Workflows automatiques" tone="emerald" className="xl:col-span-1">
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-emerald-200 bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-emerald-700">Validation</p>
                <p className="mt-1">Règle métier appliquée avant publication.</p>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-emerald-700">Action</p>
                <p className="mt-1">Notifier l’utilisateur et déclencher le workflow.</p>
              </div>
            </div>
          </Panel>

          <Panel title="Appui et test de l’application" subtitle="Validation fonctionnelle" tone="violet" className="xl:col-span-1">
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-violet-600" />
                Contrôles de qualité
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                <ShieldCheck className="h-4 w-4 text-violet-600" />
                Verification de l’application
              </div>
            </div>
          </Panel>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          <Panel title="Gestion des versions" subtitle="Historique des livraisons" tone="amber" className="xl:col-span-1">
            <div className="space-y-2">
              {['v1.2.0', 'v1.1.0', 'v1.0.0'].map((version) => (
                <div key={version} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                  <span>{version}</span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">Publié</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Packaging de l’application" subtitle="Assembler l’artefact" tone="rose" className="xl:col-span-1">
            <div className="space-y-3">
              <div className="rounded-xl bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-rose-700">Package</p>
                <p className="mt-1">Version : 1.0.0</p>
                <p className="text-slate-500">Configuration : production</p>
              </div>
            </div>
          </Panel>

          <Panel title="Publication" subtitle="Déployer l’application" tone="green" className="xl:col-span-1">
            <div className="space-y-3">
              <div className="rounded-xl bg-white p-3 text-sm text-slate-700">
                <p className="font-semibold text-emerald-700">Infrastructure</p>
                <p className="mt-1">Pack Runtime</p>
              </div>
            </div>
          </Panel>
        </div>

        <Panel title="Exécution dans Pack Runtime" subtitle="Application déployée et disponible" tone="default">
          <div className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {statRows.map((row) => (
                <div key={row.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{row.name}</span>
                    <CircleDot className="h-4 w-4 text-emerald-500" />
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Statut</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{row.status}</p>
                  <p className="mt-4 text-2xl font-bold text-slate-900">{row.value}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </BmPage>
  );
}
