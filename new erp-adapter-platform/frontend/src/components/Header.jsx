import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BookOpenIcon,
  BellIcon,
  ChevronDownIcon,
  SunIcon,
  MoonIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  BellSlashIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../ThemeContext';
import { automationService } from '../services/api';
import { useAuth } from '../auth/AuthContext';

const pageTitles = {
  '/': 'Tableau de bord',
  '/erps': 'ERP Registry',
  '/erps/create': 'Ajouter un ERP',
  '/mapping': 'Mapping',
  '/adapters': 'Adapters',
  '/settings': 'Paramètres',
  '/data-runtime': 'Data Runtime',
  '/data-runtime/history': 'Historique des données',
  '/automation': 'Cockpit Automation',
  '/automation/rules': 'Règles d\'automation',
  '/automation/workflows': 'Workflows',
  '/automation/triggers': 'Triggers',
  '/automation/conditions': 'Conditions',
  '/automation/history': 'Historique d\'automation',
  '/iam': 'IAM · Vue d\'ensemble',
  '/iam/users': 'IAM · Utilisateurs',
  '/iam/sessions': 'IAM · Sessions',
  '/iam/profile': 'IAM · Mon profil',
};

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  return `il y a ${Math.floor(h / 24)} j`;
};

function Header({ onToggleSidebar, onOpenMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const [notifications, setNotifications] = useState([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [readIds, setReadIds] = useState(new Set());
  const unread = notifications.filter((n) => !readIds.has(n.id)).length;
  const { user: currentUser, logout: authLogout } = useAuth();

  const getTitle = () => {
    if (location.pathname.startsWith('/erps/edit')) return "Modifier l'ERP";
    return pageTitles[location.pathname] || 'ERP Adapter';
  };

  const loadNotifications = useCallback(async () => {
    setNotifLoading(true);
    const items = [];

    try {
      const c = (await automationService.cockpit()).data;
      if (c?.attention > 0) {
        items.push({
          id: 'attention',
          title: `${c.attention} attention(s) requise(s)`,
          detail: 'Des exécutions automatisées nécessitent votre action.',
          time: new Date().toISOString(),
          level: 'warning',
        });
      }
    } catch (err) { console.error(err); }

    try {
      const h = (await automationService.history()).data;
      const recs = Array.isArray(h) ? h : (h?.records || []);
      recs.slice(0, 8).forEach((r) => {
        const st = String(r.status || '').toUpperCase();
        const level = st.includes('FAIL') || st === 'ERROR' ? 'error' : (st.includes('SUCC') ? 'success' : 'info');
        items.push({
          id: r.executionId || r.id || Math.random().toString(36).slice(2),
          title: `Exécution : ${r.workflowCode || r.code || 'workflow'}`,
          detail: `Statut ${r.status || '—'} · v${r.version || '—'}`,
          time: r.startedAt || r.finishedAt,
          level,
        });
      });
    } catch (err) { console.error(err); }

    const seen = new Set();
    const uniq = [];
    items.forEach((i) => {
      if (!seen.has(i.id)) { seen.add(i.id); uniq.push(i); }
    });
    uniq.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

    setNotifications(uniq);
    setNotifLoading(false);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBell = () => {
    setNotifOpen((v) => !v);
    if (!notifOpen) loadNotifications();
  };

  const handleLogout = () => {
    setProfileOpen(false);
    authLogout();
    navigate('/login');
  };

  const initials = currentUser
    ? (((currentUser.firstName || currentUser.firstname || '')[0] || '') + ((currentUser.lastName || currentUser.name || '')[0] || '')).toUpperCase() || 'A'
    : 'A';
  const displayName = currentUser
    ? ([currentUser.firstName || currentUser.firstname, currentUser.lastName || currentUser.name].filter(Boolean).join(' ') || currentUser.username || currentUser.login || 'Utilisateur')
    : 'Administrateur';
  const displayEmail = currentUser?.primaryEmail || currentUser?.email || 'admin@erp-adapter.local';
  const NotifIcon = ({ level }) => {
    if (level === 'error') return <XCircleIcon className="w-4 h-4 text-red-500" />;
    if (level === 'warning') return <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />;
    if (level === 'success') return <CheckCircleIcon className="w-4 h-4 text-emerald-500" />;
    return <BellIcon className="w-4 h-4 text-blue-500" />;
  };

  return (
    <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
      <div className="flex items-center min-w-0">
        <button
          onClick={onOpenMobile}
          title="Menu"
          className="lg:hidden mr-2 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Bars3Icon className="w-5 h-5" />
        </button>
        <p className="text-xs text-slate-400 hidden md:block mr-4">
          Accueil <span className="mx-1">/</span>
          <span className="text-slate-600 dark:text-slate-300 font-medium">{getTitle()}</span>
        </p>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 flex items-center lg:hidden truncate">
          {getTitle()}
        </h2>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-3">
        <a
          href="http://localhost:3002/api/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 hover:text-[#5469D4] px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors hidden sm:inline-flex"
        >
          <BookOpenIcon className="w-5 h-5" />
          <span>API Docs</span>
        </a>

        <button
          onClick={toggleTheme}
          title={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
          className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleBell}
            title="Notifications"
            className={`relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${notifOpen ? 'bg-slate-100 dark:bg-slate-800 text-[#5469D4] dark:text-[#94A3FF]' : ''}`}
          >
            <BellIcon className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700/60">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Notifications</h3>
                {notifications.length > 0 && (
                  <button
                    onClick={() => setReadIds(new Set(notifications.map((n) => n.id)))}
                    className="text-xs text-[#5469D4] dark:text-[#94A3FF] hover:underline"
                  >
                    Tout marquer comme lu
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-700/40">
                {notifLoading ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">Chargement...</div>
                ) : notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <BellSlashIcon className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
                    <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Aucune notification</p>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Les exécutions et alertes apparaîtront ici.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${readIds.has(n.id) ? 'opacity-60' : ''}`}>
                      <span className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${n.level === 'error' ? 'bg-red-50 dark:bg-red-900/30' : n.level === 'warning' ? 'bg-amber-50 dark:bg-amber-900/30' : n.level === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                        <NotifIcon level={n.level} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{n.title}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{n.detail}</p>
                      </div>
                      <span className="ml-auto shrink-0 text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(n.time)}</span>
                    </div>
                  ))
                )}
              </div>
              <button
                onClick={() => { setNotifOpen(false); navigate('/automation/history'); }}
                className="w-full px-4 py-2.5 text-center text-sm font-medium text-[#5469D4] dark:text-[#94A3FF] border-t border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                Voir l'historique d'exécution
              </button>
            </div>
          )}
        </div>

        {/* Profil */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            title="Profil"
            className={`flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${profileOpen ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3B4BA8] to-[#5469D4] flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <ChevronDownIcon className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden z-50">
              <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3B4BA8] to-[#5469D4] flex items-center justify-center text-white font-bold">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
                  </div>
                </div>
              </div>
              <div className="py-1.5">
                <button
                  onClick={() => { setProfileOpen(false); navigate('/iam/profile'); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <CogIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  Mon profil
                </button>
                <button
                  onClick={() => { setProfileOpen(false); navigate('/settings'); }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <CogIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  Paramètres
                </button>
                <a
                  href="http://localhost:3002/api/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setProfileOpen(false)}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <BookOpenIcon className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  API Docs
                </a>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 border-t border-slate-100 dark:border-slate-700/60 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                Se déconnecter
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;