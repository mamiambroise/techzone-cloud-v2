// Header.jsx — Top Navigation Bar matching Techzone Cloud UI
import React, { useState } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Settings,
  Menu,
  ChevronDown,
  Shield,
  CheckCircle,
  Database,
  ExternalLink,
  Sparkles,
  LogOut,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ROLES } from '../../types/domain';

export function Header({
  onToggleSidebar,
  onToggleDesktopSidebar,
  isSidebarCollapsed,
  onOpenHelp,
  onOpenSettings,
}) {
  const {
    currentUser,
    currentRole,
    setCurrentRole,
    globalSearch,
    setGlobalSearch,
    currentTenant,
    showToast,
    setCurrentView,
    logout,
    sessionRemainingSeconds = 900,
    resetInactivityTimer,
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Format session timeout (MM:SS)
  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isLowTime = sessionRemainingSeconds <= 120; // Last 2 minutes

  const handleRoleSelect = (newRole) => {
    setCurrentRole(newRole);
    setShowRoleMenu(false);
    showToast(`Rôle basculé vers : ${newRole}`);
  };

  return (
    <header className="h-14 bg-white border-b border-slate-200/80 px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 z-20">
      {/* Left: Mobile Drawer Button & Section Indicator (Matching Screenshot 1, 2, 3) */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors md:hidden min-w-[36px] min-h-[36px] flex items-center justify-center flex-shrink-0"
          title="Menu de navigation"
          aria-label="Ouvrir le menu de navigation"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* P0.1 APPLICATION / PACK MANAGER Title Pill from Screenshots */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-xs sm:text-[13px] font-black text-blue-600 tracking-tight font-mono">
            P0.1
          </span>
          <span className="text-xs sm:text-[13px] font-bold text-slate-900 uppercase tracking-tight truncate">
            APPLICATION / PACK MANAGER
          </span>
        </div>
      </div>

      {/* Right: Actions, Notifications & IAM User Switcher */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Notifications Icon with Badge */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (showRoleMenu) setShowRoleMenu(false);
            }}
            className="relative p-1.5 sm:p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 w-3.5 h-3.5 rounded-full bg-red-500 text-white text-[8.5px] font-black flex items-center justify-center ring-1.5 ring-white">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 sm:right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-100 shadow-2xl p-3 sm:p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-extrabold text-slate-900">Notifications Plateforme</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">4 non lues</span>
              </div>
              <div className="space-y-2 text-xs max-h-72 overflow-y-auto pr-1">
                <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100">
                  <p className="font-bold text-blue-950">Publication réussie</p>
                  <p className="text-[11px] text-blue-800">Boutique Premium E2E v1.2.0 déployée sur PRODUCTION.</p>
                  <span className="text-[9px] text-slate-400 mt-1 block">Il y a 10 min</span>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                  <p className="font-bold text-amber-950">Validation requise</p>
                  <p className="text-[11px] text-amber-800">Garage Automobile v0.5.0 prête pour validation.</p>
                  <span className="text-[9px] text-slate-400 mt-1 block">Il y a 45 min</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-bold text-slate-800">Snapshot déterministe généré</p>
                  <p className="text-[11px] text-slate-500">Hash vérifié : h_a1b2c3d4e5f6</p>
                  <span className="text-[9px] text-slate-400 mt-1 block">Hier</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Session Inactivity Auto-Logout Timer Pill (15-min idle protection) */}
        <div className="hidden md:flex items-center">
          <button
            onClick={() => {
              resetInactivityTimer();
              showToast('Session prolongée avec succès (15 min réinitialisées).');
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
              isLowTime
                ? 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
            }`}
            title="Temps restant avant déconnexion automatique d'inactivité (Cliquer pour prolonger)"
          >
            <Clock className={`w-3.5 h-3.5 ${isLowTime ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="font-mono text-[11px] font-bold">
              {formatTimer(sessionRemainingSeconds)}
            </span>
            <RotateCcw className="w-3 h-3 opacity-60 hover:opacity-100 ml-0.5" />
          </button>
        </div>

        {/* Documentation / Help Button */}
        <button
          onClick={onOpenHelp}
          className="p-1.5 sm:p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Spécifications & Architecture (BM-CDC-00 / 01 / 02)"
          aria-label="Aide et spécifications"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 sm:p-2 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
          title="Paramètres de plateforme & IAM"
          aria-label="Paramètres de plateforme"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* IAM User Profile Pill & Role Switcher */}
        <div className="relative pl-0.5 sm:pl-1">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              if (showNotifications) setShowNotifications(false);
            }}
            className="flex items-center gap-1.5 sm:gap-2 py-0.5 px-1.5 sm:px-2 rounded-full hover:bg-slate-50 border border-slate-200/80 transition-all text-left min-h-[36px]"
            title={`Utilisateur: ${currentUser.name}`}
            aria-label="Menu utilisateur et rôles"
          >
            <div className="hidden lg:block text-right pr-1">
              <p className="text-[11.5px] font-extrabold text-slate-900 leading-tight truncate max-w-[130px]">
                {currentUser.name}
              </p>
              <p className="text-[9.5px] text-slate-500 font-semibold leading-tight flex items-center justify-end gap-1">
                <span>{currentRole === 'ADMIN' ? 'Super Admin' : currentRole === 'BUILDER' ? 'Builder Studio' : 'Lecteur'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </p>
            </div>
            <div className="w-7.5 h-7.5 rounded-full bg-slate-800 border border-slate-600 text-white flex items-center justify-center font-black text-[11px] ring-2 ring-slate-100 flex-shrink-0">
              {currentUser.avatarInitials || 'RA'}
            </div>
          </button>

          {/* Role Dropdown */}
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white border border-slate-100 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1.5">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Contexte IAM Authentifié (BM-CDC-00)
                </p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">{currentTenant.name}</p>
                <p className="text-[10px] font-mono text-slate-400 truncate">{currentUser.id}</p>
              </div>

              <div className="space-y-1">
                {[
                  { role: ROLES.ADMIN, label: 'Super Administrateur', desc: 'Droits complets (Créer, Modifier, Publier, Rollback)' },
                  { role: ROLES.BUILDER, label: 'Builder / Éditeur', desc: 'Création & configuration (sans suppression critique)' },
                  { role: ROLES.VIEWER, label: 'Lecteur Invité (Read-Only)', desc: 'Consultation uniquement' },
                ].map((item) => (
                  <button
                    key={item.role}
                    onClick={() => handleRoleSelect(item.role)}
                    className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start justify-between min-h-[44px] ${
                      currentRole === item.role
                        ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="block font-bold">{item.label}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{item.desc}</span>
                    </div>
                    {currentRole === item.role && (
                      <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 ml-2" />
                    )}
                  </button>
                ))}
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    logout();
                  }}
                  className="w-full text-left p-2 rounded-xl text-xs text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 font-semibold min-h-[40px]"
                >
                  <LogOut className="w-4 h-4 text-red-500" />
                  <span>Se déconnecter (Login Techzone)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
