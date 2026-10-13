import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Building2, Check, ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight, ChevronsUpDown,
  Cloud, LogOut, Search, Settings, User, X,
} from "lucide-react";
import { setSidebarCollapsed } from "../store/platformSlice.js";
import {
  navigationSections,
  effectiveNavigation,
  activeNavigation,
  navigationStatus,
} from "../app/navigationConfig.js";
import { ROUTES } from "../app/routes.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTenant } from "../contexts/TenantProvider.jsx";
import { resolveNavigationIcon } from "../app/navigationIcons.js";

const focusClass =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400";

const tenantLabel = (tenant) => tenant?.name ?? tenant?.displayName ?? tenant?.slug ?? tenant?.id;

function stored(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function initials(value) {
  const parts = value.trim().split(/\s+/);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : value.slice(0, 2)).toUpperCase();
}

function SidebarGroup({ group, active, collapsed, expanded, onExpand, onNavigate, onTooltip }) {
  const Icon = resolveNavigationIcon(group.icon);
  const nested = group.hasChildren;
  const activeGroup = active?.group === group.id;
  const planned = group.entries.every((e) => !e.implemented);
  const solid = !nested && activeGroup;
  const tone = solid
    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
    : activeGroup
      ? "text-white"
      : "text-slate-300 hover:bg-white/5 hover:text-white";
  const common = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium transition-colors duration-200 motion-reduce:transition-none ${focusClass} ${tone} ${collapsed ? "justify-center px-0" : ""}`;
  const iconTone = solid ? "text-white" : group.accent || "text-slate-300";
  const contents = (
    <>
      <Icon size={20} className={`shrink-0 ${iconTone}`} aria-hidden="true" />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 truncate">{group.label}</span>
          {planned && (
            <span aria-hidden="true" className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-slate-300">
              Bientôt
            </span>
          )}
          {nested && (
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={`shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </>
      )}
    </>
  );
  const tooltip = (event) =>
    collapsed &&
    onTooltip({ label: group.label, top: event.currentTarget.getBoundingClientRect().top + 6 });

  return (
    <div
      data-navigation-group={group.id}
      className={`mb-1 rounded-xl transition-colors duration-200 motion-reduce:transition-none ${nested && expanded && !collapsed ? "bg-white/[0.04]" : ""}`}
      onMouseLeave={() => onTooltip(null)}
    >
      {nested ? (
        <button
          className={common}
          aria-label={group.label}
          aria-expanded={!collapsed && expanded}
          aria-controls={`submenu-${group.id}`}
          onClick={onExpand}
          onMouseEnter={tooltip}
          onFocus={tooltip}
          onBlur={() => onTooltip(null)}
        >
          {contents}
        </button>
      ) : (
        <Link
          className={common}
          to={group.entries[0].route}
          aria-label={group.label}
          aria-current={activeGroup ? "page" : undefined}
          onClick={onNavigate}
          onMouseEnter={tooltip}
          onFocus={tooltip}
          onBlur={() => onTooltip(null)}
        >
          {contents}
        </Link>
      )}
      {!collapsed && nested && (
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          inert={!expanded ? true : undefined}
          aria-hidden={!expanded}
        >
          <div className="overflow-hidden">
            <ul id={`submenu-${group.id}`} className="relative mb-2 ml-[26px] space-y-0.5 border-l border-sky-500/25">
              {group.entries.map((entry) => {
                const Child = resolveNavigationIcon(entry.icon);
                const on = active?.id === entry.id;
                return (
                  <li key={entry.id} className="relative">
                    <span
                      aria-hidden="true"
                      className="absolute -left-[4px] top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-sky-500/70"
                    />
                    <Link
                      to={entry.route}
                      onClick={onNavigate}
                      aria-current={on ? "page" : undefined}
                      className={`ml-3 mr-2 flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors duration-200 motion-reduce:transition-none ${focusClass} ${on ? "bg-blue-500/25 font-medium text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}
                    >
                      <Child size={16} className="shrink-0" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{entry.label}</span>
                      {!entry.implemented && !planned && (
                        <span aria-hidden="true" className="text-[9px] text-slate-500">Bientôt</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const storedCollapsed = useSelector((s) => s.platform.sidebarCollapsed);
  const { user, logout } = useAuth();
  const { activeTenant, tenants, hasMultipleTenants, switchTenant, loading, error } = useTenant();
  const { pathname } = useLocation();
  const active = activeNavigation(pathname);
  const [expanded, setExpanded] = useState(() => stored("techzone.nav.expanded", {}));
  const [search, setSearch] = useState("");
  const [tooltip, setTooltip] = useState(null);
  const [menu, setMenu] = useState(null);
  const panel = useRef(null);
  const footer = useRef(null);
  const collapsed = storedCollapsed && !isOpen;
  const tenantId = activeTenant?.id;
  const status = navigationStatus({ tenantId, loading, error });

  const groups = useMemo(
    () => effectiveNavigation(user, { tenantId, loading, error }),
    [user, tenantId, loading, error],
  );
  const query = search.trim().toLocaleLowerCase("fr");
  const sections = useMemo(() => {
    const filtered = groups
      .map((g) => ({
        ...g,
        hasChildren: g.entries.length > 1,
        entries: g.entries.filter(
          (e) => !query || `${g.label} ${e.label}`.toLocaleLowerCase("fr").includes(query),
        ),
      }))
      .filter((g) => g.entries.length);
    return navigationSections
      .map((section) => ({ ...section, items: filtered.filter((g) => g.section === section.id) }))
      .filter((section) => section.items.length);
  }, [groups, query]);

  const close = useCallback(() => {
    setTooltip(null);
    setMenu(null);
    onClose();
  }, [onClose]);

  const selectTenant = async (id) => {
    setMenu(null);
    if (id === tenantId) return;
    try {
      await switchTenant(id);
      navigate(ROUTES.dashboard);
      close();
    } catch {
      return;
    }
  };

  useEffect(() => {
    if (active?.group) setExpanded((v) => ({ ...v, [active.group]: true }));
    setTooltip(null);
    setMenu(null);
  }, [pathname, active?.group]);

  useEffect(() => {
    save("techzone.nav.expanded", expanded);
  }, [expanded]);

  useEffect(() => {
    save("techzone.nav.collapsed", storedCollapsed);
  }, [storedCollapsed]);

  useEffect(() => {
    setSearch("");
    setTooltip(null);
    setMenu(null);
  }, [tenantId]);

  useEffect(() => {
    if (!menu) return undefined;
    const down = (e) => {
      if (footer.current && !footer.current.contains(e.target)) setMenu(null);
    };
    const key = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setMenu(null);
      }
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [menu]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      if (panel.current) panel.current.inert = !media.matches && !isOpen;
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const trigger = document.activeElement;
    const previous = document.body.style.overflow;
    const content = document.getElementById("workspace-content");
    if (content) content.inert = true;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector('button[aria-label="Fermer le menu"]')?.focus();
    const keydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "Tab") {
        const nodes = [...panel.current.querySelectorAll("a[href],button,input")].filter(
          (n) => n.getClientRects().length && !n.closest("[inert]") && !n.disabled,
        );
        const first = nodes[0];
        const last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", keydown);
    return () => {
      window.removeEventListener("keydown", keydown);
      document.body.style.overflow = previous;
      if (content) content.inert = false;
      trigger?.focus?.();
    };
  }, [isOpen, close]);

  const name = user?.displayName || user?.username || "Utilisateur";
  const tenantName = tenantLabel(activeTenant);
  const toggleMenu = (value) => setMenu((current) => (current === value ? null : value));
  const fallbackMessage = error
    ? "Navigation limitée : contexte entreprise indisponible."
    : (tenants?.length ?? 0) > 1
      ? "Sélectionnez une entreprise pour afficher les modules."
      : "Aucune entreprise active.";
  const menuItemClass = `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-slate-200 hover:bg-white/10 ${focusClass}`;
  const popoverClass = `absolute z-[70] rounded-xl border border-white/10 bg-[#0b1a36] p-1.5 shadow-2xl ${collapsed ? "bottom-3 left-full ml-2 w-56" : "bottom-full left-3 right-3 mb-2"}`;
  const tenantBlockClass = `mb-2 flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-left ${collapsed ? "justify-center" : ""}`;
  const tenantBadge = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
      <Building2 size={18} aria-hidden="true" />
    </span>
  );

  return (
    <>
      {isOpen && (
        <div
          data-testid="sidebar-overlay"
          onClick={close}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        ref={panel}
        id="main-sidebar"
        aria-label="Navigation principale"
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen ? true : undefined}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/10 bg-gradient-to-b from-[#081530] via-[#06122a] to-[#040b1a] text-slate-200 transition-[width,transform] duration-200 motion-reduce:transition-none lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-20" : "w-72"}`}
      >
        <div className="shrink-0 px-4 pb-3 pt-5">
          <div className={`flex ${collapsed ? "flex-col items-center gap-3" : "items-start gap-2"}`}>
            <Link
              to={ROUTES.dashboard}
              aria-label="Techzone Cloud — Accueil"
              onClick={close}
              className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg ${focusClass}`}
            >
              <Cloud size={34} strokeWidth={2.2} className="shrink-0 text-cyan-400" aria-hidden="true" />
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-[17px] font-bold leading-tight tracking-tight text-white">Techzone Cloud</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
                    Plateforme unifiée pour les applications métier
                  </p>
                </div>
              )}
            </Link>
            <button
              id="sidebar-collapse-toggle"
              onClick={() => dispatch(setSidebarCollapsed(!storedCollapsed))}
              className={`hidden h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:flex ${focusClass}`}
              aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
            >
              {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
            </button>
            <button
              onClick={close}
              className={`rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden ${focusClass}`}
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>
          </div>
          {!collapsed && status === "ready" && (
            <div className="relative mt-4">
              <Search
                className="pointer-events-none absolute left-3 top-2.5 text-slate-500"
                size={15}
                aria-hidden="true"
              />
              <input
                aria-label="Rechercher dans le menu"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un module…"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-sky-400/60 focus:ring-2 focus:ring-sky-400/20"
              />
            </div>
          )}
        </div>

        <nav
          className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 [scrollbar-color:#1e3a8a_transparent] [scrollbar-width:thin]"
          onScroll={() => setTooltip(null)}
        >
          <>
            {sections.map((section, index) => (
                <section
                  key={section.id}
                  aria-label={section.label}
                  className={index > 0 ? "mt-3 border-t border-white/10 pt-3" : ""}
                >
                  <h2
                    className={`mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-300/80 ${collapsed || section.id === "accueil" ? "sr-only" : ""}`}
                  >
                    {section.label}
                  </h2>
                  {section.items.map((group) => (
                    <SidebarGroup
                      key={group.id}
                      group={group}
                      active={active}
                      collapsed={collapsed}
                      expanded={!!query || !!expanded[group.id]}
                      onExpand={() => {
                        setTooltip(null);
                        if (collapsed) dispatch(setSidebarCollapsed(false));
                        setExpanded((v) => ({ ...v, [group.id]: collapsed ? true : !v[group.id] }));
                      }}
                      onNavigate={close}
                      onTooltip={setTooltip}
                    />
                  ))}
                </section>
            ))}
            {!sections.length && status === "ready" && (
              <p className="px-3 text-xs text-slate-400">
                {query ? "Aucun résultat." : "Aucun module accessible."}
              </p>
            )}
            {status === "fallback" && !collapsed && (
              <p role="status" className="mt-3 px-3 text-xs text-amber-300/90">
                {fallbackMessage}
              </p>
            )}
          </>
        </nav>

        <div ref={footer} className="relative shrink-0 border-t border-white/10 p-3">
          {hasMultipleTenants ? (
            <button
              onClick={() => toggleMenu("tenant")}
              aria-haspopup="menu"
              aria-expanded={menu === "tenant"}
              aria-label="Changer d’entreprise"
              aria-busy={loading}
              className={`${tenantBlockClass} hover:bg-white/[0.07] ${focusClass}`}
            >
              {tenantBadge}
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">
                    {tenantName ?? "Choisir une entreprise"}
                  </span>
                  <ChevronsUpDown size={16} aria-hidden="true" className="shrink-0 text-slate-400" />
                </>
              )}
            </button>
          ) : (
            tenantName && (
              <div className={tenantBlockClass} title={collapsed ? tenantName : undefined}>
                {tenantBadge}
                {!collapsed && (
                  <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-white">{tenantName}</p>
                )}
              </div>
            )
          )}
          <button
            onClick={() => toggleMenu("user")}
            aria-haspopup="menu"
            aria-expanded={menu === "user"}
            aria-label="Menu utilisateur"
            className={`flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-white/5 ${focusClass} ${collapsed ? "justify-center" : ""}`}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-semibold text-white">
              {initials(name)}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold text-white">{name}</span>
                  <span className="block truncate text-[11px] text-slate-400">
                    {user?.isAdmin ? "Administrateur" : "Utilisateur"}
                  </span>
                </span>
                <ChevronUp
                  size={16}
                  aria-hidden="true"
                  className={`shrink-0 text-slate-400 transition-transform duration-200 motion-reduce:transition-none ${menu === "user" ? "" : "rotate-180"}`}
                />
              </>
            )}
          </button>

          {menu === "tenant" && (
            <div role="menu" aria-label="Entreprises" className={popoverClass}>
              <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Entreprise
              </p>
              <div className="max-h-64 overflow-y-auto">
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    role="menuitemradio"
                    aria-checked={tenant.id === tenantId}
                    disabled={loading}
                    onClick={() => selectTenant(tenant.id)}
                    className={`${menuItemClass} disabled:opacity-50`}
                  >
                    <Building2 size={16} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{tenantLabel(tenant)}</span>
                    {tenant.id === tenantId && <Check size={16} aria-hidden="true" className="text-sky-400" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {menu === "user" && (
            <div role="menu" aria-label="Menu utilisateur" className={popoverClass}>
              <Link role="menuitem" to={ROUTES.settingsProfile} onClick={close} className={menuItemClass}>
                <User size={16} aria-hidden="true" /> Profil
              </Link>
              <Link role="menuitem" to={ROUTES.settingsGeneral} onClick={close} className={menuItemClass}>
                <Settings size={16} aria-hidden="true" /> Paramètres
              </Link>
              <button
                role="menuitem"
                onClick={() => {
                  close();
                  logout();
                }}
                className={`${menuItemClass} text-rose-300 hover:text-rose-200`}
              >
                <LogOut size={16} aria-hidden="true" /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </aside>

      {tooltip && collapsed && (
        <div
          role="tooltip"
          className="fixed left-[88px] z-[60] rounded-lg bg-slate-800 px-3 py-2 text-xs text-white shadow-lg ring-1 ring-white/10"
          style={{ top: tooltip.top }}
        >
          {tooltip.label}
        </div>
      )}
      <div
        aria-hidden="true"
        className={`hidden shrink-0 transition-[width] duration-200 motion-reduce:transition-none lg:block ${storedCollapsed ? "w-20" : "w-72"}`}
      />
    </>
  );
}