import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Search,
  LogOut,
} from "lucide-react";
import { setSidebarCollapsed } from "../store/platformSlice.js";
import {
  navigationSections,
  effectiveNavigation,
  activeNavigation,
} from "../app/navigationConfig.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTenant } from "../contexts/TenantProvider.jsx";
import { resolveNavigationIcon } from "../app/navigationIcons.js";
const focusClass =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";
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
    /* Storage is optional. */
  }
}

function SidebarGroup({
  group,
  active,
  collapsed,
  expanded,
  onExpand,
  onNavigate,
  onTooltip,
}) {
  const Icon = resolveNavigationIcon(group.icon),
    children = group.hasChildren ?? group.entries.length > 1;
  const activeGroup = active?.group === group.id,
    planned = group.entries.every((e) => !e.implemented);
  const common = `flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-200 motion-reduce:transition-none ${focusClass} ${activeGroup ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"} ${collapsed ? "justify-center" : ""}`;
  const contents = (
    <>
      <Icon size={19} className="shrink-0" aria-hidden="true" />
      {!collapsed && (
        <>
          <span className="min-w-0 flex-1 text-left">{group.label}</span>
          {planned ? (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">
              Bientôt
            </span>
          ) : null}
          {children && (
            <ChevronDown
              size={14}
              className={`shrink-0 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
            />
          )}
        </>
      )}
    </>
  );
  const tooltip = (event) =>
    collapsed &&
    onTooltip({
      label: group.label,
      top: event.currentTarget.getBoundingClientRect().top + 3,
    });
  return (
    <div
      data-navigation-group={group.id}
      className="mb-1"
      onMouseLeave={() => onTooltip(null)}
    >
      {children ? (
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
      {!collapsed && children && (
        <div
          className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none ${expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          inert={!expanded ? true : undefined}
          aria-hidden={!expanded}
        >
          <div className="overflow-hidden">
            <ul
              id={`submenu-${group.id}`}
              className="my-1 ml-5 space-y-0.5 border-l border-slate-200 pl-3"
            >
              {group.entries.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={entry.route}
                    onClick={onNavigate}
                    aria-current={active?.id === entry.id ? "page" : undefined}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs transition-colors duration-200 motion-reduce:transition-none ${focusClass} ${active?.id === entry.id ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                  >
                    <span>{entry.label}</span>
                    {!entry.implemented && !planned && (
                      <span className="text-[9px] text-slate-400">Bientôt</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const dispatch = useDispatch(),
    storedCollapsed = useSelector((s) => s.platform.sidebarCollapsed);
  const { user, logout } = useAuth(),
    { activeTenant, loading, error } = useTenant();
  const { pathname } = useLocation(),
    active = activeNavigation(pathname);
  const [expanded, setExpanded] = useState(() =>
      stored("techzone.nav.expanded", {}),
    ),
    [search, setSearch] = useState(""),
    [tooltip, setTooltip] = useState(null);
  const panel = useRef(null),
    collapsed = storedCollapsed && !isOpen;
  const groups = useMemo(
    () =>
      effectiveNavigation(user, { tenantId: activeTenant?.id, loading, error }),
    [user, activeTenant?.id, loading, error],
  );
  const query = search.trim().toLocaleLowerCase("fr");
  const filtered = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          hasChildren: g.entries.length > 1,
          entries: g.entries.filter(
            (e) =>
              !query ||
              `${g.label} ${e.label}`.toLocaleLowerCase("fr").includes(query),
          ),
        }))
        .filter((g) => g.entries.length),
    [groups, query],
  );
  const close = useCallback(() => {
    setTooltip(null);
    onClose();
  }, [onClose]);
  useEffect(() => {
    if (active?.group) setExpanded((v) => ({ ...v, [active.group]: true }));
    setTooltip(null);
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
  }, [activeTenant?.id]);
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
    if (!isOpen) return;
    const trigger = document.activeElement,
      previous = document.body.style.overflow;
    const content = document.getElementById("workspace-content");
    if (content) content.inert = true;
    document.body.style.overflow = "hidden";
    panel.current
      ?.querySelector('button[aria-label="Fermer le menu"]')
      ?.focus();
    const keydown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "Tab") {
        const nodes = [
          ...panel.current.querySelectorAll("a[href],button,input"),
        ].filter(
          (n) =>
            n.getClientRects().length && !n.closest("[inert]") && !n.disabled,
        );
        const first = nodes[0],
          last = nodes.at(-1);
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
  return (
    <>
      {isOpen && (
        <div
          data-testid="sidebar-overlay"
          onClick={close}
          className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] lg:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        ref={panel}
        id="main-sidebar"
        aria-label="Navigation principale"
        role={isOpen ? "dialog" : undefined}
        aria-modal={isOpen ? true : undefined}
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-[width,transform] duration-200 motion-reduce:transition-none lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "w-20" : "w-72"}`}
      >
        <div className="shrink-0 px-4 pb-4 pt-5">
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              aria-label="Techzone Cloud — Accueil"
              onClick={close}
              className={`flex min-w-0 flex-1 items-center gap-2.5 ${focusClass}`}
            >
              <Layers size={28} className="shrink-0 text-blue-600" />
              {!collapsed && (
                <div>
                  <p className="text-sm font-bold tracking-tight">
                    Techzone Cloud
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Votre plateforme métier
                  </p>
                </div>
              )}
            </Link>
            <button
              id="sidebar-collapse-toggle"
              onClick={() => dispatch(setSidebarCollapsed(!storedCollapsed))}
              className={`hidden rounded p-1 text-slate-400 hover:bg-slate-100 lg:block ${focusClass}`}
              aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}
            >
              {collapsed ? (
                <ChevronRight size={15} />
              ) : (
                <ChevronLeft size={15} />
              )}
            </button>
            <button
              onClick={close}
              className={`rounded p-1 text-slate-500 lg:hidden ${focusClass}`}
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>
          </div>
          {!collapsed && (
            <div className="relative mt-5">
              <Search
                className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
                size={15}
              />
              <input
                aria-label="Rechercher dans le menu"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un module…"
                className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
              />
            </div>
          )}
        </div>
        <nav
          className="min-h-0 flex-1 space-y-5 overflow-y-auto px-3 pb-5 [scrollbar-width:thin]"
          onScroll={() => setTooltip(null)}
        >
          {navigationSections.map((section) => {
            const items = filtered.filter((g) => g.section === section.id);
            return items.length ? (
              <section key={section.id} aria-label={section.label}>
                <h2
                  className={`mb-2 px-3 text-[10px] font-semibold tracking-wider text-slate-400 ${collapsed ? "sr-only" : ""}`}
                >
                  {section.label}
                </h2>
                {items.map((group) => (
                  <SidebarGroup
                    key={group.id}
                    group={group}
                    active={active}
                    collapsed={collapsed}
                    expanded={!!query || !!expanded[group.id]}
                    onExpand={() => {
                      setTooltip(null);
                      if (collapsed) dispatch(setSidebarCollapsed(false));
                      setExpanded((v) => ({
                        ...v,
                        [group.id]: collapsed ? true : !v[group.id],
                      }));
                    }}
                    onNavigate={close}
                    onTooltip={setTooltip}
                  />
                ))}
              </section>
            ) : null;
          })}
          {!filtered.length && (
            <p className="px-3 text-xs text-slate-500">Aucun résultat.</p>
          )}
        </nav>
        <div className="flex shrink-0 items-center gap-2.5 border-t border-slate-100 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700">
            {name.slice(0, 2).toUpperCase()}
          </span>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold">{name}</p>
                <p className="mt-0.5 truncate text-[10px] text-slate-500">
                  {user?.isAdmin ? "Administrateur" : "Utilisateur"}
                </p>
              </div>
              <button
                aria-label="Se déconnecter"
                onClick={logout}
                className={`rounded p-1 text-slate-400 hover:text-slate-700 ${focusClass}`}
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>
      </aside>
      {tooltip && collapsed && (
        <div
          role="tooltip"
          className="fixed left-[88px] z-[60] rounded-lg bg-slate-900 px-3 py-2 text-xs text-white shadow-lg"
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
