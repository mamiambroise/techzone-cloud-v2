import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab, addToast } from '../store/platformSlice.js';
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Copy,
  Edit,
  ArrowRight,
  Plus,
  Shield,
  Clock,
  Layers,
  Check,
  Tag,
  AlertTriangle,
  Globe,
  FileText,
} from 'lucide-react';

export default function VersionsDetailView() {
  const dispatch = useDispatch();
  const selectedAppId = useSelector((state) => state.applications.selectedAppId);
  const applications = useSelector((state) => state.applications.applications);

  const currentApp =
    applications.find((a) => a.id === selectedAppId) ||
    applications.find((a) => a.id === 'app-0003') ||
    applications[0];

  const [activeTabSub, setActiveTabSub] = useState('summary');
  const [tags, setTags] = useState([
    'ecommerce',
    'premium',
    'production',
    'paiement',
    'panier',
    'promo',
  ]);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
      setShowAddTag(false);
      dispatch(
        addToast({
          type: 'success',
          title: 'Tag ajouté',
          message: `Le tag "${newTagInput.trim()}" a été associé à la version v1.2.0.`,
        })
      );
    }
  };

  const tabs = [
    { id: 'summary', label: 'Résumé' },
    { id: 'info', label: 'Informations' },
    { id: 'content', label: 'Contenu' },
    { id: 'envs', label: 'Environnements' },
    { id: 'validations', label: 'Validations' },
    { id: 'dependencies', label: 'Dépendances' },
    { id: 'history', label: 'Historique' },
    { id: 'audit', label: 'Journal d\'audit' },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb matching Screenshot 4 */}
      <nav className="flex items-center text-xs text-slate-500 font-medium overflow-x-auto py-1 whitespace-nowrap">
        <span>Business Manager</span>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />
        <button
          onClick={() => dispatch(setActiveTab('applications'))}
          className="hover:text-blue-600 transition-colors"
        >
          Versions
        </button>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />
        <span className="text-slate-700 font-medium">Boutique Premium E2E 9720</span>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />
        <span className="text-blue-600 font-semibold font-mono">v1.2.0</span>
      </nav>

      {/* Main Version Title Banner matching Screenshot 4 */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
                v1.2.0
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-800 uppercase">
                LATEST
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                STABLE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Boutique Premium E2E 9720 • Production •{' '}
              <span className="font-mono text-slate-700">Référence: #a1b2c3d</span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
            <button
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'info',
                    title: 'Actions de version',
                    message: 'Diff, export de manifest scellé et analyse de conformité.',
                  })
                )
              }
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <span>Actions</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
            <button
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'success',
                    title: 'Version clonée',
                    message: 'Brouillon v1.3.0-draft créé à partir de v1.2.0.',
                  })
                )
              }
              className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Cloner cette version</span>
            </button>
            <button
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'info',
                    title: 'Modification de la version',
                    message: 'Ouverture de l\'éditeur de configuration de la version v1.2.0.',
                  })
                )
              }
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>Modifier</span>
            </button>
          </div>
        </div>

        {/* Sub-tabs Row matching Screenshot 4 */}
        <div className="border-t border-slate-100 pt-3">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none text-xs sm:text-sm font-medium touch-pan-x">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTabSub(t.id)}
                className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeTabSub === t.id
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 5 Stat Cards matching Screenshot 4 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Stat 1: Statut */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Statut</span>
          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm sm:text-base font-bold text-slate-900">STABLE</span>
          </div>
        </div>

        {/* Stat 2: Environnement cible */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Environnement cible</span>
          <div className="pt-0.5">
            <span className="text-sm sm:text-base font-bold text-slate-900">PRODUCTION</span>
          </div>
        </div>

        {/* Stat 3: Type */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Type</span>
          <div className="pt-0.5">
            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-purple-100 text-purple-800">
              MAJOR
            </span>
          </div>
        </div>

        {/* Stat 4: Version actuelle depuis */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1">
          <span className="text-xs text-slate-500 font-medium">Version actuelle depuis</span>
          <div className="pt-0.5 text-xs sm:text-sm font-semibold text-slate-800">
            25/05/2024 09:00
            <span className="block text-[11px] text-slate-400 font-normal">Il y a 8 jours</span>
          </div>
        </div>

        {/* Stat 5: Créée par */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-xs text-slate-500 font-medium">Créée par</span>
          <div className="pt-0.5 text-xs sm:text-sm font-semibold text-slate-800">
            Administrateur Business
            <span className="block text-[11px] text-slate-400 font-normal">25/05/2024 09:00</span>
          </div>
        </div>
      </div>

      {/* 2-Column Section matching Screenshot 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Description, Key Changes, Notes, Tags */}
        <div className="lg:col-span-6 space-y-6">
          {/* Description & Changements clés */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Description</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Version majeure incluant un nouveau moteur de panier, la gestion avancée des
                promotions et une amélioration des performances de paiement.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900">Changements clés</h3>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Nouveau moteur de panier multi-entrepôts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Gestion avancée des codes promotionnels</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Paiement en plusieurs étapes sécurisé</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Optimisations des performances (API & Front)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Tableau de bord analytique amélioré</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Notes
              </h3>
              <p className="text-xs text-slate-600 italic">
                Cette version remplace la v1.1.0 en production sans interruption de service.
              </p>
            </div>

            {/* Tags */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tags
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
                {showAddTag ? (
                  <form onSubmit={handleAddTag} className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      placeholder="Nom du tag"
                      className="px-2 py-0.5 border border-slate-300 rounded text-xs w-24 focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs"
                    >
                      OK
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setShowAddTag(true)}
                    className="px-2.5 py-1 rounded-md text-xs font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Ajouter un tag
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Déploiements actifs & Qualité & validations */}
        <div className="lg:col-span-6 space-y-6">
          {/* Déploiements actifs */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Déploiements actifs</h2>
              <span className="text-xs text-emerald-600 font-medium">3 environnements actifs</span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Production */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">PRODUCTION</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Actif
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] flex justify-between">
                  <span>25/05/2024 09:00</span>
                  <span>AB Administrateur Business</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Staging */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">STAGING</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Actif
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] flex justify-between">
                  <span>27/05/2024 10:30</span>
                  <span>AB Administrateur Business</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Test */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">TEST</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Actif
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] flex justify-between">
                  <span>28/05/2024 08:30</span>
                  <span>JD Jean Dupont</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '98%' }} />
                </div>
              </div>

              {/* Development */}
              <div className="p-3 rounded-lg bg-slate-50/50 border border-slate-100 flex items-center justify-between text-slate-400">
                <span className="font-medium">DEVELOPMENT</span>
                <span className="text-[11px]">Non déployée</span>
              </div>
            </div>

            <button
              onClick={() => dispatch(setActiveTab('environments'))}
              className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1 pt-1"
            >
              Voir tous les déploiements <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Qualité & validations */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Qualité & validations</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Conforme
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-500">Couverture tests</span>
                <div className="text-lg font-bold text-slate-900">87%</div>
                <span className="text-[11px] text-emerald-600">+5% vs v1.1.0</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-500">Tests unitaires</span>
                <div className="text-lg font-bold text-slate-900 font-mono">452 / 520</div>
                <span className="text-[11px] text-emerald-600">Réussis</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-500">Validations</span>
                <div className="text-lg font-bold text-slate-900 font-mono">5 / 5</div>
                <span className="text-[11px] text-emerald-600">Toutes validées</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-500">Problèmes</span>
                <div className="text-lg font-bold text-emerald-600 font-mono">0</div>
                <span className="text-[11px] text-slate-500">Aucun problème</span>
              </div>
            </div>

            <button
              onClick={() => dispatch(setActiveTab('validation'))}
              className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1 pt-1"
            >
              Voir le rapport complet <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
