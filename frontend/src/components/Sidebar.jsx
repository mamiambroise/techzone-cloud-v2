import React from 'react';
import { NavLink } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layers, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { toggleSidebarCollapsed } from '../store/platformSlice.js';
import { navigationGroups, navigationEntries } from '../app/navigationConfig.js';

export default function Sidebar({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const collapsed = useSelector(state => state.platform.sidebarCollapsed);
  return <>
    {isOpen && <div onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden" aria-hidden="true" />}
    <aside id="main-sidebar" aria-label="Navigation principale" className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#081026] text-slate-200 border-r border-slate-800 transition-all lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'w-20' : 'w-72'}`}>
      <div className="p-4 flex items-center gap-2 border-b border-slate-800">
        <Layers className="w-6 h-6 shrink-0 text-blue-400" />
        {!collapsed && <span className="font-bold text-sm flex-1">Techzone Cloud</span>}
        <button id="sidebar-collapse-toggle" onClick={() => dispatch(toggleSidebarCollapsed())} className="hidden lg:block" aria-label={collapsed ? 'Agrandir le menu' : 'Reduire le menu'}>{collapsed ? <ChevronRight /> : <ChevronLeft />}</button>
        <button onClick={onClose} className="lg:hidden" aria-label="Fermer le menu"><X /></button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {navigationGroups.map(group => <section key={group.id} aria-label={group.label}>
          <h2 className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-400" title={group.label}>{collapsed ? group.label.slice(0, 3) : group.label}</h2>
          {navigationEntries.filter(e => e.group === group.id).map(entry => <NavLink key={entry.id} to={entry.route} end onClick={onClose} title={entry.label} className={({isActive}) => `block rounded-lg px-2 py-2 text-sm ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
            {collapsed ? entry.label.slice(0, 2) : entry.label}
            {!collapsed && entry.status === 'PLACEHOLDER' && <span className="ml-2 text-[10px] text-amber-300">Placeholder</span>}
          </NavLink>)}
        </section>)}
      </nav>
    </aside>
    <div aria-hidden="true" className={`hidden lg:block shrink-0 transition-all ${collapsed ? 'w-20' : 'w-72'}`} />
  </>;
}
