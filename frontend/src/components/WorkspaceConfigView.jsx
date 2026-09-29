import { useNavigate } from 'react-router-dom';
import { routeForTab } from '../app/navigationConfig.js';
import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab, addToast } from '../store/platformSlice.js';
import {
  ChevronRight,
  Shield,
  Layers,
  FileText,
  Clock,
  Globe,
  Settings,
  Users,
  Box,
  Network,
  Lock,
  Sliders,
  CheckCircle2,
  Rocket,
  Copy,
  Download,
  Trash2,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  ArrowRight,
  Check,
} from 'lucide-react';

export default function WorkspaceConfigView() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selectedAppId = useSelector((state) => state.applications.selectedAppId);
  const applications = useSelector((state) => state.applications.applications);

  const currentApp =
    applications.find((a) => a.id === selectedAppId) ||
    applications.find((a) => a.id === 'app-0003') ||
    applications[0];

  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [configuredSections, setConfiguredSections] = useState({
    general: true,
    org: true,
    modules: true,
    integrations: true,
    security: true,
    advanced: true,
  });

  const subNavItems = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'basic_info', label: 'Informations de base' },
    { id: 'general_params', label: 'Paramètres généraux' },
    { id: 'org_roles', label: 'Organisation & Rôles' },
    { id: 'modules_features', label: 'Modules & Fonctionnalités' },
    { id: 'integrations', label: 'Intégrations' },
    { id: 'security', label: 'Sécurité' },
    { id: 'advanced', label: 'Avancés' },
  ];

  const handlePublish = () => {
    dispatch(
      addToast({
        type: 'success',
        title: 'Publication initiée',
        message: `La version ${currentApp.workspaceVersion || 'v1.1.0'} a été envoyée pour homologation et publication.`,
      })
    );
  };

  const handleExport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentApp, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `config-${currentApp.code || 'workspace'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    dispatch(
      addToast({
        type: 'info',
        title: 'Export réussi',
        message: 'La configuration du workspace a été exportée au format JSON.',
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb matching Screenshot 1 */}
      <nav className="flex items-center text-xs text-slate-500 font-medium overflow-x-auto py-1 whitespace-nowrap">
        <button
          onClick={() => navigate(routeForTab('applications'))}
          className="hover:text-blue-600 transition-colors"
        >
          Applications
        </button>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />
        <span className="text-slate-700 font-medium">{currentApp.name}</span>
        <ChevronRight className="w-3.5 h-3.5 mx-1.5 text-slate-400 shrink-0" />
        <span className="text-blue-600 font-semibold">Workspace & Configuration</span>
      </nav>

      {/* Main Title Banner matching Screenshot 1 */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {currentApp.name}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {currentApp.status || 'ACTIVE'}
              </span>
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="px-2.5 py-1 bg-slate-100 rounded-md font-mono font-medium text-slate-700">
                ID : {currentApp.appNumber || 'APP-0003'}
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium text-slate-700">
                Catégorie : {currentApp.category || 'Commerce & Vente'}
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium text-slate-700 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Version active : {currentApp.activeVersion || 'v1.0.0'}
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="px-2.5 py-1 bg-slate-100 rounded-md font-medium text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                Environnement : {currentApp.targetEnvironment || 'PRODUCTION'}
              </span>
            </div>
          </div>

          {/* Action Menu */}
          <div className="relative shrink-0">
            <button
              id="workspace-actions-btn"
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
            >
              <span>Actions :</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {showActionsMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-30 py-1.5 text-xs text-slate-700">
                <button
                  onClick={() => {
                    setShowActionsMenu(false);
                    navigate(routeForTab('versions'));
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  Gérer les versions
                </button>
                <button
                  onClick={() => {
                    setShowActionsMenu(false);
                    handleExport();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  Exporter la configuration
                </button>
                <button
                  onClick={() => {
                    setShowActionsMenu(false);
                    navigate(routeForTab('validation'));
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-400" />
                  Valider pour publication
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="mt-6 border-t border-slate-100 pt-3">
          <div className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none text-xs sm:text-sm font-medium touch-pan-x">
            {subNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  activeSubTab === item.id
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4 Summary Cards matching Screenshot 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: État du Workspace */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              État du Workspace
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">
                {currentApp.workspaceState || 'CONFIGURÉ'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                100% configuré
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Prêt pour développement</p>
          </div>
        </div>

        {/* Card 2: Version en cours (Draft) */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Version en cours (Draft)
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-slate-900">v1.1.0</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">
                DRAFT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Créée le 24/08/2026 par Alexandre D.</p>
          </div>
          <button
            onClick={() => navigate(routeForTab('versions'))}
            className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1"
          >
            Voir les versions <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Environnement cible */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Environnement cible
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900">STAGING</span>
            <p className="text-xs text-slate-500 mt-1">Test & validation</p>
          </div>
          <button
            onClick={() => navigate(routeForTab('environments'))}
            className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1"
          >
            Changer d'environnement <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Dernière modification */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Dernière modification
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900">
              {currentApp.lastModifiedText || 'Aujourd\'hui à 09:57'}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              Par {currentApp.lastModifiedBy || 'Ranja Avo Efraim'}
            </p>
          </div>
          <button
            onClick={() => navigate(routeForTab('history'))}
            className="text-xs text-blue-600 font-medium hover:underline inline-flex items-center gap-1"
          >
            Voir l'historique <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main 2-Column Area: Left Key Info, Right Quick Config matching Screenshot 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Informations clés */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Informations clés</h2>
            <button
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'info',
                    title: 'Édition des métadonnées',
                    message: 'Mode édition activé pour les informations de l\'application.',
                  })
                )
              }
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Modifier
            </button>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="py-2.5 flex justify-between items-start gap-4">
              <span className="text-slate-500 shrink-0">Nom de l'application</span>
              <span className="font-semibold text-slate-900 text-right">{currentApp.name}</span>
            </div>

            <div className="py-2.5 flex justify-between items-start gap-4">
              <span className="text-slate-500 shrink-0">Code technique</span>
              <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800 text-right">
                {currentApp.code}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-start gap-4">
              <span className="text-slate-500 shrink-0">Description</span>
              <span className="text-slate-700 text-right max-w-xs">{currentApp.description}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center gap-4">
              <span className="text-slate-500 shrink-0">Catégorie</span>
              <span className="font-medium text-slate-800">{currentApp.category}</span>
            </div>

            <div className="py-2.5 flex justify-between items-center gap-4">
              <span className="text-slate-500 shrink-0">Icône</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                <ShoppingBag className="w-4 h-4 text-purple-600" />
                Commerce / Boutique
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center gap-4">
              <span className="text-slate-500 shrink-0">Statut</span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                {currentApp.status || 'ACTIVE'}
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-start gap-4">
              <span className="text-slate-500 shrink-0">Version active (Production)</span>
              <span className="font-medium text-slate-800 text-right">
                {currentApp.activeVersion || 'v1.0.0'} publiée le 20/08/2026
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center gap-4">
              <span className="text-slate-500 shrink-0">Workspace actuel</span>
              <span className="font-mono text-xs text-blue-700 font-medium">
                v1.1.0 (DRAFT) • STAGING
              </span>
            </div>

            <div className="py-2.5 flex justify-between items-center gap-4">
              <span className="text-slate-500 shrink-0">Propriétaire</span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {currentApp.ownerInitials || 'RA'}
                </div>
                <span className="font-medium text-slate-800">
                  {currentApp.owner || 'Ranja Avo Efraim'}
                </span>
              </div>
            </div>

            <div className="py-2.5 flex justify-between items-center gap-4">
              <span className="text-slate-500 shrink-0">Équipe assignée</span>
              <div className="flex items-center gap-1.5">
                <div className="flex -space-x-1">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">
                    RA
                  </div>
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">
                    AD
                  </div>
                  <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">
                    JM
                  </div>
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center border-2 border-white">
                    +3
                  </div>
                </div>
                <button
                  onClick={() =>
                    dispatch(
                      addToast({
                        type: 'info',
                        title: 'Gestion de l\'équipe',
                        message: 'Ouverture du gestionnaire des accès et permissions membres.',
                      })
                    )
                  }
                  className="text-xs text-blue-600 hover:underline ml-1"
                >
                  Gérer les membres
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Configuration rapide (6 cards grid matching Screenshot 1) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Configuration rapide</h2>
            <span className="text-xs text-slate-500">6 modules configurables</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Paramètres généraux */}
            <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Paramètres généraux</h3>
                <p className="text-xs text-slate-500">
                  Configurez les paramètres système, localisation, formats et préférences.
                </p>
              </div>
              <button
                id="cfg-general-btn"
                onClick={() =>
                  dispatch(
                    addToast({
                      type: 'info',
                      title: 'Paramètres généraux',
                      message: 'Ouverture du panneau des paramètres généraux.',
                    })
                  )
                }
                className="w-full py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-400 transition-colors"
              >
                Configurer
              </button>
            </div>

            {/* Card 2: Organisation & Rôles */}
            <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Organisation & Rôles</h3>
                <p className="text-xs text-slate-500">
                  Gérez les rôles, permissions et accès au niveau de l'application.
                </p>
              </div>
              <button
                id="cfg-org-btn"
                onClick={() =>
                  dispatch(
                    addToast({
                      type: 'info',
                      title: 'Organisation & Rôles',
                      message: 'Ouverture du panneau des rôles et autorisations.',
                    })
                  )
                }
                className="w-full py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-400 transition-colors"
              >
                Configurer
              </button>
            </div>

            {/* Card 3: Modules & Fonctionnalités */}
            <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Box className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Modules & Fonctionnalités</h3>
                <p className="text-xs text-slate-500">
                  Activez ou désactivez les modules et fonctionnalités disponibles.
                </p>
              </div>
              <button
                id="cfg-modules-btn"
                onClick={() =>
                  dispatch(
                    addToast({
                      type: 'info',
                      title: 'Modules & Fonctionnalités',
                      message: 'Ouverture du panneau des modules et extensions.',
                    })
                  )
                }
                className="w-full py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-400 transition-colors"
              >
                Configurer
              </button>
            </div>

            {/* Card 4: Intégrations */}
            <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Network className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Intégrations</h3>
                <p className="text-xs text-slate-500">
                  Configurez les API, services externes et intégrations tierces.
                </p>
              </div>
              <button
                id="cfg-integrations-btn"
                onClick={() => navigate(routeForTab('integrations'))}
                className="w-full py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-400 transition-colors"
              >
                Configurer
              </button>
            </div>

            {/* Card 5: Sécurité */}
            <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Sécurité</h3>
                <p className="text-xs text-slate-500">
                  Politiques de sécurité, authentification et contrôle d'accès.
                </p>
              </div>
              <button
                id="cfg-security-btn"
                onClick={() =>
                  dispatch(
                    addToast({
                      type: 'info',
                      title: 'Sécurité du Workspace',
                      message: 'Politiques de sécurité et certificats inspectés.',
                    })
                  )
                }
                className="w-full py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-400 transition-colors"
              >
                Configurer
              </button>
            </div>

            {/* Card 6: Avancés */}
            <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors bg-slate-50/50 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <h3 className="font-semibold text-slate-900 text-sm">Avancés</h3>
                <p className="text-xs text-slate-500">
                  Paramètres avancés, variables, cache et maintenance.
                </p>
              </div>
              <button
                id="cfg-advanced-btn"
                onClick={() =>
                  dispatch(
                    addToast({
                      type: 'info',
                      title: 'Paramètres Avancés',
                      message: 'Variables d\'environnement et cache système consultés.',
                    })
                  )
                }
                className="w-full py-1.5 px-3 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-white hover:border-slate-400 transition-colors"
              >
                Configurer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar: Actions du workspace matching Screenshot 1 */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
          <button
            onClick={() => navigate(routeForTab('versions'))}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Voir les versions
          </button>
          <button
            onClick={() => navigate(routeForTab('validation'))}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Valider pour publication
          </button>
          <button
            onClick={handlePublish}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Rocket className="w-3.5 h-3.5" />
            Publier (v1.1.0)
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
          <button
            onClick={() =>
              dispatch(
                addToast({
                  type: 'success',
                  title: 'Workspace cloné',
                  message: `Workspace cloné avec succès pour ${currentApp.name}.`,
                })
              )
            }
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            Cloner le workspace
          </button>
          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Exporter la configuration
          </button>
          <button
            onClick={() =>
              dispatch(
                addToast({
                  type: 'error',
                  title: 'Suppression impossible',
                  message: 'Le draft actif ne peut pas être supprimé car des verrous de modification existent.',
                })
              )
            }
            className="px-3.5 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
          >
            Supprimer le draft
          </button>
        </div>
      </div>
    </div>
  );
}
