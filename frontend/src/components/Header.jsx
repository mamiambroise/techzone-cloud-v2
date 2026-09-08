import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setActiveTenant,
  setActiveUser,
  setSearchQuery,
  dismissAlert,
  addToast,
  IAM_ROLES,
  TENANTS,
} from '../store/platformSlice.js';
import GlobalSearch from './GlobalSearch.jsx';
import {
  Menu,
  Bell,
  Clock,
  HelpCircle,
  Search,
  ChevronDown,
  X,
  UserCheck,
  Building2,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';

export default function Header({ onToggleMobileSidebar, onOpenNewApp }) {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.platform.activeTab);
  const activeIntegrationTab = useSelector((state) => state.integration?.activeIntegrationTab || 'cockpit');
  const activeDeploymentTab = useSelector((state) => state.deployment?.activeTab || 'cockpit');
  const activeModuleId = useSelector((state) => state.platform.activeModuleId || '01');
  const activeUser = useSelector((state) => state.platform.activeUser);
  const activeTenant = useSelector((state) => state.platform.activeTenant);
  const searchQuery = useSelector((state) => state.platform.searchQuery);
  const alerts = useSelector((state) => state.platform.alerts || []);

  const [showAlertsMenu, setShowAlertsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [currentTime, setCurrentTime] = useState('14:56');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSectionInfo = () => {
    const isDepLayer = activeModuleId === 'dep-layer' || activeTab === 'deployment' || activeTab.startsWith('dep-');
    const isApiLayer = !isDepLayer && (activeModuleId === 'api-layer' || activeTab === 'integrations' || activeTab.startsWith('api-'));

    if (isDepLayer) {
      switch (activeDeploymentTab) {
        case 'contracts-v1':
          return { section: 'DEP Publication', cdc: 'DEP-CDC-00', title: 'Socle & Deployment Contracts v1 🔒', color: 'amber' };
        case 'cockpit':
          return { section: 'DEP Publication', cdc: 'DEP-CDC-01', title: 'Deployment Cockpit', color: 'amber' };
        case 'releases':
          return { section: 'DEP Publication', cdc: 'DEP-CDC-02', title: 'Release Manager & Manifest Sealing', color: 'amber' };
        case 'pipelines':
          return { section: 'DEP Publication', cdc: 'DEP-CDC-03', title: 'Pipelines & Stratégies de Déploiement', color: 'amber' };
        case 'promotions':
          return { section: 'DEP Publication', cdc: 'DEP-CDC-04', title: 'Portes de Sécurité & Promotions', color: 'amber' };
        case 'rollback':
          return { section: 'DEP Publication', cdc: 'DEP-CDC-05', title: 'Rollback Logique & Disaster Recovery', color: 'amber' };
        case 'diagnostics':
          return { section: 'DEP Publication', cdc: 'DEP-CDC-06', title: 'Diagnostics & Audit Trail', color: 'amber' };
        case 'specifications':
          return { section: 'DEP Publication', cdc: 'DEP-DOC', title: 'Index des CDC (DEP-CDC-00 à 06)', color: 'amber' };
        default:
          return { section: 'DEP Publication', cdc: 'DEP-CDC', title: 'Déploiement & Publication', color: 'amber' };
      }
    }

    if (isApiLayer) {
      switch (activeIntegrationTab) {
        case 'contracts-v1':
          return { section: 'API_Integration_Layer', cdc: 'API-CDC-00', title: 'Socle & Integration Contracts v1 🔒', color: 'indigo' };
        case 'cockpit':
          return { section: 'API_Integration_Layer', cdc: 'API-CDC-01', title: 'Vue d’ensemble / Integration Cockpit', color: 'indigo' };
        case 'connectors':
          return { section: 'API_Integration_Layer', cdc: 'API-CDC-02', title: 'Connector Manager', color: 'indigo' };
        case 'apis':
          return { section: 'API_Integration_Layer', cdc: 'API-CDC-03', title: 'API Manager', color: 'indigo' };
        case 'webhooks':
          return { section: 'API_Integration_Layer', cdc: 'API-CDC-04', title: 'Webhook Manager', color: 'indigo' };
        case 'credentials':
          return { section: 'API_Integration_Layer', cdc: 'API-CDC-05', title: 'Credentials & Secrets Manager', color: 'indigo' };
        case 'sync':
          return { section: 'API_Integration_Layer', cdc: 'API-CDC-06', title: 'Synchronization Manager', color: 'indigo' };
        case 'diagnostics':
          return { section: 'API_Integration_Layer', cdc: 'API-CDC-07', title: 'Integration Logs & Diagnostics', color: 'indigo' };
        case 'specifications':
          return { section: 'API_Integration_Layer', cdc: 'API-DOC', title: 'Index des CDC (API-CDC-00 à 07)', color: 'indigo' };
        default:
          return { section: 'API_Integration_Layer', cdc: 'API-CDC', title: 'Couche Intégrations', color: 'indigo' };
      }
    }

    switch (activeTab) {
      case 'platform-contract':
      case 'contract-v1':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-00', title: 'Socle & Platform Contract v1 🔒', color: 'blue' };
      case 'cockpit':
      case 'overview':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-01', title: 'Platform Cockpit', color: 'blue' };
      case 'applications':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-02', title: 'Catalogue Applications', color: 'blue' };
      case 'workspace':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-02', title: 'Workspace & Configuration', color: 'blue' };
      case 'versions':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-02', title: 'Versions & Releases', color: 'blue' };
      case 'validation':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-02', title: 'Cockpit de Validation', color: 'blue' };
      case 'publication':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-02', title: 'Publication & Déploiement', color: 'blue' };
      case 'environments':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-03', title: 'Environnements', color: 'blue' };
      case 'contracts':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-04', title: 'Registre de Contrats', color: 'blue' };
      case 'config':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-05', title: 'Configuration Manager', color: 'blue' };
      case 'snapshots':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-06', title: 'Snapshots Immuables', color: 'blue' };
      case 'history':
        return { section: 'Platform Foundation', cdc: 'PF-CDC-06', title: 'Historique & Rollback', color: 'blue' };
      case 'specifications':
        return { section: 'Platform Foundation', cdc: 'PF-DOC', title: 'Index des CDC (PF-00 à 06)', color: 'blue' };
      default:
        return { section: 'Platform Foundation', cdc: 'PF-CDC', title: 'Platform Foundation', color: 'blue' };
    }
  };

  const sectionInfo = getSectionInfo();

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-2xs">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Left: Hamburger (mobile) + Badge PF/API + Breadcrumb */}
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Hamburger Button */}
            <button
              id="mobile-menu-toggle-btn"
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
              title="Ouvrir le menu"
              aria-label="Ouvrir le menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb with category and CDC badge */}
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs shrink-0 flex items-center gap-1 ${
                  sectionInfo.color === 'amber'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : sectionInfo.color === 'indigo'
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                <Shield
                  className={`w-3 h-3 ${
                    sectionInfo.color === 'amber'
                      ? 'text-amber-600'
                      : sectionInfo.color === 'indigo'
                      ? 'text-indigo-600'
                      : 'text-blue-600'
                  }`}
                />
                <span>{sectionInfo.cdc}</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="text-xs font-semibold text-slate-500 uppercase font-mono hidden sm:inline truncate">
                {sectionInfo.section}
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight truncate uppercase font-mono">
                {sectionInfo.title}
              </h1>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="flex-1 max-w-sm lg:max-w-md hidden md:block">
            <GlobalSearch />
          </div>

          {/* Right: Notifications (3), Clock, Help, User RA */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Mobile Search Icon */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
              title="Rechercher"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Live Clock */}
            <div className="hidden sm:flex items-center gap-1 text-xs font-mono font-semibold text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentTime}</span>
            </div>

            {/* Help Button */}
            <button
              id="help-button"
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'info',
                    title: 'Centre d\'aide P0.1',
                    message:
                      'Documentation normative PM-CDC et guides de composition des packs disponibles.',
                  })
                )
              }
              className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center text-xs font-bold transition-colors"
              title="Centre d'aide & Documentation"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                id="notifications-btn"
                onClick={() => setShowAlertsMenu(!showAlertsMenu)}
                className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                title="Notifications système"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-600 text-white font-mono text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {alerts.length}
                  </span>
                )}
              </button>

              {showAlertsMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <span>Notifications & Alertes ({alerts.length})</span>
                    </div>
                    <button
                      onClick={() => setShowAlertsMenu(false)}
                      className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                    {alerts.map((a) => (
                      <div
                        key={a.id}
                        className="p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 bg-slate-50 border-slate-200"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{a.title}</div>
                          <div className="text-[11px] text-slate-600 mt-0.5">{a.message}</div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">{a.code}</div>
                        </div>
                        <button
                          onClick={() => dispatch(dismissAlert(a.id))}
                          className="text-slate-400 hover:text-slate-600 shrink-0 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile RA & Context Switcher */}
            <div className="relative">
              <button
                id="user-profile-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-md bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  RA
                </div>
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-bold text-slate-900 leading-none">
                    {activeUser?.name || 'Ranja Avo Efraim'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
                    Administrateur
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 space-y-3">
                  <div className="border-b border-slate-100 pb-2">
                    <div className="font-bold text-slate-900 text-xs">{activeUser?.name}</div>
                    <div className="text-[11px] text-slate-500">{activeUser?.email}</div>
                    <div className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-mono font-semibold">
                      {activeUser?.role}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Rôle IAM (Simulation)
                    </label>
                    <select
                      value={activeUser?.id}
                      onChange={(e) => {
                        const selected = Object.values(IAM_ROLES).find(
                          (r) => r.id === e.target.value
                        );
                        if (selected) {
                          dispatch(setActiveUser(selected));
                          dispatch(
                            addToast({
                              type: 'info',
                              title: 'Contexte IAM basculé',
                              message: `Rôle actif: ${selected.role} (${selected.name})`,
                            })
                          );
                        }
                      }}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                    >
                      {Object.values(IAM_ROLES).map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name} ({role.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-xs pt-1 border-t border-slate-100">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Tenant Actif
                    </label>
                    <select
                      value={activeTenant}
                      onChange={(e) => dispatch(setActiveTenant(e.target.value))}
                      className="w-full py-1.5 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden"
                    >
                      {TENANTS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.code} - {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Overlay */}
        {showMobileSearch && (
          <div className="md:hidden pb-3 pt-1 border-t border-slate-100">
            <GlobalSearch isMobileExpanded onCloseMobile={() => setShowMobileSearch(false)} />
          </div>
        )}
      </div>
    </header>
  );
}
