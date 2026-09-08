import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab, setActiveModuleId } from '../store/platformSlice.js';
import { setActiveIntegrationTab } from '../store/integrationSlice.js';
import { setActiveDeploymentTab } from '../store/deploymentSlice.js';
import {
  Lock,
  LayoutDashboard,
  Boxes,
  Server,
  FileCode2,
  Sliders,
  Camera,
  BookOpen,
  Network,
  Share2,
  FileText,
  CheckCircle2,
  Send,
  History,
  ShieldCheck,
  Cpu,
  Webhook,
  KeyRound,
  RefreshCw,
  Activity,
  Zap,
  Rocket,
  Package,
  GitBranch,
  CornerUpLeft,
} from 'lucide-react';

const PF_MAIN_TABS = [
  { id: 'platform-contract', label: 'Socle & Contrat v1', icon: Lock, aliases: ['platform-contract', 'contract-v1'] },
  { id: 'cockpit', label: 'Platform Cockpit', icon: LayoutDashboard, aliases: ['cockpit', 'overview'] },
  { id: 'applications', label: 'Applications & Versions', icon: Boxes, aliases: ['applications', 'workspace', 'versions', 'validation', 'publication'] },
  { id: 'environments', label: 'Environnements', icon: Server, aliases: ['environments'] },
  { id: 'contracts', label: 'Registre Contrats', icon: FileCode2, aliases: ['contracts'] },
  { id: 'config', label: 'Configuration Manager', icon: Sliders, aliases: ['config'] },
  { id: 'snapshots', label: 'Snapshots & Historique', icon: Camera, aliases: ['snapshots', 'history'] },
  { id: 'specifications', label: 'Index CDC & Specs', icon: BookOpen, aliases: ['specifications'] },
];

const API_MAIN_TABS = [
  { id: 'contracts-v1',  label: 'Socle & Contrat v1 🔒', icon: ShieldCheck, integrationTab: 'contracts-v1' },
  { id: 'cockpit',  label: 'Integration Cockpit', icon: LayoutDashboard, integrationTab: 'cockpit' },
  { id: 'connectors', label: 'Connecteurs', icon: Network, integrationTab: 'connectors' },
  { id: 'apis', label: 'APIs Exposées', icon: Cpu, integrationTab: 'apis' },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook, integrationTab: 'webhooks' },
  { id: 'credentials', label: 'Credentials & Secrets', icon: KeyRound, integrationTab: 'credentials' },
  { id: 'sync', label: 'Synchronisation', icon: RefreshCw, integrationTab: 'sync' },
  { id: 'diagnostics', label: 'Diagnostics & Traces', icon: Activity, integrationTab: 'diagnostics' },
  { id: 'specifications', label: 'Index CDC & Specs', icon: BookOpen, integrationTab: 'specifications' },
];

const DEP_MAIN_TABS = [
  { id: 'contracts-v1', label: 'Socle & Contrat v1 🔒', icon: ShieldCheck, depTab: 'contracts-v1' },
  { id: 'cockpit', label: 'Deployment Cockpit', icon: Rocket, depTab: 'cockpit' },
  { id: 'releases', label: 'Release Manager', icon: Package, depTab: 'releases' },
  { id: 'pipelines', label: 'Pipelines & Stratégies', icon: GitBranch, depTab: 'pipelines' },
  { id: 'promotions', label: 'Portes & Promotions', icon: CheckCircle2, depTab: 'promotions' },
  { id: 'rollback', label: 'Rollback & Reprise', icon: CornerUpLeft, depTab: 'rollback' },
  { id: 'diagnostics', label: 'Diagnostics & Traces', icon: Activity, depTab: 'diagnostics' },
  { id: 'specifications', label: 'Index CDC & Specs', icon: BookOpen, depTab: 'specifications' },
];

const APP_SUB_VIEWS = [
  { id: 'applications', label: 'Catalogue Applications', icon: Boxes },
  { id: 'workspace', label: 'Workspace & Configuration', icon: Share2 },
  { id: 'versions', label: 'Versions & Releases', icon: FileText },
  { id: 'validation', label: 'Cockpit de Validation', icon: CheckCircle2 },
  { id: 'publication', label: 'Publication & Déploiement', icon: Send },
];

const SNAPSHOT_SUB_VIEWS = [
  { id: 'snapshots', label: 'Registre des Snapshots Immuables', icon: Camera },
  { id: 'history', label: 'Historique & Rollback Logique', icon: History },
];

