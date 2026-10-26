import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  BookOpenCheck,
  CalendarClock,
  CircleHelp,
  Clock3,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Radio,
  Zap,
} from 'lucide-react';
import { useAutomationPermissions } from '../../lib/automation/permissions.js';

const navigation = [
  { label: 'Vue d’ensemble', to: '/automation', icon: LayoutDashboard, end: true },
  { label: 'Workflows', to: '/automation/workflows', icon: GitBranch },
  { label: 'Rules', to: '/automation/rules', icon: ListChecks },
  { label: 'Triggers', to: '/automation/triggers', icon: Radio },
  { label: 'Actions', to: '/automation/actions', icon: Zap },
  { label: 'Planifications', to: '/automation/schedules', icon: CalendarClock },
  { label: 'Executions', to: '/automation/executions', icon: Activity },
  { label: 'History', to: '/automation/history', icon: Clock3 },
  { label: 'Diagnostics', to: '/automation/diagnostics', icon: CircleHelp },
];

const pageLabels = [
  ['/automation/workflows', 'Workflows'],
  ['/automation/rules', 'Rules'],
  ['/automation/triggers', 'Triggers'],
  ['/automation/actions', 'Actions'],
  ['/automation/schedules', 'Planifications'],
  ['/automation/executions', 'Executions'],
  ['/automation/history', 'History'],
  ['/automation/diagnostics', 'Diagnostics'],
];

function AccessDenied() {
  return (
    <main className="mx-auto max-w-3xl p-8" role="alert">
      <h1 className="text-xl font-bold text-slate-900">Accès refusé</h1>
      <p className="mt-2 text-sm text-slate-600">La permission automation:read est requise pour consulter ce module.</p>
      <p className="mt-1 text-sm text-slate-500">Erreur 403</p>
    </main>
  );
}

export function PermissionGate({ permission = 'automation:read', children }) {
  const { can } = useAutomationPermissions();
  return can(permission) ? children : <AccessDenied />;
}

export default function AutomationLayout({ children }) {
  const location = useLocation();
  const pathname = location.pathname;
  const currentLabel = pageLabels.find(([path]) => pathname.startsWith(path))?.[1] || 'Vue d’ensemble';

  return (
    <PermissionGate>
      <div className="flex min-h-[calc(100vh-5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
        <aside aria-label="Navigation Automation" className="hidden w-60 shrink-0 flex-col bg-slate-950 text-slate-200 md:flex">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
                <BookOpenCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-white">Automation</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Studio d’orchestration</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Espace Automation</p>
            {navigation.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-amber-500/15 text-amber-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-white/10 px-5 py-4 text-[11px] text-slate-500">
            Données fournies par le moteur Automation
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Application</span>
              <span aria-hidden="true">/</span>
              <span className="font-semibold text-slate-800">{currentLabel}</span>
            </div>
            <nav aria-label="Navigation Automation mobile" className="mt-3 flex gap-1 overflow-x-auto pb-1 md:hidden">
              {navigation.map(({ label, to, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    isActive ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="min-w-0 p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
