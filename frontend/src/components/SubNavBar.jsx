import React from 'react';
import { useLocation } from 'react-router-dom';
import { activeNavigation, groupEntries, navigationGroups } from '../app/navigationConfig.js';
import { canAccess } from '../app/navigationAccess.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import ModuleTabs from './ui/ModuleTabs.jsx';

const isActionRoute = (entry) => /(^|\/)(create|edit)(\/|$)|:(id|moduleKey|pageId|applicationId|versionId)$/.test(entry.route);
const BILLING_TENANT_TABS = new Set(['billingOverview', 'billingQuotas', 'billingInvoices', 'billingSettings']);
const BILLING_PLATFORM_TABS = new Set(['billingAdminCatalog', 'billingAdminSubscriptions', 'billingAdminOperations', 'billingAdminDiagnostics']);

export default function SubNavBar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const active = activeNavigation(pathname);
  const group = navigationGroups.find((item) => item.id === active?.group);

  if (!group || group.id === 'dashboard' || !canAccess(active, user)) return null;

  // Contextual pages such as Business Manager version editors keep their
  // existing context-aware controls. A generic tab never drops route params.
  const directEntries = groupEntries(group.id).filter((entry) => (
    entry.implemented && !entry.route.includes(':') && !isActionRoute(entry) && canAccess(entry, user)
  ));
  // A platform administrator can legitimately navigate both scopes. The
  // current route, not merely the permission set, selects the visible scope.
  const billingScope = pathname.startsWith('/billing/admin') ? BILLING_PLATFORM_TABS : BILLING_TENANT_TABS;
  const entries = group.id === 'billing'
    ? directEntries.filter((entry) => billingScope.has(entry.id))
    : directEntries;

  if (entries.length < 2) return null;

  return (
    <section className="tz-module-nav" aria-label={`Navigation ${group.label}`}>
      <div className="tz-module-nav__heading">
        <div>
          <p className="tz-module-nav__eyebrow">Espace module</p>
          <h1>{group.label}</h1>
        </div>
        <p>Navigation et outils disponibles pour votre contexte.</p>
      </div>
      <ModuleTabs
        ariaLabel={`Sections ${group.label}`}
        activeId={active?.id}
        tabs={entries.map((entry) => ({
          id: entry.id,
          label: entry.label,
          route: entry.route,
          icon: entry.icon,
        }))}
      />
    </section>
  );
}
