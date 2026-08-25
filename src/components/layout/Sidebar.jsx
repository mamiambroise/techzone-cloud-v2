"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Boxes, Sparkles, Activity, CheckSquare, ShieldCheck } from "lucide-react";
export function Sidebar() {
  const pathname = usePathname();
  const navItems = [{
    label: "Tableau de bord",
    href: "/business-manager",
    icon: LayoutDashboard,
    badge: null,
    exact: true
  }, {
    label: "Applications",
    href: "/business-manager/applications",
    icon: Boxes,
    badge: "Core",
    exact: false
  }, {
    label: "Modèles & Packs",
    href: "/business-manager/templates",
    icon: Sparkles,
    badge: "5",
    exact: false
  }, {
    label: "Activité Globale",
    href: "/business-manager/activity",
    icon: Activity,
    badge: "Live",
    exact: false
  }, {
    label: "Banc de Test & E2E",
    href: "/business-manager/e2e-suite",
    icon: CheckSquare,
    badge: "Specs",
    exact: false
  }];
  const isActive = item => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href);
  };
  return <aside className="w-72 flex-shrink-0 bg-[#4F46E5] min-h-screen text-white flex flex-col justify-between p-5 relative overflow-hidden select-none">
      {/* Subtle background glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div>
        <Link href="/business-manager" className="flex items-center gap-3 px-3 py-2 mb-8 group">
          <div className="w-11 h-11 rounded-2xl bg-white text-indigo-600 flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-950/20 group-hover:scale-105 transition-transform">
            B
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-white">Business</span>
              <span className="text-indigo-200 font-medium text-lg">Manager</span>
            </div>
            <p className="text-[10px] text-indigo-200 font-semibold tracking-wider uppercase">P0.1 Pack Manager</p>
          </div>
        </Link>

        {/* Navigation Section */}
        <div className="space-y-1.5">
          <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-indigo-200/70 mb-2">
            Gestion Centrale
          </p>
          {navItems.map(item => {
          const active = isActive(item);
          const Icon = item.icon;
          return <Link key={item.href} href={item.href} className={`relative flex items-center justify-between px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${active ? "bg-white text-indigo-700 shadow-md shadow-indigo-900/10 font-bold translate-x-1" : "text-indigo-100 hover:bg-white/10 hover:text-white"}`}>
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${active ? "text-indigo-600" : "text-indigo-200"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${active ? "bg-indigo-100 text-indigo-800" : "bg-indigo-500/40 text-indigo-100 border border-indigo-400/30"}`}>
                    {item.badge}
                  </span>}
              </Link>;
        })}
        </div>
      </div>

      {/* Mini Architecture Info Box */}
      <div className="pt-6">
        <div className="p-4 rounded-3xl bg-indigo-700/60 border border-indigo-400/30 backdrop-blur-sm shadow-inner relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-xl bg-white/20 text-white">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold text-white">Architecture Core</p>
              <p className="text-[10px] text-indigo-200">Socle P0.1 Validé</p>
            </div>
          </div>
          <p className="text-[11px] text-indigo-100/90 leading-relaxed">
            Point de rattachement central pour les futurs moteurs (Data Models P0.2, Features P0.3, Workflows).
          </p>
          <div className="mt-3 pt-3 border-t border-indigo-400/30 flex items-center justify-between text-[11px] font-medium text-indigo-200">
            <span>Environnement</span>
            <span className="font-bold text-white uppercase tracking-wider">DEV / PROD</span>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 px-2 flex items-center justify-between text-[10px] text-indigo-200/60 font-medium">
          <span>Business Manager v0.1.0</span>
          <span>Next.js + Drizzle</span>
        </div>
      </div>
    </aside>;
}