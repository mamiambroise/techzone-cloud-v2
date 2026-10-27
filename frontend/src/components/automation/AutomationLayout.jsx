import React from 'react';
import { useAutomationPermissions } from '../../lib/automation/permissions.js';
import AutomationModuleHeader from './AutomationModuleHeader.jsx';
import { AutomationModeBanners, AutomationModeProvider } from './AutomationModeContext.jsx';

function AccessDenied() {
  return (
    <section className="mx-auto max-w-3xl p-8" role="alert">
      <h1 className="text-xl font-bold text-slate-900">Accès refusé</h1>
      <p className="mt-2 text-sm text-slate-600">La permission automation:read est requise pour consulter ce module.</p>
      <p className="mt-1 text-sm text-slate-500">Erreur 403</p>
    </section>
  );
}

export function PermissionGate({ permission = 'automation:read', fallback = <AccessDenied />, children }) {
  const { can } = useAutomationPermissions();
  return can(permission) ? children : fallback;
}

export default function AutomationLayout({ children }) {
  return (
    <PermissionGate>
      <AutomationModeProvider>
        <div className="min-w-0">
          <AutomationModuleHeader />
          <AutomationModeBanners />
          {children}
        </div>
      </AutomationModeProvider>
    </PermissionGate>
  );
}
