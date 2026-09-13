import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setActiveTab,
  setActiveModuleId,
  toggleSidebarCollapsed,
} from '../store/platformSlice.js';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  LayoutDashboard,
  Boxes,
  Server,
  FileCode2,
  Sliders,
  Camera,
  BookOpen,
  Network,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Webhook,
  KeyRound,
  RefreshCw,
  Activity,
  Zap,
  Rocket,
  Package,
  CornerUpLeft,
  GitBranch,
} from 'lucide-react';
import { setActiveIntegrationTab } from '../store/integrationSlice.js';
import { setActiveDeploymentTab } from '../store/deploymentSlice.js';

export const PF_SUBSECTIONS = [
  { id: 'platform-contract', name: 'Socle & Contrat v1 🔒', tab: 'platform-contract', icon: Lock, badge: 'LOCKED' },
  { id: 'cockpit',  name: 'Platform Cockpit', tab: 'cockpit', icon: LayoutDashboard },
  { id: 'applications', name: 'Applications & Versions', tab: 'applications', icon: Boxes },
  { id: 'environments', name: 'Environnements', tab: 'environments', icon: Server },
  { id: 'contracts', name: 'Registre Contrats', tab: 'contracts', icon: FileCode2 },
  { id: 'config', name: 'Configuration Manager', tab: 'config', icon: Sliders },
  { id: 'snapshots', name: 'Snapshots & Historique', tab: 'snapshots', icon: Camera },
  { id: 'specifications', name: 'Index CDC & Specs', tab: 'specifications', icon: BookOpen },
];

export const API_SUBSECTIONS = [
  { id: 'contracts-v1', name: 'Socle & Contrats v1 🔒', tab: 'integrations', integrationTab: 'contracts-v1', icon: ShieldCheck, badge: 'LOCKED' },
  { id: 'cockpit', name: 'Integration Cockpit', tab: 'integrations', integrationTab: 'cockpit', icon: LayoutDashboard },
  { id: 'connectors', name: 'Connecteurs Externes', tab: 'integrations', integrationTab: 'connectors', icon: Network },
  { id: 'apis', name: 'APIs Exposées', tab: 'integrations', integrationTab: 'apis', icon: Cpu },
  { id: 'webhooks', name: 'Webhooks Manager', tab: 'integrations', integrationTab: 'webhooks', icon: Webhook },
  { id: 'credentials', name: 'Credentials & Secrets', tab: 'integrations', integrationTab: 'credentials', icon: KeyRound },
  { id: 'sync', name: 'Synchronisation', tab: 'integrations', integrationTab: 'sync', icon: RefreshCw },
  { id: 'diagnostics', name: 'Logs & Diagnostics', tab: 'integrations', integrationTab: 'diagnostics', icon: Activity },
  { id: 'specifications', name: 'Index CDC & Specs', tab: 'integrations', integrationTab: 'specifications', icon: BookOpen },
];

export const DEP_SUBSECTIONS = [
  { id: 'contracts-v1', name: 'Socle & Contrat v1 🔒', tab: 'deployment', depTab: 'contracts-v1', icon: ShieldCheck, badge: 'LOCKED' },
  { id: 'cockpit', name: 'Deployment Cockpit', tab: 'deployment', depTab: 'cockpit', icon: Rocket },
  { id: 'releases', name: 'Release Manager', tab: 'deployment', depTab: 'releases', icon: Package },
  { id: 'pipelines', name: 'Pipelines & Stratégies', tab: 'deployment', depTab: 'pipelines', icon: GitBranch },
  { id: 'promotions', name: 'Portes & Promotions', tab: 'deployment', depTab: 'promotions', icon: CheckCircle2 },
  { id: 'rollback', name: 'Rollback & Reprise', tab: 'deployment', depTab: 'rollback', icon: CornerUpLeft },
  { id: 'diagnostics', name: 'Diagnostics & Audit', tab: 'deployment', depTab: 'diagnostics', icon: Activity },
  { id: 'specifications', name: 'Index CDC & Specs', tab: 'deployment', depTab: 'specifications', icon: BookOpen },
];

