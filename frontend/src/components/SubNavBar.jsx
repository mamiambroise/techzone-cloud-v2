import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { activeNavigation, navigationEntries, navigationGroups } from '../app/navigationConfig.js';
export default function SubNavBar() {
  const { pathname } = useLocation();
  const active = activeNavigation(pathname);
  const group = navigationGroups.find(g => g.id === active?.group);
  if (!group) return null;
  return <nav aria-label={group.label} className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3">
    {navigationEntries.filter(e => e.group === group.id).map(entry => <NavLink key={entry.id} to={entry.route} end className={({isActive}) => `shrink-0 rounded-lg px-3 py-2 text-xs ${isActive ? 'bg-blue-100 text-blue-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}>
      {entry.label}{entry.status === 'PLACEHOLDER' ? ' - Placeholder' : ''}
    </NavLink>)}
  </nav>;
}
