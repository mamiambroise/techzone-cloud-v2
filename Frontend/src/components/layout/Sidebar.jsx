// Sidebar.jsx — Authentic Techzone Cloud Business Manager Navigation (Exact Replica of Screenshots 1, 2, 3)
import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  LogOut,
  Shield,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

// 18 Standard Modules (PM-CDC & Business Manager specification)
export const MENU_MODULES = [
  {
    id: '01',
    code: '01',
    label: 'Application / Pack Manager',
    badgeColor: 'bg-[#1E62EC]', // Royal Blue
    activeColor: 'bg-[#132A55]',
    views: [
      'pack-overview',
      'applications',
      'application-detail',
      'new-application',
      'configuration',
      'pack-versions',
      'packs',
      'overview',
      'iam-overview',
    ],
    primaryView: 'pack-overview',
    hasSubMenu: true,
  },
  {
    id: '02',
    code: '02',
    label: 'Data Model Manager',
    badgeColor: 'bg-[#10B981]', // Emerald green
    activeColor: 'bg-[#0F3528]',
    views: ['data-model'],
    primaryView: 'data-model',
  },
  {
    id: '03',
    code: '03',
    label: 'Feature & Capability Manager',
    badgeColor: 'bg-[#F59E0B]', // Amber orange
    activeColor: 'bg-[#3D2D0C]',
    views: ['features'],
    primaryView: 'features',
  },
  {
    id: '04',
    code: '04',
    label: 'Menu Engine',
    badgeColor: 'bg-[#8B5CF6]', // Purple
    activeColor: 'bg-[#2A1D4E]',
    views: ['menus'],
    primaryView: 'menus',
  },
  {
    id: '05',
    code: '05',
    label: 'Page & UI Builder',
    badgeColor: 'bg-[#0EA5E9]', // Sky blue / Cyan
    activeColor: 'bg-[#0E2D44]',
    views: ['pack-modules', 'ui-builder'],
    primaryView: 'pack-modules',
  },
  {
    id: '06',
    code: '06',
    label: 'Form Engine',
    badgeColor: 'bg-[#14B8A6]', // Teal
    activeColor: 'bg-[#0D3330]',
    views: ['form-engine'],
    primaryView: 'data-model',
  },
  {
    id: '07',
    code: '07',
    label: 'Dashboard Engine',
    badgeColor: 'bg-[#F43F5E]', // Coral / Red
    activeColor: 'bg-[#3D141E]',
    views: ['dashboard-engine', 'overview'],
    primaryView: 'overview',
  },
  {
    id: '08',
    code: '08',
    label: 'Query Engine',
    badgeColor: 'bg-[#3B82F6]', // Blue
    activeColor: 'bg-[#122B52]',
    views: ['query-engine'],
    primaryView: 'e2e-bench',
  },
  {
    id: '09',
    code: '09',
    label: 'Rule & Formula Engine',
    badgeColor: 'bg-[#EC4899]', // Magenta / Pink
    activeColor: 'bg-[#3E142B]',
    views: ['pack-rules', 'rules'],
    primaryView: 'pack-rules',
  },
  {
    id: '10',
    code: '10',
    label: 'Workflow Engine',
    badgeColor: 'bg-[#10B981]', // Green
    activeColor: 'bg-[#0F3528]',
    views: ['workflow-engine', 'workflows'],
    primaryView: 'integrations',
  },
  {
    id: '11',
    code: '11',
    label: 'Automation Engine',
    badgeColor: 'bg-[#F59E0B]', // Amber orange
    activeColor: 'bg-[#3D2D0C]',
    views: ['automation-engine', 'integrations'],
    primaryView: 'integrations',
  },
  {
    id: '12',
    code: '12',
    label: 'Version & Sandbox Manager',
    badgeColor: 'bg-[#3B82F6]', // Blue
    activeColor: 'bg-[#122B52]',
    views: ['versions', 'pack-versions'],
    primaryView: 'versions',
  },
  {
    id: '13',
    code: '13',
    label: 'Publication & Rollback Manager',
    badgeColor: 'bg-[#6366F1]', // Indigo / Purple
    activeColor: 'bg-[#222152]',
    views: ['packs', 'publication'],
    primaryView: 'packs',
  },
  {
    id: '14',
    code: '14',
    label: 'Audit & Health',
    badgeColor: 'bg-[#14B8A6]', // Teal green
    activeColor: 'bg-[#0D3330]',
    views: ['audit', 'iam-overview'],
    primaryView: 'audit',
  },
  {
    id: '15',
    code: '15',
    label: 'Approval Engine',
    badgeColor: 'bg-[#F59E0B]', // Amber yellow
    activeColor: 'bg-[#3D2D0C]',
    views: ['validation'],
    primaryView: 'validation',
  },
  {
    id: '16',
    code: '16',
    label: 'Report & Document Builder',
    badgeColor: 'bg-[#0EA5E9]', // Sky blue
    activeColor: 'bg-[#0E2D44]',
    views: ['reports', 'documents'],
    primaryView: 'e2e-bench',
  },
  {
    id: '17',
    code: '17',
    label: 'Notification Manager',
    badgeColor: 'bg-[#F43F5E]', // Rose red
    activeColor: 'bg-[#3D141E]',
    views: ['notifications'],
    primaryView: 'configuration',
  },
  {
    id: '18',
    code: '18',
    label: 'Extension & Template Manager',
    badgeColor: 'bg-[#059669]', // Deep emerald
    activeColor: 'bg-[#0A3022]',
    views: ['pack-dependencies', 'templates'],
    primaryView: 'pack-dependencies',
  },
];

