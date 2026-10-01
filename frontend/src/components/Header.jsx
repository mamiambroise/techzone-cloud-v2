import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Menu,
  Bell,
  Search,
  ChevronRight,
  ChevronDown,
  LogOut,
  X,
} from "lucide-react";
import {
  activeNavigation,
  navigationGroups,
  groupDestination,
} from "../app/navigationConfig.js";
import { useAuth } from "../auth/AuthProvider.jsx";
import { useTenant } from "../contexts/TenantProvider.jsx";
import { useDashboard, alertKeys } from "./dashboard/DashboardContext.jsx";
import GlobalSearch from "./GlobalSearch.jsx";
const iconButton =
  "rounded-lg p-2 text-slate-500 transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 motion-reduce:transition-none";
export default function Header({ mobileOpen, onToggleMobileSidebar }) {
  const { user, logout } = useAuth(),
    { activeTenant, tenants, switchTenant, hasMultipleTenants, loading } =
      useTenant();
  const {
    widgets,
    loading: dashboardLoading,
    error: dashboardError,
  } = useDashboard();
  const [panel, setPanel] = useState(null),
    [mobileSearch, setMobileSearch] = useState(false),
    [switchError, setSwitchError] = useState(false);
  const location = useLocation(),
    root = useRef(null),
    toggle = useRef(null);
  const entry = activeNavigation(location.pathname),
    group = navigationGroups.find((g) => g.id === entry?.group);
  const alerts = alertKeys
    .flatMap((key) =>
      Array.isArray(widgets[key]?.data) ? widgets[key].data : [],
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 8);
  useEffect(() => {
    setPanel(null);
    setMobileSearch(false);
  }, [location.pathname, activeTenant?.id]);
  useEffect(() => {
    const outside = (e) => {
      if (!root.current?.contains(e.target)) setPanel(null);
    };
    const key = (e) => {
      if (e.key === "Escape") {
        setPanel(null);
        setMobileSearch(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", key);
    };
  }, []);
  const name = user?.displayName || user?.username || "Utilisateur";
  return (
    <header
      ref={root}
      className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm"
    >
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <button
            id="mobile-menu-toggle-btn"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
            aria-controls="main-sidebar"
            onClick={onToggleMobileSidebar}
            className={`${iconButton} lg:hidden`}
          >
            <Menu size={20} />
          </button>
          <nav
            aria-label="Fil d’Ariane"
            className="flex min-w-0 items-center gap-2 text-xs"
          >
            <Link
              to={
                entry?.group === "dashboard"
                  ? "/dashboard"
                  : groupDestination(group?.id) || "/dashboard"
              }
              className="hidden shrink-0 text-slate-500 hover:text-blue-600 sm:inline"
            >
              {entry?.group === "dashboard"
                ? "Accueil"
                : group?.label || "Accueil"}
            </Link>
            <ChevronRight
              size={13}
              className="hidden shrink-0 text-slate-300 sm:block"
            />
            <span
              aria-current="page"
              className="truncate font-medium text-slate-800"
            >
              {entry?.label || "Page introuvable"}
            </span>
          </nav>
        </div>
        <div className="hidden w-full max-w-sm xl:max-w-md md:block">
          <GlobalSearch />
        </div>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {hasMultipleTenants && activeTenant && (
            <select
              aria-label="Tenant actif"
              disabled={loading}
              value={activeTenant?.id || ""}
              onChange={async (e) => {
                try {
                  setSwitchError(false);
                  await switchTenant(e.target.value);
                } catch {
                  setSwitchError(true);
                }
              }}
              className="max-w-28 rounded-lg border border-slate-200 bg-white p-2 text-xs sm:max-w-40"
            >
              <option value="" disabled>
                Choisir un tenant
              </option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name || t.code}
                </option>
              ))}
            </select>
          )}
          <button
            aria-label="Rechercher"
            onClick={() => setMobileSearch((v) => !v)}
            className={`${iconButton} md:hidden`}
          >
            <Search size={18} />
          </button>
          <div className="relative">
            <button
              aria-label="Notifications"
              aria-expanded={panel === "alerts"}
              onClick={(e) => {
                toggle.current = e.currentTarget;
                setPanel(panel === "alerts" ? null : "alerts");
              }}
              className={`${iconButton} relative`}
            >
              <Bell size={18} />
              {alerts.length > 0 && (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-amber-500" />
              )}
            </button>
            {panel === "alerts" && (
              <section
                aria-label="Notifications récentes"
                className="absolute right-0 top-full mt-3 w-[min(21rem,calc(100vw-2rem))] rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
              >
                <h2 className="mb-3 text-sm font-semibold">Alertes récentes</h2>
                {dashboardLoading ? (
                  <p role="status" className="text-xs text-slate-500">
                    Chargement…
                  </p>
                ) : dashboardError ? (
                  <p className="text-xs text-slate-500">
                    Données indisponibles.
                  </p>
                ) : alerts.length ? (
                  alerts.map((a) => (
                    <Link
                      key={a.id}
                      to={a.targetRoute}
                      onClick={() => setPanel(null)}
                      className="block rounded-lg border-b border-slate-100 px-2 py-3 text-xs [overflow-wrap:anywhere] hover:bg-slate-50"
                    >
                      {a.message}
                    </Link>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    Aucune alerte remontée.
                  </p>
                )}
                {alertKeys.some((k) => widgets[k]?.state === "ERROR") && (
                  <p className="mt-2 text-xs text-amber-700">
                    Certaines sources sont indisponibles.
                  </p>
                )}
              </section>
            )}
          </div>
          <div className="relative">
            <button
              aria-label="Menu utilisateur"
              aria-expanded={panel === "user"}
              onClick={(e) => {
                toggle.current = e.currentTarget;
                setPanel(panel === "user" ? null : "user");
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 p-1.5 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-semibold text-white">
                {name.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-28 truncate text-xs font-medium xl:block">
                {name}
              </span>
              <ChevronDown size={12} className="text-slate-400" />
            </button>
            {panel === "user" && (
              <div className="absolute right-0 top-full mt-3 w-56 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {activeTenant?.name || "Aucun tenant actif"}
                </p>
                <button
                  onClick={logout}
                  className="mt-3 flex w-full items-center gap-2 rounded-lg p-2 text-xs hover:bg-slate-50"
                >
                  <LogOut size={14} />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {switchError && (
        <p role="alert" className="px-4 pb-2 text-xs text-rose-700">
          Changement de tenant impossible. Réessayez.
        </p>
      )}
      {mobileSearch && (
        <div className="flex items-center gap-2 border-t border-slate-100 p-3 md:hidden">
          <GlobalSearch onCloseMobile={() => setMobileSearch(false)} />
          <button
            aria-label="Fermer la recherche"
            className={iconButton}
            onClick={() => setMobileSearch(false)}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </header>
  );
}
