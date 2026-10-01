import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { activeNavigation, groupEntries, navigationGroups, pageDefinitions } from '../app/navigationConfig.js';
import { canAccess } from '../app/navigationAccess.js';
import { useAuth } from '../auth/AuthProvider.jsx';
export default function SubNavBar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const active = activeNavigation(pathname);
  const group = navigationGroups.find(g => g.id === active?.group);
  if (!group || ['dashboard','registry','bm','packs','runtime'].includes(group.id) || !canAccess(active, user)) return null;
  const entries = groupEntries(group.id).filter(e => (e.component || e.redirectTo) && canAccess(e, user));
  const contextual = pageDefinitions.filter(e => e.group === group.id && !e.menu && (e.component || e.redirectTo) && !e.route.includes(':') && canAccess(e, user));
  return <div className="border-b border-slate-200 bg-white">
    <nav aria-label={group.label} className="flex gap-2 overflow-x-auto px-4 py-3">
      {entries.map(entry => <Link key={entry.id} to={entry.route} aria-current={active?.id === entry.id ? 'page' : undefined} className={`shrink-0 rounded-lg px-3 py-2 text-xs ${active?.id === entry.id ? 'bg-blue-100 text-blue-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>{entry.label}</Link>)}
    </nav>
    {contextual.length > 0 && <details className="px-4 pb-2 text-xs text-slate-600"><summary>Autres écrans {group.label}</summary><nav aria-label="Écrans complémentaires" className="flex flex-wrap gap-3 py-2">{contextual.map(entry => <Link key={entry.id} to={entry.route}>{entry.label}</Link>)}</nav></details>}
  </div>;
}
