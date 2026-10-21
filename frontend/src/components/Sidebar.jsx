import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Layers, ChevronLeft, ChevronRight, X, Search, LogOut } from 'lucide-react';
import { setSidebarCollapsed } from '../store/platformSlice.js';
import { navigationSections, effectiveNavigation, activeNavigation, navigationStatus } from '../app/navigationConfig.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useTenant } from '../contexts/TenantProvider.jsx';
import { resolveNavigationIcon } from '../app/navigationIcons.js';

const focusClass = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400';

function ModuleLink({ group, active, collapsed, onNavigate, onTooltip }) {
  const Icon = resolveNavigationIcon(group.icon);
  const destination = group.entries.find((entry) => entry.implemented) ?? group.entries[0];
  const isActive = active?.group === group.id;
  const planned = !group.entries.some((entry) => entry.implemented);

  return (
    <div data-navigation-group={group.id} className="mb-1" onMouseLeave={() => onTooltip(null)}>
      <Link
        to={destination.route}
        aria-label={group.label}
        aria-current={isActive ? 'page' : undefined}
        onClick={onNavigate}
        onMouseEnter={(event) => collapsed && onTooltip({ label: group.label, top: event.currentTarget.getBoundingClientRect().top + 3 })}
        onFocus={(event) => collapsed && onTooltip({ label: group.label, top: event.currentTarget.getBoundingClientRect().top + 3 })}
        onBlur={() => onTooltip(null)}
        className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] font-medium transition-colors duration-150 motion-reduce:transition-none ${focusClass} ${isActive ? 'bg-[var(--color-sidebar-active)] text-white shadow-sm' : 'text-slate-300 hover:bg-[var(--color-sidebar-hover)] hover:text-white'} ${collapsed ? 'justify-center' : ''}`}
      >
        <Icon size={19} className="shrink-0" aria-hidden="true" />
        {!collapsed && <><span className="min-w-0 flex-1 truncate">{group.label}</span>{planned && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] text-slate-300">Bientôt</span>}</>}
      </Link>
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const storedCollapsed = useSelector((state) => state.platform.sidebarCollapsed);
  const { user, logout } = useAuth();
  const { activeTenant, loading, error } = useTenant();
  const { pathname } = useLocation();
  const active = activeNavigation(pathname);
  const [search, setSearch] = useState('');
  const [tooltip, setTooltip] = useState(null);
  const panel = useRef(null);
  const collapsed = storedCollapsed && !isOpen;
  const tenantId = activeTenant?.id;
  const state = navigationStatus({ tenantId, loading, error });
  const groups = useMemo(() => effectiveNavigation(user, { tenantId, loading, error }), [user, tenantId, loading, error]);
  const query = search.trim().toLocaleLowerCase('fr');
  const filtered = useMemo(() => groups.filter((group) => !query || group.label.toLocaleLowerCase('fr').includes(query)), [groups, query]);
  const close = useCallback(() => { setTooltip(null); onClose(); }, [onClose]);

  useEffect(() => { setSearch(''); setTooltip(null); }, [tenantId]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => { if (panel.current) panel.current.inert = !media.matches && !isOpen; };
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return undefined;
    const trigger = document.activeElement;
    const previous = document.body.style.overflow;
    const content = document.getElementById('workspace-content');
    if (content) content.inert = true;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector('button[aria-label="Fermer le menu"]')?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...panel.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')]
        .filter((node) => node.getClientRects().length);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener('keydown', keydown);
    return () => { window.removeEventListener('keydown', keydown); document.body.style.overflow = previous; if (content) content.inert = false; trigger?.focus?.(); };
  }, [isOpen, close]);

  const name = user?.displayName || user?.username || 'Utilisateur';
  return (
    <>
      {isOpen && <div data-testid="sidebar-overlay" onClick={close} className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden" aria-hidden="true" />}
      <aside ref={panel} id="main-sidebar" aria-label="Navigation principale" role={isOpen ? 'dialog' : undefined} aria-modal={isOpen || undefined} className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-[var(--color-sidebar)] text-white shadow-xl transition-[width,transform] duration-200 motion-reduce:transition-none lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'w-20' : 'w-[260px]'}`}>
        <div className="shrink-0 px-4 pb-4 pt-5">
          <div className="flex items-center gap-2">
            <Link to="/dashboard" aria-label="Techzone Cloud — Accueil" onClick={close} className={`flex min-w-0 flex-1 items-center gap-2.5 ${focusClass}`}>
              <Layers size={28} className="shrink-0 text-blue-400" />
              {!collapsed && <div><p className="text-sm font-bold tracking-tight">Techzone Cloud</p><p className="mt-0.5 text-[10px] text-slate-400">Votre plateforme métier</p></div>}
            </Link>
            <button type="button" id="sidebar-collapse-toggle" onClick={() => dispatch(setSidebarCollapsed(!storedCollapsed))} className={`hidden rounded p-1 text-slate-400 hover:bg-[var(--color-sidebar-hover)] hover:text-white lg:block ${focusClass}`} aria-label={collapsed ? 'Agrandir le menu' : 'Réduire le menu'}>{collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}</button>
            <button type="button" onClick={close} className={`rounded p-1 text-slate-300 hover:bg-[var(--color-sidebar-hover)] lg:hidden ${focusClass}`} aria-label="Fermer le menu"><X size={20} /></button>
          </div>
          {!collapsed && state === 'ready' && <label className="relative mt-5 block"><span className="sr-only">Rechercher dans le menu</span><Search className="pointer-events-none absolute left-3 top-2.5 text-slate-400" size={15} /><input aria-label="Rechercher dans le menu" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un module…" className="w-full rounded-[var(--radius-md)] border border-white/10 bg-white/10 py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20" /></label>}
        </div>
        <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-5 [scrollbar-width:thin]" onScroll={() => setTooltip(null)}>
          {navigationSections.map((section) => {
            const sectionGroups = filtered.filter((group) => group.section === section.id);
            return sectionGroups.length ? <section key={section.id} aria-label={section.label}><h2 className={`mb-2 px-3 text-[10px] font-semibold tracking-wider text-slate-500 ${collapsed ? 'sr-only' : ''}`}>{section.label}</h2>{sectionGroups.map((group) => <ModuleLink key={group.id} group={group} active={active} collapsed={collapsed} onNavigate={close} onTooltip={setTooltip} />)}</section> : null;
          })}
          {!filtered.length && <p className="px-3 text-xs text-slate-500">Aucun résultat.</p>}
          {state === 'fallback' && !collapsed && <p role="status" className="px-3 text-xs text-amber-200">Navigation limitée : contexte entreprise indisponible.</p>}
        </nav>
        <div className="flex shrink-0 items-center gap-2.5 border-t border-white/10 p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs font-semibold text-blue-100">{name.slice(0, 2).toUpperCase()}</span>{!collapsed && <><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{name}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{user?.isAdmin ? 'Administrateur' : 'Utilisateur'}</p></div><button aria-label="Se déconnecter" type="button" onClick={logout} className={`rounded p-1 text-slate-400 hover:bg-[var(--color-sidebar-hover)] hover:text-white ${focusClass}`}><LogOut size={16} /></button></>}</div>
      </aside>
      {tooltip && collapsed && <div role="tooltip" className="fixed left-[88px] z-[60] rounded-lg bg-[var(--color-sidebar-2)] px-3 py-2 text-xs text-white shadow-lg" style={{ top: tooltip.top }}>{tooltip.label}</div>}
      <div aria-hidden="true" className={`hidden shrink-0 transition-[width] duration-200 motion-reduce:transition-none lg:block ${storedCollapsed ? 'w-20' : 'w-[260px]'}`} />
    </>
  );
}
