"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, ChevronDown } from "lucide-react";
import { getCurrentActor } from "@/lib/api-client";

const MENU_ITEMS = [
  { num: "01", label: "Application / Pack Manager", href: "/business-manager", tag: "P0.1" },
  { num: "02", label: "Data Model Manager", href: "/business-manager/data", tag: "P0.2" },
  { num: "03", label: "Feature & Capability Manager", tag: "P0.3" },
  { num: "04", label: "Menu Engine", tag: "P0.3" },
  { num: "05", label: "Page & UI Builder", tag: "P0.4" },
  { num: "06", label: "Form Engine", tag: "P0.5" },
  { num: "07", label: "Dashboard Engine", tag: "P0.6" },
  { num: "08", label: "Query Engine", tag: "P0.7" },
  { num: "09", label: "Rule & Formula Engine", tag: "P0.7" },
  { num: "10", label: "Workflow Engine", tag: "P0.8" },
  { num: "11", label: "Automation Engine", tag: "P0.9" },
  { num: "12", label: "Version & Sandbox Manager", tag: "P0.1" },
  { num: "13", label: "Publication & Rollback Manager", tag: "P0.1" },
  { num: "14", label: "Audit & Health", tag: "P0.1" },
  { num: "15", label: "Approval Engine", tag: "P0.8" },
  { num: "16", label: "Report & Document Builder", tag: "P0.9" },
  { num: "17", label: "Notification Manager", tag: "P0.9" },
  { num: "18", label: "Extension & Template Manager", tag: "P1.0" },
];

function StorageBar({ label, used, total, pct }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-blue-100">
        <span className="font-semibold">{label}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-blue-200/80">
        {used} sur {total}
      </p>
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const actor = getCurrentActor();
  const initials = actor.name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="w-64 lg:w-72 flex-shrink-0 bg-[#2E6BE6] rounded-tr-[44px] text-white flex flex-col min-h-0 select-none">
      {/* White pill CTA (Upload New Files style) */}
      <div className="px-5 pt-6 pb-4">
        <Link
          href="/business-manager/applications/new"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-white text-[#2E6BE6] text-xs font-extrabold shadow-lg shadow-blue-900/20 hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouvelle application
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = item.href
            ? item.href === "/business-manager"
              ? pathname === "/business-manager" ||
                (pathname.startsWith("/business-manager") && !pathname.startsWith("/business-manager/data"))
              : pathname.startsWith(item.href)
            : false;
          const cls = `flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-colors ${
            isActive
              ? "bg-white/20 border border-white/20 text-white shadow-sm"
              : "text-blue-100/85 hover:bg-white/10 hover:text-white"
          }`;
          const inner = (
            <>
              <span className={`w-6 h-6 rounded-full ${isActive ? "bg-white text-[#2E6BE6]" : "bg-white/15 text-white/90"} text-[10px] font-black flex items-center justify-center flex-shrink-0`}>
                {item.num}
              </span>
              <span className="text-[12.5px] font-bold flex-1 truncate">{item.label}</span>
              {item.href === "/business-manager" && <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
            </>
          );
          return item.href ? (
            <Link key={item.num} href={item.href} className={cls}>
              {inner}
            </Link>
          ) : (
            <div key={item.num} className={`${cls} cursor-default`} title={`${item.label} — planifié (${item.tag})`}>
              {inner}
            </div>
          );
        })}
      </nav>

      {/* Storage details block */}
      <div className="px-5 pb-4 space-y-4">
        <p className="text-[10px] font-black tracking-widest text-blue-200 uppercase">Capacité du socle</p>
        <StorageBar label="Modules livrés" used="1 module" total="18 moteurs" pct={6} />
        <StorageBar label="Couverture specs P0.1" used="100%" total="100%" pct={100} />
        <Link
          href="/business-manager/specs"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white hover:text-blue-100 transition-colors"
        >
          Feuille de route
          <span aria-hidden>↗</span>
        </Link>
      </div>

      {/* Profile */}
      <div className="px-4 pb-5">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 border border-white/10">
          <div className="w-9 h-9 rounded-full bg-white text-[#2E6BE6] font-black text-xs flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-bold text-white truncate">{actor.name}</p>
            <p className="text-[10.5px] text-blue-200 truncate">
              {actor.role === "ADMIN" ? "Administrateur" : actor.role === "BUILDER" ? "Builder / Éditeur" : "Lecteur"}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-blue-200" />
        </div>
      </div>
    </aside>
  );
}