export default function Sidebar({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.platform.activeTab);
  const activeIntegrationTab = useSelector((state) => state.integration?.activeIntegrationTab || 'cockpit');
  const activeDeploymentTab = useSelector((state) => state.deployment?.activeTab || 'cockpit');
  const activeModuleId = useSelector((state) => state.platform.activeModuleId || '01');
  const sidebarCollapsed = useSelector((state) => state.platform.sidebarCollapsed);
  const activeUser = useSelector((state) => state.platform.activeUser);
  const platformContractLocked = useSelector((state) => state.platform.platformContractLocked);
  const integrationContractLocked = useSelector((state) => state.integration?.contractV1Locked);
  const deploymentContractLocked = useSelector((state) => state.deployment?.contractV1Locked);

  const isPFActive = activeModuleId === '01';
  const isApiActive = activeModuleId === 'api-layer' || activeTab === 'integrations' || activeTab.startsWith('api-');
  const isDepActive = activeModuleId === 'dep-layer' || activeTab === 'deployment' || activeTab.startsWith('dep-');

  const handleSelectPFMaster = () => {
    dispatch(setActiveModuleId('01'));
    if (activeTab === 'applications' || activeTab === 'cockpit' || activeTab === 'platform-contract') {
      // Keep
    } else {
      dispatch(setActiveTab('cockpit'));
    }
    if (onClose) onClose();
  };

  const handleSelectPFSubSection = (sub) => {
    dispatch(setActiveModuleId('01'));
    dispatch(setActiveTab(sub.tab));
    if (onClose) onClose();
  };

  const handleSelectApiMaster = () => {
    dispatch(setActiveModuleId('api-layer'));
    dispatch(setActiveTab('integrations'));
    if (onClose) onClose();
  };

  const handleSelectApiSubSection = (sub) => {
    dispatch(setActiveModuleId('api-layer'));
    dispatch(setActiveTab('integrations'));
    dispatch(setActiveIntegrationTab(sub.integrationTab));
    if (onClose) onClose();
  };

  const handleSelectDepMaster = () => {
    dispatch(setActiveModuleId('dep-layer'));
    dispatch(setActiveTab('deployment'));
    if (onClose) onClose();
  };

  const handleSelectDepSubSection = (sub) => {
    dispatch(setActiveModuleId('dep-layer'));
    dispatch(setActiveTab('deployment'));
    dispatch(setActiveDeploymentTab(sub.depTab));
    if (onClose) onClose();
  };

  // Check if activeTab belongs to PF-02 (Apps / Workspace / Versions / Validation / Publication)
  const isTabInPFSub = (subTab) => {
    if (subTab === 'applications') {
      return ['applications', 'workspace', 'versions', 'validation', 'publication'].includes(activeTab);
    }
    if (subTab === 'snapshots') {
      return ['snapshots', 'history'].includes(activeTab);
    }
    if (subTab === 'cockpit') {
      return ['cockpit', 'overview'].includes(activeTab);
    }
    if (subTab === 'platform-contract') {
      return ['platform-contract', 'contract-v1'].includes(activeTab);
    }
    return activeTab === subTab;
  };

  const isTabInApiSub = (sub) => {
    return isApiActive && activeIntegrationTab === sub.integrationTab;
  };

  const isTabInDepSub = (sub) => {
    return isDepActive && activeDeploymentTab === sub.depTab;
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-[#081026] text-slate-200 border-r border-slate-800/80 flex flex-col justify-between transition-all duration-250 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'lg:w-20' : 'w-72 lg:w-72'}`}
      >
        {/* Top Header: Logo, Title & Collapse Button */}
        <div className="shrink-0 p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Layers className="w-5 h-5 text-white" />
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0">
                <h1 className="font-bold text-white tracking-tight text-sm truncate">
                  Techzone Cloud
                </h1>
                <p className="text-[10px] text-sky-400 font-mono tracking-wider uppercase truncate">
                  Platform Foundation 
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            id="sidebar-collapse-toggle"
            onClick={() => dispatch(toggleSidebarCollapsed())}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title={sidebarCollapsed ? 'Agrandir le menu' : 'Réduire le menu'}
            aria-label="Basculer la barre latérale"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            title="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-2 sm:px-3 space-y-4 scrollbar-none">
          {/* GRANDE SECTION: PLATFORM FOUNDATION */}
          <div className="space-y-1.5">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>Platform Foundation</span>
                </span>
                {/*<span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">
                  PF-CDC
                </span>*/}
              </div>
            ) : (
              <div className="w-full flex justify-center py-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
            )}

            {/* Master Button for Platform Foundation */}
            <button
              id="sidebar-module-01"
              onClick={() => {
                dispatch(setActiveModuleId('01'));
                if (activeTab === 'applications' || activeTab === 'cockpit' || activeTab === 'platform-contract') {
                  // Keep
                } else {
                  dispatch(setActiveTab('cockpit'));
                }
                if (onClose) onClose();
              }}
              title={sidebarCollapsed ? 'Platform Foundation (Socle Commun)' : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group text-left cursor-pointer ${
                isPFActive
                  ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
            >
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold shrink-0 transition-transform ${
                  isPFActive ? 'bg-white text-blue-600' : 'bg-blue-600 text-white group-hover:scale-105'
                }`}
              >
                PF
              </span>

              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <span className="truncate font-semibold tracking-tight">Socle Commun Techzone</span>
                  {platformContractLocked && (
                    <span className="text-[10px] font-mono bg-blue-950 text-sky-300 px-1 rounded border border-blue-800/80">
                      v1 🔒
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* Sub-sections tree of Platform Foundation */}
            <div className={`space-y-0.5 ${sidebarCollapsed ? '' : 'pl-2 border-l border-slate-800/90 ml-3.5 my-1.5'}`}>
              {PF_SUBSECTIONS.map((sub) => {
                const isSelected = isPFActive && isTabInPFSub(sub.tab);
                const Icon = sub.icon;

                return (
                  <button
                    key={sub.id}
                    id={`sidebar-pf-sub-${sub.id}`}
                    onClick={() => handleSelectPFSubSection(sub)}
                    title={sidebarCollapsed ? `${sub.code} - ${sub.name}` : undefined}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer group ${
                      isSelected
                        ? 'bg-sky-500/20 text-sky-200 font-semibold border border-sky-500/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isSelected ? 'text-sky-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />

                    {!sidebarCollapsed && (
                      <div className="min-w-0 flex-1 flex items-center justify-between gap-1.5">
                        <span className="truncate text-[11.5px]">{sub.name}</span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1 rounded ${
                            isSelected
                              ? 'bg-sky-900/60 text-sky-300 border border-sky-600/40'
                              : 'bg-slate-900 text-slate-500 group-hover:text-slate-400'
                          }`}
                        >
                          {sub.code}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2ÈME GRANDE SECTION: API_INTEGRATION_LAYER */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/70">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Network className="w-3.5 h-3.5 text-indigo-400" />
                  <span>API_Integration_Layer</span>
                </span>
                {/*<span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-700/60">
                  API-CDC
                </span>*/}
              </div>
            ) : (
              <div className="w-full flex justify-center py-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>
            )}

            {/* Master Button for API Integration Layer */}
            <button
              id="sidebar-module-api"
              onClick={handleSelectApiMaster}
              title={sidebarCollapsed ? 'API / Integration Layer (Couche Intégrations)' : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group text-left cursor-pointer ${
                isApiActive
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
            >
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold shrink-0 transition-transform ${
                  isApiActive ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white group-hover:scale-105'
                }`}
              >
                API
              </span>

              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <span className="truncate font-semibold tracking-tight">API / Integration Layer</span>
                  {integrationContractLocked && (
                    <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-1 rounded border border-indigo-800/80">
                      v1 🔒
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* Sub-sections tree of API Integration Layer */}
            <div className={`space-y-0.5 ${sidebarCollapsed ? '' : 'pl-2 border-l border-indigo-950 ml-3.5 my-1.5'}`}>
              {API_SUBSECTIONS.map((sub) => {
                const isSelected = isTabInApiSub(sub);
                const Icon = sub.icon;

                return (
                  <button
                    key={sub.id}
                    id={`sidebar-api-sub-${sub.id}`}
                    onClick={() => handleSelectApiSubSection(sub)}
                    title={sidebarCollapsed ? `${sub.code} - ${sub.name}` : undefined}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer group ${
                      isSelected
                        ? 'bg-indigo-500/25 text-indigo-200 font-semibold border border-indigo-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isSelected ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />

                    {!sidebarCollapsed && (
                      <div className="min-w-0 flex-1 flex items-center justify-between gap-1.5">
                        <span className="truncate text-[11.5px]">{sub.name}</span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1 rounded ${
                            isSelected
                              ? 'bg-indigo-900/80 text-indigo-300 border border-indigo-600/50'
                              : 'bg-slate-900 text-slate-500 group-hover:text-slate-400'
                          }`}
                        >
                          {sub.code}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3ÈME GRANDE SECTION: DEP PUBLICATION */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/70">
            {!sidebarCollapsed ? (
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-amber-400" />
                  <span>DEP Publication</span>
                </span>
                {/*<span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
                  DEP-CDC
                </span>*/}
              </div>
            ) : (
              <div className="w-full flex justify-center py-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
            )}

            {/* Master Button for DEP Publication */}
            <button
              id="sidebar-module-dep"
              onClick={handleSelectDepMaster}
              title={sidebarCollapsed ? 'DEP Publication (Déploiement & Publication)' : undefined}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all group text-left cursor-pointer ${
                isDepActive
                  ? 'bg-amber-600 text-white font-semibold shadow-md shadow-amber-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
            >
              <span
                className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-[11px] font-bold shrink-0 transition-transform ${
                  isDepActive ? 'bg-white text-amber-600' : 'bg-amber-600 text-white group-hover:scale-105'
                }`}
              >
                DEP
              </span>

              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1 flex items-center justify-between">
                  <span className="truncate font-semibold tracking-tight">DEP Publication</span>
                  {deploymentContractLocked && (
                    <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-1 rounded border border-amber-800/80">
                      v1 🔒
                    </span>
                  )}
                </div>
              )}
            </button>

            {/* Sub-sections tree of DEP Publication */}
            <div className={`space-y-0.5 ${sidebarCollapsed ? '' : 'pl-2 border-l border-amber-950 ml-3.5 my-1.5'}`}>
              {DEP_SUBSECTIONS.map((sub) => {
                const isSelected = isTabInDepSub(sub);
                const Icon = sub.icon;

                return (
                  <button
                    key={sub.id}
                    id={`sidebar-dep-sub-${sub.id}`}
                    onClick={() => handleSelectDepSubSection(sub)}
                    title={sidebarCollapsed ? `${sub.code} - ${sub.name}` : undefined}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer group ${
                      isSelected
                        ? 'bg-amber-500/25 text-amber-200 font-semibold border border-amber-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                  >
                    <Icon
                      className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                        isSelected ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />

                    {!sidebarCollapsed && (
                      <div className="min-w-0 flex-1 flex items-center justify-between gap-1.5">
                        <span className="truncate text-[11.5px]">{sub.name}</span>
                        <span
                          className={`text-[9px] font-mono font-bold px-1 rounded ${
                            isSelected
                              ? 'bg-amber-900/80 text-amber-300 border border-amber-600/50'
                              : 'bg-slate-900 text-slate-500 group-hover:text-slate-400'
                          }`}
                        >
                          {sub.code}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Bottom User Card matching Screenshot */}
        <div className="shrink-0 p-3 border-t border-slate-800/80 bg-[#060D20]">
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800 transition-colors ${
              sidebarCollapsed ? 'justify-center p-1.5' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
              RA
            </div>

            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {activeUser?.name || 'Ranja Avo Efraim'}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
                  <span className="truncate">Administrateur</span>
                  <span className="px-1.5 py-0.2 rounded bg-blue-950 text-sky-400 border border-blue-900/60 font-mono shrink-0 ml-1">
                    Enterprise
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
