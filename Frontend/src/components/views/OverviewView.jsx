// OverviewView.jsx — Exact match of Image 1 (Dashboard Global)
import React, { useState } from 'react';
import {
  RotateCw,
  Calendar,
  Boxes,
  CheckCircle2,
  FileCode2,
  Sparkles,
  ShieldAlert,
  ChevronDown,
  ArrowRight,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/StatusBadge';
import { IconRenderer } from '../common/IconRenderer';

export function OverviewView() {
  const {
    applications,
    versions,
    activities,
    stats,
    setCurrentView,
    openApplicationWorkspace,
    showToast,
    selectedAppId,
    setSelectedAppId,
    selectedEnvironment,
    setSelectedEnvironment,
    syncFromBackend,
  } = useApp();

  const [period, setPeriod] = useState('30 derniers jours');
  const [selectedVerFilter, setSelectedVerFilter] = useState('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await syncFromBackend();
      showToast('Données et statistiques actualisées');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-300">
      {/* 1. Header Title & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Vue d ensemble — Business Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pilotage global des applications métier et de leur cycle de vie.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs transition-all active:scale-95"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Actualiser</span>
          </button>

          <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Période : {period}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 2. Top Filter Context Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        {/* Application Selector */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <Boxes className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Application
            </label>
            <select
              value={selectedAppId || 'ALL'}
              onChange={(e) => setSelectedAppId(e.target.value === 'ALL' ? null : e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer truncate"
            >
              <option value="ALL">Toutes les applications</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Version Selector */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <FileCode2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Version
            </label>
            <select
              value={selectedVerFilter}
              onChange={(e) => setSelectedVerFilter(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer truncate"
            >
              <option value="ALL">Toutes les versions</option>
              <option value="PUBLISHED">Versions publiées (Stables)</option>
              <option value="DRAFT">Versions en cours (Draft)</option>
              <option value="READY">Prêtes à publier</option>
            </select>
          </div>
        </div>

        {/* Environment Selector */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/60">
          <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Environnement
            </label>
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer truncate"
            >
              <option value="ALL">Tous les environnements</option>
              <option value="PRODUCTION">PRODUCTION</option>
              <option value="STAGING">STAGING</option>
              <option value="TEST">TEST</option>
              <option value="DEVELOPMENT">DEVELOPMENT</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. 5 KPI Summary Cards (Exact match of Screenshot 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: APPLICATIONS */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-500">
              Applications
            </span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.totalApplications}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-semibold">Total</span>
          </div>
          <button
            onClick={() => setCurrentView('applications')}
            className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 self-start"
          >
            <span>Voir la liste</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: ACTIVES */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-500">
              Actives
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.activeApplications}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-semibold">En production</span>
          </div>
          <button
            onClick={() => setCurrentView('applications')}
            className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 self-start"
          >
            <span>Voir la liste</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: VERSIONS DRAFT */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-500">
              Versions Draft
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <FileCode2 className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.draftApplications + 1}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-semibold">En cours</span>
          </div>
          <button
            onClick={() => setCurrentView('versions')}
            className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 self-start"
          >
            <span>Voir la liste</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: PRÊTES À PUBLIER */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-500">
              Prêtes à publier
            </span>
            <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-slate-900 tracking-tight">
              {stats.readyApplications || 1}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-semibold">Validation OK</span>
          </div>
          <button
            onClick={() => setCurrentView('versions')}
            className="text-[11px] font-extrabold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 self-start"
          >
            <span>Voir la liste</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 5: PROBLÈMES BLOQUANTS */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black tracking-wider uppercase text-slate-500">
              Problèmes bloquants
            </span>
            <div className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <span className="text-3xl font-black text-red-600 tracking-tight">
              {stats.blockingIssuesCount}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-semibold">Nécessitent action</span>
          </div>
          <button
            onClick={() => setCurrentView('validation')}
            className="text-[11px] font-extrabold text-red-600 hover:text-red-800 inline-flex items-center gap-1 self-start"
          >
            <span>Voir les problèmes</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 4. Three Middle Analytics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card 1: Répartition par environnement (Interactive Donut) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Répartition par environnement
            </h3>
            <button
              onClick={() => setCurrentView('applications')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Voir le détail</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            {/* SVG Donut Chart */}
            <div className="relative w-32 h-32 flex-shrink-0 flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                {/* Production Segment (50%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#10B981"
                  strokeWidth="12"
                  strokeDasharray="119.38 119.38"
                  strokeDashoffset="0"
                  fill="none"
                  className="transition-all duration-700"
                />
                {/* Staging Segment (16.7%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#F59E0B"
                  strokeWidth="12"
                  strokeDasharray="39.8 198.9"
                  strokeDashoffset="-119.38"
                  fill="none"
                />
                {/* Test Segment (16.7%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#8B5CF6"
                  strokeWidth="12"
                  strokeDasharray="39.8 198.9"
                  strokeDashoffset="-159.18"
                  fill="none"
                />
                {/* Dev Segment (16.7%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#3B82F6"
                  strokeWidth="12"
                  strokeDasharray="39.8 198.9"
                  strokeDashoffset="-198.98"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-xl font-black text-slate-900 leading-none">
                  {stats.totalApplications}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="flex-1 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-700">PRODUCTION</span>
                </div>
                <span className="font-mono font-bold text-slate-900">3 <span className="text-slate-400 font-normal">(50%)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="font-bold text-slate-700">STAGING</span>
                </div>
                <span className="font-mono font-bold text-slate-900">1 <span className="text-slate-400 font-normal">(16.7%)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="font-bold text-slate-700">TEST</span>
                </div>
                <span className="font-mono font-bold text-slate-900">1 <span className="text-slate-400 font-normal">(16.7%)</span></span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span className="font-bold text-slate-700">DEVELOPMENT</span>
                </div>
                <span className="font-mono font-bold text-slate-900">1 <span className="text-slate-400 font-normal">(16.7%)</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: État des versions (toutes applications) (Bar Chart) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              État des versions (toutes applications)
            </h3>
            <button
              onClick={() => setCurrentView('versions')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Voir le détail</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="py-4 flex items-end justify-between gap-3 h-36 px-2">
            {/* Bar 1: DRAFT */}
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[11px] font-bold text-slate-700">2</span>
              <div className="w-full max-w-[28px] bg-slate-200 rounded-t-lg h-[50%]" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">DRAFT</span>
            </div>

            {/* Bar 2: CONFIGURING */}
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[11px] font-bold text-slate-700">2</span>
              <div className="w-full max-w-[28px] bg-blue-600 rounded-t-lg h-[50%]" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">CONFIG</span>
            </div>

            {/* Bar 3: READY */}
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[11px] font-bold text-slate-700">1</span>
              <div className="w-full max-w-[28px] bg-sky-500 rounded-t-lg h-[25%]" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">READY</span>
            </div>

            {/* Bar 4: PUBLISHED */}
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[11px] font-bold text-slate-700">3</span>
              <div className="w-full max-w-[28px] bg-emerald-600 rounded-t-lg h-[75%]" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">PUBLISHED</span>
            </div>

            {/* Bar 5: ARCHIVED */}
            <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <span className="text-[11px] font-bold text-slate-700">1</span>
              <div className="w-full max-w-[28px] bg-slate-300 rounded-t-lg h-[25%]" />
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">ARCHIVED</span>
            </div>
          </div>
        </div>

        {/* Card 3: Qualité & Validation (Radial Score Gauge) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Qualité & Validation
            </h3>
            <button
              onClick={() => setCurrentView('validation')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Voir le détail</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 py-4">
            {/* Circular Gauge */}
            <div className="relative w-28 h-28 flex-shrink-0 flex items-center justify-center">
              <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="#F1F5F9" strokeWidth="10" fill="none" />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#3B82F6"
                  strokeWidth="10"
                  strokeDasharray="186.2 238.7"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black text-slate-900 leading-none">
                  {stats.qualityScore}%
                </span>
                <span className="text-[9px] font-bold text-slate-400 max-w-[60px] leading-tight mt-1">
                  Score de qualité moyen
                </span>
              </div>
            </div>

            {/* Campaign Stats */}
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-800 pb-1 border-b border-slate-100">
                <span>Campagnes exécutées</span>
                <span className="font-mono">12</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-emerald-700 font-bold">Réussies</span>
                <span className="font-mono font-bold">8 <span className="text-slate-400 font-normal">(66.7%)</span></span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-amber-700 font-bold">Avec avertissements</span>
                <span className="font-mono font-bold">2 <span className="text-slate-400 font-normal">(16.7%)</span></span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-red-700 font-bold">Échouées</span>
                <span className="font-mono font-bold">2 <span className="text-slate-400 font-normal">(16.7%)</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Row: Attention Requise + Applications Récentes + Journal d'audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: Attention Requise */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Attention requise
            </h3>
            <button
              onClick={() => setCurrentView('validation')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 py-3">
            {/* Alert 1 */}
            <div
              onClick={() => setCurrentView('validation')}
              className="p-3.5 rounded-xl bg-red-50/70 border border-red-200/80 hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-red-950 group-hover:text-red-700">
                    2 problèmes bloquants détectés
                  </p>
                  <p className="text-[11px] text-red-800/80 mt-0.5">
                    Empêchent la publication de 1 version
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Alert 2 */}
            <div
              onClick={() => setCurrentView('versions')}
              className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 hover:bg-amber-50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-950 group-hover:text-amber-700">
                    1 validation obsolète
                  </p>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">
                    Après modification sur 1 version
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Alert 3 */}
            <div
              onClick={() => setCurrentView('applications')}
              className="p-3.5 rounded-xl bg-orange-50/70 border border-orange-200/80 hover:bg-orange-50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-orange-950 group-hover:text-orange-700">
                    1 intégration invalide
                  </p>
                  <p className="text-[11px] text-orange-800/80 mt-0.5">
                    Échec de dernière vérification de connexion
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 transition-transform" />
            </div>

            {/* Alert 4: IAM & Security Status */}
            <div
              onClick={() => setCurrentView('iam-overview')}
              className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 hover:bg-purple-50 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
            >
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-950 group-hover:text-purple-700">
                    Global Status IAM (IAM-CDC-01)
                  </p>
                  <p className="text-[11px] text-purple-800/80 mt-0.5">
                    Santé 94% • Sécurité nominale • 4 indicateurs
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Center Column: Applications Récentes */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Applications récentes
            </h3>
            <button
              onClick={() => setCurrentView('applications')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Voir tout ({applications.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 py-1">
            {applications.slice(0, 4).map((app) => (
              <div key={app.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <IconRenderer name={app.icon} className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate">{app.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate">
                      #{app.code} • {app.category}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right hidden sm:block">
                    <StatusBadge status={app.status} size="xs" />
                    <span className="block font-mono text-[10px] text-slate-400 mt-0.5">
                      v{app.publishedVersionNumber || app.currentVersionNumber || '1.0.0'}
                    </span>
                  </div>
                  <button
                    onClick={() => openApplicationWorkspace(app.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-xs font-bold text-slate-700 transition-colors"
                  >
                    Ouvrir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Journal d'audit (récent) */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Journal d audit (récent)
            </h3>
            <button
              onClick={() => setCurrentView('audit')}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Voir tout</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 py-1 text-xs">
            {activities.slice(0, 4).map((item) => (
              <div key={item.id} className="py-2.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-black flex items-center justify-center">
                      {item.actorId || 'AD'}
                    </span>
                    <span className="font-bold text-slate-800">{item.actorName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(item.createdAt).toLocaleTimeString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-mono truncate">{item.action}</span>
                  <span className="text-[10px] text-blue-600 font-bold truncate max-w-[120px]">
                    {item.applicationName}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
