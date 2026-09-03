import React, { useEffect, useState } from "react";
import { HelpCircle, LogOut, Menu, Search, Settings } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { findNavigationItem } from "../../lib/navigationConfig";

export function Header({ onToggleSidebar, onOpenHelp, onOpenSettings }) {
  const { currentUser, currentTenant, globalSearch, setGlobalSearch, logout } =
    useApp();
  const [pathname, setPathname] = useState(
    () => window.location.pathname || "/dashboard",
  );
  const [profileOpen, setProfileOpen] = useState(false);
  useEffect(() => {
    const update = () => setPathname(window.location.pathname || "/dashboard");
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const activeRoute = findNavigationItem(pathname);

  return (
    <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200/80 bg-white px-3 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="min-w-0">
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 sm:block">
            Techzone Cloud
          </span>
          <strong className="block truncate text-xs text-slate-900">
            {activeRoute?.label || "Plateforme"}
          </strong>
        </div>
      </div>

      <div className="hidden max-w-md flex-1 md:block">
        <label className="relative block">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={globalSearch}
            onChange={(event) => setGlobalSearch(event.target.value)}
            placeholder="Rechercher dans la page…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-400 focus:bg-white"
          />
        </label>
      </div>

      <div className="flex items-center gap-1.5">
        <span className="hidden rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500 lg:inline">
          {currentTenant?.name || "TENANT JWT"}
        </span>
        <button
          type="button"
          onClick={onOpenHelp}
          aria-label="Aide"
          className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Préférences"
          className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
        >
          <Settings className="h-4 w-4" />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((value) => !value)}
            className="flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-2 text-left"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-blue-600 text-[10px] font-black text-white">
              {currentUser.avatarInitials}
            </span>
            <span className="hidden text-[10px] font-bold text-slate-700 sm:block">
              {currentUser.role}
            </span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
              <strong className="block truncate text-xs text-slate-900">
                {currentUser.name}
              </strong>
              <span className="block truncate text-[11px] text-slate-500">
                {currentUser.email}
              </span>
              <p className="mt-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[10px] text-slate-500">
                Rôle et permissions issus du JWT backend.
              </p>
              <button
                type="button"
                onClick={() => logout()}
                className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
