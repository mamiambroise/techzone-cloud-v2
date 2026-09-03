import React, { useState } from "react";
import {
  Activity, Bell, BriefcaseBusiness, ChevronDown, ChevronsLeft,
  ChevronsRight, Database, FileText, GitBranch, Layers, LayoutTemplate,
  Package, Plug, Settings, ShieldCheck, X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { findNavigationAncestors, navigationConfig } from "../../lib/navigationConfig";

const moduleIcons = {
  "platform.foundation": Layers, "platform.iam": ShieldCheck,
  "platform.billing": Settings, "platform.observability": Activity,
  "design.bm": BriefcaseBusiness, "design.pm": Package,
  "runtime.erp": Plug, "runtime.pr": Activity, "experience.ui": LayoutTemplate,
  "data.model": Database, "data.query": Database, "data.features": ShieldCheck,
  "automation.rules": GitBranch, "automation.workflow": GitBranch,
  "automation.approval": ShieldCheck, "automation.engine": Activity,
  "communication.notifications": Bell, "communication.reports": FileText,
  "extensions.manager": Plug, "extensions.integrations": Plug,
  "extensions.developer": FileText, "extensions.marketplace": Package,
  "delivery.versioning": GitBranch, "delivery.publication": Activity,
  "administration.platform": Settings,
};

function hasActiveRoute(item, path) {
  return item.path === path || item.children?.some((child) => hasActiveRoute(child, path));
}

function NavigationTree({ items, level = 0, collapsed, isMobileDrawer, currentPath, onNavigate, expanded, onToggleGroup }) {
  return items.map((item) => {
    if (item.standalone) {
      const active = currentPath === item.path;
      return <button key={item.id} type="button" onClick={() => onNavigate(item)} aria-current={active ? "page" : undefined} className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold ${active ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800/70 hover:text-white"}`} title={item.label}><Layers className="h-4 w-4 shrink-0" />{(!collapsed || isMobileDrawer) && <span className="truncate">{item.label}</span>}</button>;
    }
    if (item.children) {
      const isOpen = expanded.has(item.id);
      const isModule = level === 1;
      const active = hasActiveRoute(item, currentPath);
      const ModuleIcon = moduleIcons[item.id] || Layers;
      return <div key={item.id} className={level === 0 ? "mt-4" : "mt-2"}>
        {isModule && collapsed && !isMobileDrawer && <button type="button" onClick={() => onToggleGroup(item.id)} aria-expanded={isOpen} className={`mx-auto flex h-9 w-9 items-center justify-center rounded-lg ${active ? "bg-blue-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`} title={item.label}><ModuleIcon className="h-4 w-4" /></button>}
        {(!collapsed || isMobileDrawer) && <button type="button" onClick={() => onToggleGroup(item.id)} className={`flex w-full items-center justify-between text-left ${isModule ? "rounded-lg px-2.5 py-2 text-[12px] font-semibold text-slate-200 hover:bg-slate-800/70" : "px-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"}`} aria-expanded={isOpen}><span className="flex min-w-0 items-center gap-2 truncate">{isModule && <ModuleIcon className={`h-4 w-4 shrink-0 ${active ? "text-blue-400" : "text-slate-500"}`} />}<span className="truncate">{item.label}</span></span><ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`} /></button>}
        {isOpen && (!collapsed || isMobileDrawer) && <div className={`border-l border-slate-700/70 ${isModule ? "ml-4 mt-0.5 space-y-0.5 pl-2" : level === 0 ? "space-y-1" : "space-y-0.5"}`}><NavigationTree items={item.children} level={level + 1} collapsed={collapsed} isMobileDrawer={isMobileDrawer} currentPath={currentPath} onNavigate={onNavigate} expanded={expanded} onToggleGroup={onToggleGroup} /></div>}
      </div>;
    }
    const active = currentPath === item.path;
    const statusLabel = item.status === "COMING_SOON" ? "BIENTÔT" : item.status === "PARTIAL" ? "PARTIEL" : "";
    return <button key={item.id} type="button" onClick={() => onNavigate(item)} aria-current={active ? "page" : undefined} className={`flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[11px] ${active ? "border-l-2 border-blue-400 bg-blue-500/10 pl-2 font-semibold text-white" : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-100"}`} title={item.label}><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.status === "AVAILABLE" ? "bg-emerald-400" : item.status === "PARTIAL" ? "bg-amber-400" : "bg-slate-500"}`} />{(!collapsed || isMobileDrawer) && <><span className="min-w-0 flex-1 truncate">{item.label}</span>{statusLabel && <span className="shrink-0 rounded bg-slate-800 px-1 py-0.5 text-[8px] font-bold text-slate-400">{statusLabel}</span>}</>}</button>;
  });
}

export function Sidebar({ collapsed, onToggleCollapse, onCloseMobile, isMobileDrawer }) {
  const { setCurrentView } = useApp();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || "/dashboard");
  const [expanded, setExpanded] = useState(() => new Set(findNavigationAncestors(window.location.pathname || "/dashboard") || []));
  const onToggleGroup = (id) => setExpanded((current) => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const onNavigate = (item) => {
    const path = item.path || "/dashboard";
    window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate"));
    setCurrentPath(path); setCurrentView(item.view || path);
    setExpanded((current) => new Set([...current, ...(findNavigationAncestors(path) || [])])); onCloseMobile?.();
  };
  return <aside className={`z-30 flex h-screen flex-col border-r border-[#162238] bg-[#0A1329] text-slate-300 transition-all ${isMobileDrawer ? "w-72 max-w-[85vw]" : collapsed ? "w-14" : "w-60 lg:w-64"}`}>
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-[#162238]/80 px-3">{(!collapsed || isMobileDrawer) && <button type="button" onClick={() => onNavigate(navigationConfig[0])} className="flex min-w-0 items-center gap-2.5 text-left"><span className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-white"><Layers className="h-4 w-4" /></span><span className="min-w-0"><strong className="block truncate text-[13px] text-white">Techzone Cloud</strong><small className="block truncate text-[9px] font-semibold uppercase tracking-wider text-slate-400">Platform control plane</small></span></button>}{onCloseMobile && <button type="button" onClick={onCloseMobile} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 md:hidden" aria-label="Fermer le menu"><X className="h-4 w-4" /></button>}<button type="button" onClick={onToggleCollapse} className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 md:block" aria-label={collapsed ? "Agrandir le menu" : "Réduire le menu"}>{collapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}</button></div>
    <div className="flex-1 overflow-y-auto px-2 py-3"><NavigationTree items={navigationConfig} collapsed={collapsed} isMobileDrawer={isMobileDrawer} currentPath={currentPath} onNavigate={onNavigate} expanded={expanded} onToggleGroup={onToggleGroup} /></div>
    {(!collapsed || isMobileDrawer) && <div className="border-t border-[#162238] px-3 py-3 text-[10px] text-slate-500">Navigation plateforme</div>}
  </aside>;
}

export default Sidebar;
