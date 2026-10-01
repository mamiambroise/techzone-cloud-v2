import React, { useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, ArrowUpRight } from "lucide-react";
import api from "../services/apiClient.js";
import { useTenant } from "../contexts/TenantProvider.jsx";
export default function GlobalSearch({ onCloseMobile }) {
  const resultsId = useId();
  const { activeTenant, loading: tenantLoading } = useTenant();
  const [query, setQuery] = useState(""),
    [open, setOpen] = useState(false),
    [state, setState] = useState({ groups: {}, loading: false });
  const input = useRef(null),
    box = useRef(null),
    location = useLocation();
  useEffect(() => {
    setQuery("");
    setOpen(false);
    setState({ groups: {}, loading: false });
  }, [activeTenant?.id, location.pathname]);
  useEffect(() => {
    const key = (e) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "k" &&
        box.current?.getClientRects().length
      ) {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        onCloseMobile?.();
      }
    };
    const outside = (e) => {
      if (!box.current?.contains(e.target)) setOpen(false);
    };
    window.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => {
      window.removeEventListener("keydown", key);
      document.removeEventListener("pointerdown", outside);
    };
  }, [onCloseMobile]);
  useEffect(() => {
    const controller = new AbortController();
    if (query.trim().length < 2 || !activeTenant?.id || tenantLoading) {
      setState({ groups: {}, loading: false });
      return;
    }
    setState({ groups: {}, loading: true });
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get("/platform/search", {
          params: { q: query },
          signal: controller.signal,
        });
        if (!controller.signal.aborted && data.tenantId === activeTenant.id)
          setState({ groups: data.groups, loading: false, tenantId: data.tenantId });
      } catch {
        if (!controller.signal.aborted)
          setState({ groups: {}, error: true, loading: false });
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, activeTenant?.id, tenantLoading]);
  const visibleGroups = !tenantLoading && state.tenantId === activeTenant?.id ? state.groups : {};
  const rows = Object.entries(visibleGroups).flatMap(([group, widget]) =>
    (Array.isArray(widget.data) ? widget.data : []).map((r) => ({
      ...r,
      group,
    })),
  );
  const labels = {
    applications: "Applications",
    packs: "Packs",
    environments: "Environnements",
  };
  return (
    <div ref={box} className="relative w-full">
      <label className="relative block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-2.5 text-slate-400"
        />
        <input
          ref={input}
          aria-label="Recherche globale"
          aria-expanded={open}
          aria-controls={resultsId}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Applications, packs, environnements…"
          className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-9 pr-10 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50"
        />
        <span className="pointer-events-none absolute right-2 top-2 text-[10px] text-slate-400">
          ⌘ K
        </span>
      </label>
      {open && (
        <div
          id={resultsId}
          className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-lg"
        >
          {state.loading ? (
            <p role="status" className="p-3 text-xs text-slate-500">
              Recherche…
            </p>
          ) : state.error ? (
            <p role="alert" className="p-3 text-xs text-slate-500">
              Recherche temporairement indisponible.
            </p>
          ) : query.trim().length < 2 ? (
            <p className="p-3 text-xs text-slate-500">
              Saisissez au moins deux caractères.
            </p>
          ) : !rows.length ? (
            <p className="p-3 text-xs text-slate-500">
              Aucun résultat accessible.
            </p>
          ) : (
            rows.map((row) => (
              <Link
                key={row.group + row.id}
                to={row.targetRoute}
                onClick={() => {
                  setOpen(false);
                  onCloseMobile?.();
                }}
                className="flex items-center gap-2 rounded-lg p-2.5 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">
                    {row.name}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {labels[row.group]}
                  </span>
                </span>
                <ArrowUpRight size={14} />
              </Link>
            ))
          )}
          {Object.values(visibleGroups).some((w) => w.state === "ERROR") && (
            <p className="p-2 text-[11px] text-amber-700">
              Certains résultats sont momentanément indisponibles.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