export default function SubNavBar() {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.platform.activeTab);
  const activeModuleId = useSelector((state) => state.platform.activeModuleId || '01');
  const activeIntegrationTab = useSelector((state) => state.integration?.activeIntegrationTab || 'cockpit');
  const activeDeploymentTab = useSelector((state) => state.deployment?.activeTab || 'cockpit');

  const isDepLayer = activeModuleId === 'dep-layer' || activeTab === 'deployment' || activeTab.startsWith('dep-');
  const isApiLayer = !isDepLayer && (activeModuleId === 'api-layer' || activeTab === 'integrations' || activeTab.startsWith('api-'));
  const isPFLayer = !isDepLayer && !isApiLayer;

  const isAppSubView = isPFLayer && ['applications', 'workspace', 'versions', 'validation', 'publication'].includes(activeTab);
  const isSnapshotSubView = isPFLayer && ['snapshots', 'history'].includes(activeTab);

  const handleSelectPFTab = (tabId) => {
    dispatch(setActiveModuleId('01'));
    dispatch(setActiveTab(tabId));
  };

  const handleSelectApiTab = (tab) => {
    dispatch(setActiveModuleId('api-layer'));
    dispatch(setActiveTab('integrations'));
    dispatch(setActiveIntegrationTab(tab.integrationTab));
  };

  const handleSelectDepTab = (tab) => {
    dispatch(setActiveModuleId('dep-layer'));
    dispatch(setActiveTab('deployment'));
    dispatch(setActiveDeploymentTab(tab.depTab));
  };

  return (
    <div className="w-full bg-white border-b border-slate-200/90 shadow-2xs sticky top-0 z-20">
      {/* Top Bar Switcher between Platform Foundation, API Integration Layer & DEP Publication */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-slate-800 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {/* Platform Foundation (1ère section) */}
          <button
            onClick={() => handleSelectPFTab('cockpit')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isPFLayer
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Platform Foundation</span>
            {/*<span className="text-[10px] font-mono px-1 py-0.2 rounded bg-blue-950 text-sky-300">
              PF-CDC
            </span>*/}
          </button>

          <span className="text-slate-600">/</span>

          {/* API Integration Layer (2ème section) */}
          <button
            onClick={() => {
              dispatch(setActiveModuleId('api-layer'));
              dispatch(setActiveTab('integrations'));
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isApiLayer
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <span>API_Integration_Layer</span>
            {/*<span className="text-[10px] font-mono px-1 py-0.2 rounded bg-indigo-950 text-indigo-300">
              API-CDC
            </span>*/}
          </button>

          <span className="text-slate-600">/</span>

          {/* DEP Publication (3ème section) */}
          <button
            onClick={() => {
              dispatch(setActiveModuleId('dep-layer'));
              dispatch(setActiveTab('deployment'));
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isDepLayer
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>DEP Publication</span>
            {/* <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-950 text-amber-300">
              DEP-CDC
            </span>*/}
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0 ml-4">
          <span>Architecture Team 4</span>
          <span>•</span>
          <span className="text-emerald-400 font-semibold">Contrats v1 🔒 Scellés</span>
        </div>
      </div>

      {/* Main Tabs Horizontal Row (Dynamic according to selected grand section) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          className="flex space-x-1 sm:space-x-2 overflow-x-auto scrollbar-none py-1.5 text-xs font-medium touch-pan-x"
          aria-label="Sous-sections"
        >
          {isDepLayer ? (
            /* DEP PUBLICATION TABS */
            DEP_MAIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeDeploymentTab === tab.depTab;

              return (
                <button
                  key={tab.id}
                  id={`subnav-dep-tab-${tab.id}`}
                  onClick={() => handleSelectDepTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 font-medium ${
                    isActive
                      ? 'bg-amber-50 text-amber-700 font-bold shadow-2xs border border-amber-200/80 ring-1 ring-amber-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.code}
                  </span>
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-amber-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })
          ) : isApiLayer ? (
            /* API INTEGRATION LAYER TABS */
            API_MAIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeIntegrationTab === tab.integrationTab;

              return (
                <button
                  key={tab.id}
                  id={`subnav-api-tab-${tab.id}`}
                  onClick={() => handleSelectApiTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 font-medium ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-bold shadow-2xs border border-indigo-200/80 ring-1 ring-indigo-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.code}
                  </span>
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })
          ) : (
            /* PLATFORM FOUNDATION TABS */
            PF_MAIN_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.aliases.includes(activeTab);

              return (
                <button
                  key={tab.id}
                  id={`subnav-pf-tab-${tab.id}`}
                  onClick={() => handleSelectPFTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-bold shadow-2xs border border-blue-200/80 ring-1 ring-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.code}
                  </span>
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="text-xs">{tab.label}</span>
                </button>
              );
            })
          )}
        </nav>
      </div>

      {/* Secondary Contextual Pills Bar for PF-02 (Applications) */}
      {isAppSubView && (
        <div className="bg-slate-50/80 border-t border-slate-200/70 py-1.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              PF-CDC-02 :
            </span>
            {APP_SUB_VIEWS.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeTab === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => dispatch(setActiveTab(sub.id))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSubActive
                      ? 'bg-white text-blue-700 font-bold shadow-2xs border border-blue-200'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  <SubIcon className={`w-3 h-3 ${isSubActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Secondary Contextual Pills Bar for PF-06 (Snapshots) */}
      {isSnapshotSubView && (
        <div className="bg-slate-50/80 border-t border-slate-200/70 py-1.5 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">
              PF-CDC-06 :
            </span>
            {SNAPSHOT_SUB_VIEWS.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeTab === sub.id;

              return (
                <button
                  key={sub.id}
                  onClick={() => dispatch(setActiveTab(sub.id))}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isSubActive
                      ? 'bg-white text-blue-700 font-bold shadow-2xs border border-blue-200'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'
                  }`}
                >
                  <SubIcon className={`w-3 h-3 ${isSubActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
