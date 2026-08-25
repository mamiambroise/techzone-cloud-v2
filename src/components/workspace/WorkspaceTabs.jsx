"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Database, Layers, Menu, FileText, FormInput, BarChart3, Workflow, Zap, GitBranch, Settings, Activity } from "lucide-react";
export function WorkspaceTabs({
  applicationId
}) {
  const pathname = usePathname();
  const baseUrl = `/business-manager/applications/${applicationId}`;
  const tabs = [{
    id: "overview",
    label: "Aperçu",
    href: `${baseUrl}/overview`,
    icon: LayoutDashboard,
    isP01Active: true
  }, {
    id: "versions",
    label: "Versions & Publication",
    href: `${baseUrl}/versions`,
    icon: GitBranch,
    badge: "P0.1",
    isP01Active: true
  }, {
    id: "settings",
    label: "Paramètres",
    href: `${baseUrl}/settings`,
    icon: Settings,
    isP01Active: true
  }, {
    id: "activity",
    label: "Audit & Activité",
    href: `${baseUrl}/activity`,
    icon: Activity,
    isP01Active: true
  },
  // Future pack engines (P0.2 - P0.9)
  {
    id: "data",
    label: "Données",
    href: `${baseUrl}/data`,
    icon: Database,
    badge: "P0.2",
    isP01Active: false
  }, {
    id: "features",
    label: "Fonctionnalités",
    href: `${baseUrl}/features`,
    icon: Layers,
    badge: "P0.3",
    isP01Active: false
  }, {
    id: "menus",
    label: "Menus",
    href: `${baseUrl}/menus`,
    icon: Menu,
    badge: "P0.3",
    isP01Active: false
  }, {
    id: "pages",
    label: "Pages",
    href: `${baseUrl}/pages`,
    icon: FileText,
    badge: "P0.4",
    isP01Active: false
  }, {
    id: "forms",
    label: "Formulaires",
    href: `${baseUrl}/forms`,
    icon: FormInput,
    badge: "P0.5",
    isP01Active: false
  }, {
    id: "dashboards",
    label: "Dashboards",
    href: `${baseUrl}/dashboards`,
    icon: BarChart3,
    badge: "P0.6",
    isP01Active: false
  }, {
    id: "workflows",
    label: "Workflows",
    href: `${baseUrl}/workflows`,
    icon: Workflow,
    badge: "P0.8",
    isP01Active: false
  }, {
    id: "automations",
    label: "Automatisations",
    href: `${baseUrl}/automations`,
    icon: Zap,
    badge: "P0.9",
    isP01Active: false
  }];
  return <div className="border-b border-slate-200/80 mb-6 overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1.5 min-w-max pb-px">
        {tabs.map(tab => {
        const isActive = pathname === tab.href;
        const Icon = tab.icon;
        return <Link key={tab.id} href={tab.href} className={`flex items-center gap-2 px-4 py-3 rounded-t-2xl text-xs font-bold transition-all relative border-b-2 ${isActive ? "border-indigo-600 text-indigo-600 bg-indigo-50/50 shadow-2xs" : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
              <span>{tab.label}</span>
              {tab.badge && <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${tab.isP01Active ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                  {tab.badge}
                </span>}
            </Link>;
      })}
      </div>
    </div>;
}