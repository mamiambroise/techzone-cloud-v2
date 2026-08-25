"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layers, Search, Bell, HelpCircle, Settings, SlidersHorizontal, CheckCircle2 } from "lucide-react";
import { getCurrentActor, getCurrentUserRole, setCurrentUserRole } from "@/lib/api-client";

export function Topbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [role, setRole] = useState("ADMIN");
  const [actor, setActor] = useState(getCurrentActor());

  useEffect(() => {
    setRole(getCurrentUserRole());
    setActor(getCurrentActor());
  }, []);

  const initials = actor.name
    .split(" ")
    .map((p) => p.charAt(0))
    .slice(0, 1)
    .join("")
    .toUpperCase();

  const roleLabels = {
    ADMIN: "Administrateur",
    BUILDER: "Builder / Éditeur",
    VIEWER: "Lecteur",
  };

  const changeRole = (r) => {
    setCurrentUserRole(r);
    setRole(r);
    setActor(getCurrentActor());
    setShowProfile(false);
    window.location.reload();
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/business-manager/applications?search=${encodeURIComponent(q)}` : "/business-manager/applications");
  };

  return (
    <header className="h-[72px] flex-shrink-0 bg-white flex items-center gap-4 px-5 md:px-8 relative z-30">
      {/* Brand */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#2E6BE6] text-white flex items-center justify-center shadow-sm shadow-blue-300">
          <Layers className="w-5 h-5" />
        </div>
        <span className="text-lg font-extrabold text-[#1E4FC2] tracking-tight whitespace-nowrap">
          Business Manager
        </span>
        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md bg-blue-50 text-[#2E6BE6] text-[10px] font-black tracking-wider">
          P0.1
        </span>
      </div>

      {/* Centered search pill */}
      <form onSubmit={submitSearch} className="flex-1 max-w-xl mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une application, un code..."
            className="w-full h-10 pl-11 pr-4 rounded-full bg-[#F1F4FB] border border-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-200 focus:ring-2 focus:ring-blue-100 transition-all"
          />
        </div>
      </form>

      {/* Right icons */}
      <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
        <button
          className="p-2.5 rounded-full text-slate-500 hover:text-[#2E6BE6] hover:bg-blue-50 transition-colors relative"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        <button
          className="p-2.5 rounded-full text-slate-500 hover:text-[#2E6BE6] hover:bg-blue-50 transition-colors"
          title="Aide"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          className="p-2.5 rounded-full text-slate-500 hover:text-[#2E6BE6] hover:bg-blue-50 transition-colors hidden sm:block"
          title="Paramètres"
        >
          <Settings className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 pl-2 md:pl-3 ml-1 md:border-l md:border-slate-100">
          <span className="hidden lg:block text-xs font-bold text-slate-500 capitalize">
            {actor.name.split(" ")[0]}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="w-9 h-9 rounded-full bg-[#2E6BE6] text-white font-black text-sm flex items-center justify-center hover:bg-[#1E4FC2] transition-colors"
              title="Profil & rôle actif"
            >
              {initials}
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-900">{actor.name}</p>
                  <p className="text-[11px] text-slate-500">{actor.email}</p>
                </div>
                <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Rôle actif (test RBAC)
                </p>
                {["ADMIN", "BUILDER", "VIEWER"].map((r) => (
                  <button
                    key={r}
                    onClick={() => changeRole(r)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      role === r ? "bg-blue-50 text-[#2E6BE6] font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <span>{roleLabels[r]}</span>
                    {role === r && <CheckCircle2 className="w-4 h-4 text-[#2E6BE6]" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowProfile(!showProfile)}
          className="p-2.5 rounded-full text-slate-500 hover:text-[#2E6BE6] hover:bg-blue-50 transition-colors"
          title="Rôles & préférences"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