export function Sidebar({ collapsed, onToggleCollapse, onCloseMobile, isMobileDrawer }) {
  const { currentView, setCurrentView, currentUser, logout, currentRole, setCurrentRole, showToast } = useApp();

  const [expandedModuleId, setExpandedModuleId] = useState('01');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleNav = (view) => {
    setCurrentView(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleModuleClick = (mod) => {
    if (mod.hasSubMenu) {
      if (expandedModuleId === mod.id) {
        // toggle collapse if already expanded
        setExpandedModuleId(null);
      } else {
        setExpandedModuleId(mod.id);
      }
    }
    handleNav(mod.primaryView);
  };

  const isModuleActive = (mod) => {
    return mod.views.includes(currentView);
  };

  return (
    <aside
      className={`h-screen flex flex-col bg-[#0A1329] text-slate-300 border-r border-[#162238] transition-all duration-200 flex-shrink-0 select-none z-30 ${
        isMobileDrawer ? 'w-64 max-w-[85vw]' : collapsed ? 'w-14' : 'w-56 lg:w-60'
      }`}
    >
      {/* 1. Header Brand (Business Manager / CENTRAL PACK ENGINE) */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-[#162238]/80 bg-[#0A1329] flex-shrink-0">
        {(!collapsed || isMobileDrawer) && (
          <div
            onClick={() => handleNav('pack-overview')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            {/* 3D Layered Isometric Logo Icon */}
            <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-center text-white shadow-xs flex-shrink-0 group-hover:border-blue-500 transition-colors">
              <svg
                className="w-4 h-4 text-white stroke-[1.8]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="font-bold text-white text-[13px] leading-tight block truncate tracking-tight">
                Business Manager
              </span>
              <span className="text-[8.5px] text-slate-400 font-semibold tracking-wider uppercase block truncate mt-0.5">
                CENTRAL PACK ENGINE
              </span>
            </div>
          </div>
        )}

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Fermer le menu"
            aria-label="Fermer le menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Desktop collapse toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:block p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}
        >
          {collapsed ? <ChevronsRight className="w-3.5 h-3.5" /> : <ChevronsLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* 2. Main Menu Section Title */}
      {(!collapsed || isMobileDrawer) && (
        <div className="px-3 pt-2.5 pb-1 flex-shrink-0">
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            MENU PRINCIPAL
          </p>
        </div>
      )}

      {/* 3. Scrollable List of 18 Numbered Modules */}
      <div className="flex-1 overflow-y-auto px-1.5 py-0.5 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800">
        {MENU_MODULES.map((mod) => {
          const active = isModuleActive(mod);
          const isExpanded = expandedModuleId === mod.id && (!collapsed || isMobileDrawer);

          return (
            <div key={mod.id} className="space-y-0.5">
              <button
                onClick={() => handleModuleClick(mod)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11.5px] transition-all duration-150 group min-h-[30px] ${
                  active
                    ? 'bg-[#152B52] text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/40 font-medium'
                } ${collapsed && !isMobileDrawer ? 'justify-center px-0' : ''}`}
                title={mod.label}
              >
                {/* Numbered Circular Badge */}
                <span
                  className={`w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold text-[9px] text-white flex-shrink-0 shadow-xs ${mod.badgeColor}`}
                >
                  {mod.code}
                </span>

                {/* Module Label */}
                {(!collapsed || isMobileDrawer) && (
                  <span className="truncate flex-1 text-left leading-tight">{mod.label}</span>
                )}

                {/* Chevron icon for active/submenu module */}
                {(!collapsed || isMobileDrawer) && mod.hasSubMenu && (
                  <ChevronDown
                    className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${
                      isExpanded ? 'rotate-0' : '-rotate-90 text-slate-500'
                    }`}
                  />
                )}
              </button>

              {/* Sub-menu if Module 01 is expanded */}
              {isExpanded && mod.id === '01' && (
                <div className="pl-4 pr-1 py-0.5 space-y-0.5 border-l border-blue-500/25 ml-4 my-0.5">
                  <button
                    onClick={() => handleNav('pack-overview')}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-[10.5px] transition-colors ${
                      currentView === 'pack-overview'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                    <span className="truncate">Vue générale (P0.1)</span>
                  </button>

                  <button
                    onClick={() => handleNav('applications')}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-[10.5px] transition-colors ${
                      currentView === 'applications' || currentView === 'application-detail'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    <span className="truncate">Applications</span>
                  </button>

                  <button
                    onClick={() => handleNav('configuration')}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-[10.5px] transition-colors ${
                      currentView === 'configuration'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span className="truncate">Workspace & Configuration</span>
                  </button>

                  <button
                    onClick={() => handleNav('pack-versions')}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-[10.5px] transition-colors ${
                      currentView === 'pack-versions' || currentView === 'versions'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    <span className="truncate">Versions & Drafts</span>
                  </button>

                  <button
                    onClick={() => handleNav('validation')}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-[10.5px] transition-colors ${
                      currentView === 'validation'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                    <span className="truncate">Validation & Homologation</span>
                  </button>

                  <button
                    onClick={() => handleNav('packs')}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-[10.5px] transition-colors ${
                      currentView === 'packs'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                    <span className="truncate">Publication & Packages</span>
                  </button>

                  <button
                    onClick={() => handleNav('iam-overview')}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-[10.5px] transition-colors ${
                      currentView === 'iam-overview'
                        ? 'bg-purple-600 text-white font-bold'
                        : 'text-purple-300/80 hover:text-purple-200 hover:bg-purple-950/40'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                    <span className="truncate">Global Status IAM (CDC-01)</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 4. Bottom User Profile Block (Matches Screenshot 1, 2, 3) */}
      <div className="relative border-t border-[#162238] bg-[#0A1329] p-2 flex-shrink-0">
        <div
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className={`flex items-center justify-between gap-2 p-1 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer min-h-[38px] ${
            collapsed && !isMobileDrawer ? 'justify-center' : ''
          }`}
          title={`${currentUser.name || 'Ranja Avo Efraim'} (${currentUser.role || 'ADMIN'})`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* RA Circle Avatar */}
            <div className="w-7.5 h-7.5 rounded-full bg-[#1E293B] border border-slate-600 text-white flex items-center justify-center font-bold text-[11px] flex-shrink-0 shadow-inner">
              {currentUser.avatarInitials || 'RA'}
            </div>

            {(!collapsed || isMobileDrawer) && (
              <div className="min-w-0 text-left">
                <p className="text-[11.5px] font-bold text-white truncate leading-tight">
                  {currentUser.name || 'Ranja Avo Efraim'}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate leading-tight mt-0.5">
                  {currentUser.role === 'ADMIN'
                    ? 'Administrateur'
                    : currentUser.role === 'BUILDER'
                    ? 'Builder Studio'
                    : 'Lecteur Invité'}
                </p>
              </div>
            )}
          </div>

          {(!collapsed || isMobileDrawer) && (
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                showUserDropdown ? 'rotate-180 text-white' : ''
              }`}
            />
          )}
        </div>

        {/* User Context & Action Dropdown */}
        {showUserDropdown && (!collapsed || isMobileDrawer) && (
          <div className="absolute bottom-full left-2 right-2 mb-1.5 p-1.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-0.5 text-xs z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="p-1.5 border-b border-slate-800 text-[10.5px]">
              <span className="text-slate-400 block">Compte connecté :</span>
              <span className="font-bold text-white block truncate">{currentUser.email || 'admin@techzone.io'}</span>
            </div>

            <button
              onClick={() => {
                handleNav('iam-overview');
                setShowUserDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left text-[11px]"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Gouvernance IAM & Sécurité</span>
            </button>

            <button
              onClick={() => {
                logout();
                setShowUserDropdown(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors text-left text-[11px]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se déconnecter</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
