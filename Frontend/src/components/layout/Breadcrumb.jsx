import React, { useEffect, useState } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { findNavigationItem } from '../../lib/navigationConfig';

const legacyLabels = {
  overview: 'Dashboard',
  applications: 'Applications',
  'new-application': 'Nouvelle application',
  'application-detail': 'Détails de l’application',
  versions: 'Versions & Lifecycle',
  'data-model': 'Data Model Manager',
  features: 'Feature & Capability Manager',
  menus: 'Menu Engine',
  configuration: 'Configuration & Metadata',
  integrations: 'Integrations',
  validation: 'Validation & Quality',
  audit: 'Audit',
  'e2e-bench': 'Diagnostics',
  'iam-overview': 'Auth + IAM + Context',
  'iam-users': 'Utilisateurs & Identités',
  'iam-roles': 'Rôles & Permissions',
  'iam-tenants': 'Organisations & Tenants',
  'pack-overview': 'Pack Manager',
  packs: 'Packs',
  'pack-versions': 'Versions de packs',
  'pack-modules': 'Modules',
  'pack-dependencies': 'Dépendances',
  'pack-rules': 'Règles & Conditions',
  'pack-runtime': 'Pack Runtime',
};

export function Breadcrumb() {
  const { currentView, setCurrentView, selectedApp } = useApp();
  const [pathname, setPathname] = useState(() => window.location.pathname || '/dashboard');

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname || '/dashboard');
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const route = findNavigationItem(pathname);
  const label = route?.label || legacyLabels[currentView] || 'Dashboard';
  const isDashboard = route?.path === '/dashboard' || currentView === 'overview';
  const isApplicationDetail = currentView === 'application-detail';

  return (
    <nav aria-label="Fil d’Ariane" className="mb-5 flex min-h-5 items-center gap-1.5 text-[11px] font-medium text-slate-400">
      <button type="button" onClick={() => setCurrentView('overview')} className="inline-flex items-center gap-1.5 rounded-md px-1 py-1 transition-colors hover:bg-white hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500" aria-label="Retour au dashboard">
        <Home className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Dashboard</span>
      </button>
      {!isDashboard && <><ChevronRight className="h-3.5 w-3.5 text-slate-300" aria-hidden="true" /><span className="truncate font-semibold text-slate-700">{isApplicationDetail ? selectedApp?.name || label : label}</span></>}
    </nav>
  );
}
