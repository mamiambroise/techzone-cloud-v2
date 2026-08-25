"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Search, Bell, Plus, Shield, ChevronDown, CheckCircle2 } from "lucide-react";
import { getCurrentActor, getCurrentUserRole, setCurrentUserRole } from "@/lib/api-client";
export function Navbar({
  onSearch
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState("ADMIN");
  const [actor, setActor] = useState(getCurrentActor());
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  useEffect(() => {
    setRole(getCurrentUserRole());
    setActor(getCurrentActor());
  }, []);
  const handleRoleChange = newRole => {
    setCurrentUserRole(newRole);
    setRole(newRole);
    setActor(getCurrentActor());
    setShowRoleMenu(false);
    // Reload active page so permission checks re-trigger
    window.location.reload();
  };
  const handleSearchChange = e => {
    const val = e.target.value;
    setSearchValue(val);
    if (onSearch) {
      onSearch(val);
    }
  };
  const roleLabels = {
    ADMIN: {
      title: "Administrateur",
      color: "bg-purple-100 text-purple-700 border-purple-200",
      desc: "Contrôle total & publication"
    },
    BUILDER: {
      title: "Builder / Éditeur",
      color: "bg-blue-100 text-blue-700 border-blue-200",
      desc: "Création, config & validation"
    },
    VIEWER: {
      title: "Lecteur (Invité)",
      color: "bg-slate-100 text-slate-700 border-slate-200",
      desc: "Consultation uniquement"
    }
  };
  return <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-slate-100 bg-white/95 px-6 backdrop-blur-md">
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Rechercher une application, code, catégorie..." value={searchValue} onChange={handleSearchChange} className="w-full h-11 pl-10 pr-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner/50" />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        <div className="relative">
          <button onClick={() => setShowRoleMenu(!showRoleMenu)} className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold shadow-2xs hover:shadow-xs transition-all ${roleLabels[role].color}`} title="Changer de rôle pour tester les règles d'autorisation">
            <Shield className="w-3.5 h-3.5" />
            <span>Rôle: {roleLabels[role].title}</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>

          {showRoleMenu && <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-100 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-800">Sélection du Rôle Utilisateur</p>
                <p className="text-[11px] text-slate-500">Permet de tester le contrôle d'accès RBAC côté backend</p>
              </div>
              <div className="space-y-1 mt-1">
                {["ADMIN", "BUILDER", "VIEWER"].map(r => <button key={r} onClick={() => handleRoleChange(r)} className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between ${role === r ? "bg-indigo-50 text-indigo-700 font-bold" : "hover:bg-slate-50 text-slate-700"}`}>
                    <div>
                      <p className="font-semibold">{roleLabels[r].title}</p>
                      <p className="text-[11px] text-slate-400 font-normal">{roleLabels[r].desc}</p>
                    </div>
                    {role === r && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
                  </button>)}
              </div>
            </div>}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2.5 rounded-2xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-600" />
          </button>

          {showNotifications && <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-100 shadow-xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Notifications Système</span>
                <span className="text-[11px] text-indigo-600 font-medium">Business Manager</span>
              </div>
              <div className="py-2 space-y-2 text-xs text-slate-600">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <p className="font-semibold text-slate-800">Pack Manager P0.1 Actif</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Le socle applicatif et les transactions de publication sont opérationnels.</p>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-800">
                  <p className="font-semibold">Publication Transactionnelle</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">La version 1.1.0 de Boutique est active en production.</p>
                </div>
              </div>
            </div>}
        </div>

        {/* Primary CTA */}
        {role !== "VIEWER" && <Link href="/business-manager/applications/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            <span>Nouvelle application</span>
          </Link>}

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {actor.name.charAt(0)}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-tight">{actor.name}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{roleLabels[role].title}</p>
          </div>
        </div>
      </div>
    </header>;
}