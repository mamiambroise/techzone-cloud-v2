import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layers, ChevronLeft, ChevronRight, ChevronDown, X, LayoutDashboard, AppWindow, BriefcaseBusiness, PanelsTopLeft, Workflow, Package, Database, CreditCard, ShieldCheck, Activity, Settings } from 'lucide-react';
import { toggleSidebarCollapsed } from '../store/platformSlice.js';
import { navigationSections, navigationGroups, groupEntries, activeNavigation } from '../app/navigationConfig.js';
import { canAccess } from '../app/navigationAccess.js';
import { useAuth } from '../auth/AuthProvider.jsx';
const icons = { LayoutDashboard, AppWindow, BriefcaseBusiness, PanelsTopLeft, Workflow, Package, Database, CreditCard, ShieldCheck, Activity, Settings };
export default function Sidebar({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const storedCollapsed = useSelector(state => state.platform.sidebarCollapsed);
  const collapsed = storedCollapsed && !isOpen;
  const { user } = useAuth();
  const { pathname } = useLocation();
  const active = activeNavigation(pathname);
  const [expanded, setExpanded] = useState({});
  useEffect(() => { if (active) setExpanded(previous => ({ ...previous, [active.group]: true })); }, [pathname, active?.group]);
  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = event => { if (event.key === 'Escape') onClose(); };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', closeOnEscape); };
  }, [isOpen, onClose]);
  return <>
    {isOpen && <div data-testid="sidebar-overlay" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden" aria-hidden="true" />}
    <aside id="main-sidebar" aria-label="Navigation principale" className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#081026] text-slate-200 border-r border-slate-800 transition-all lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className="p-4 flex items-center gap-2 border-b border-slate-800">
        <Layers className="w-6 h-6 shrink-0 text-blue-400" />
        {!collapsed && <span className="font-bold text-sm flex-1">Techzone Cloud</span>}
        <button id="sidebar-collapse-toggle" onClick={() => dispatch(toggleSidebarCollapsed())} className="hidden lg:block" aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}>{collapsed ? <ChevronRight /> : <ChevronLeft />}</button>
        <button onClick={onClose} className="lg:hidden" aria-label="Fermer le menu"><X /></button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {navigationSections.map(section => <section key={section.id} aria-label={section.label}>
          <h2 className="px-2 py-1 text-[10px] uppercase tracking-wide text-slate-500" title={section.label}>{collapsed ? section.label.slice(0, 3) : section.label}</h2>
          {navigationGroups.filter(group => group.section === section.id).map(group => {
            const entries = groupEntries(group.id).filter(entry => canAccess(entry, user));
            if (!entries.length) return null;
            const Icon = icons[group.icon];
            const destination = entries.find(entry => (entry.component || entry.redirectTo))?.route;
            const label = <><Icon className="h-5 w-5 shrink-0" />{!collapsed && <span className="flex-1 text-left">{group.label}</span>}</>;
            return <div key={group.id} data-navigation-group={group.id} className="my-1">
              <div className={`flex items-center rounded-lg ${active?.group === group.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
                {destination ? <Link to={destination} title={group.label} aria-label={group.label} onClick={onClose} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-sm">{label}</Link>
                  : <span title={`${group.label} — Indisponible`} aria-disabled="true" className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-sm text-slate-500">{label}</span>}
                {!collapsed && <button aria-label={`Sous-menu ${group.label}`} aria-expanded={!!expanded[group.id]} aria-controls={`submenu-${group.id}`} onClick={() => setExpanded(previous => ({ ...previous, [group.id]: !previous[group.id] }))} className="p-2"><ChevronDown className={`h-4 w-4 ${expanded[group.id] ? 'rotate-180' : ''}`} /></button>}
              </div>
              {!collapsed && expanded[group.id] && <ul id={`submenu-${group.id}`} className="ml-4 border-l border-slate-700 pl-2">
                {entries.map(entry => <li key={entry.id}>{(entry.component || entry.redirectTo) ? <Link to={entry.route} onClick={onClose} aria-current={active?.id === entry.id ? 'page' : undefined} className={`block rounded px-2 py-2 text-xs ${active?.id === entry.id ? 'bg-blue-900 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>{entry.label}</Link>
                  : <span aria-disabled="true" title="Fonctionnalité indisponible" className="block px-2 py-2 text-xs text-slate-500">{entry.label}</span>}</li>)}
              </ul>}
            </div>;
          })}
        </section>)}
      </nav>
    </aside>
    <div aria-hidden="true" className={`hidden lg:block shrink-0 transition-all ${storedCollapsed ? 'w-20' : 'w-72'}`} />
  </>;
}
