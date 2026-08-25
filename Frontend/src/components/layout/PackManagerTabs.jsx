"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Briefcase,
  Settings2,
  FileText,
  BadgeCheck,
  Rocket,
  History,
  ScrollText,
} from "lucide-react";

const TABS = [
  { key: "overview", label: "Vue générale", href: "/business-manager", icon: Home, exact: true },
  { key: "applications", label: "Applications", href: "/business-manager/applications", icon: Briefcase },
  { key: "workspace", label: "Workspace & Configuration", href: "/business-manager/workspace", icon: Settings2 },
  { key: "versions", label: "Versions", href: "/business-manager/versions", icon: FileText },
  { key: "validation", label: "Validation", href: "/business-manager/validation", icon: BadgeCheck },
  { key: "publication", label: "Publication", href: "/business-manager/publication", icon: Rocket },
  { key: "historique", label: "Historique & Rollback", href: "/business-manager/historique", icon: History },
  { key: "specs", label: "Spécifications & Travail", href: "/business-manager/specs", icon: ScrollText },
];

export function PackManagerTabs() {
  const pathname = usePathname();

  const isActive = (tab) => {
    if (tab.exact) return pathname === tab.href || pathname === "/business-manager/";
    if (tab.key === "applications") return pathname.startsWith("/business-manager/applications");
    return pathname.startsWith(tab.href);
  };

  return (
    <div className="bg-white border-b border-slate-200/70 px-4 md:px-6 overflow-x-auto flex-shrink-0">
      <div className="flex items-center gap-1 min-w-max">
        {TABS.map((tab) => {
          const active = isActive(tab);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`flex items-center gap-2 px-4 py-4 text-[13px] font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                active
                  ? "border-[#2E6BE6] text-[#2E6BE6]"
                  : "border-transparent text-slate-500 hover:text-[#2E6BE6]"
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-[#2E6BE6]" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
