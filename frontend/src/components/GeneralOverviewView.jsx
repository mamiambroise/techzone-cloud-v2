import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedAppId } from '../store/applicationsSlice.js';
import { setActiveTab, addToast } from '../store/platformSlice.js';
import {
  RotateCw,
  MoreVertical,
  Boxes,
  CheckCircle2,
  FlaskConical,
  FileEdit,
  PauseCircle,
  ArrowRight,
  User,
  FileText,
  Code2,
  CloudUpload,
  Plus,
  Compass,
  CheckCircle,
  Clock,
  Server,
  Sliders,
  ShoppingBag,
  Utensils,
  Car,
} from 'lucide-react';

export default function GeneralOverviewView({ onOpenNewApp, onOpenAuditLogs }) {
  const dispatch = useDispatch();
  const applications = useSelector((state) => state.applications.applications);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      dispatch(
        addToast({
          type: 'success',
          title: 'Vue d\'ensemble actualisée',
          message: 'Toutes les métriques et journaux d\'audit sont à jour.',
        })
      );
    }, 400);
  };

  const handleOpenApp = (appId) => {
    dispatch(setSelectedAppId(appId));
    dispatch(setActiveTab('workspace'));
  };

  return (
    <div className="space-y-6">
      {/* Header matching Screenshot 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vue générale — P0.1</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pilotage global des applications métier et de leur cycle de vie.
          </p>
        </div>

        <button
          id="overview-refresh-btn"
          onClick={handleRefresh}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors shadow-2xs cursor-pointer"
        >
          <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* 5 KPI Stat Cards matching Screenshot 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: TOTAL APPLICATIONS */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Applications
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">03</div>
            <p className="text-xs text-slate-500 mt-0.5">Catalogue complet</p>
          </div>
        </div>

        {/* Card 2: ACTIVES */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Actives
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 font-mono">01</div>
            <p className="text-xs text-slate-500 mt-0.5">En production</p>
          </div>
        </div>

        {/* Card 3: EN TEST */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              En Test
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FlaskConical className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-amber-600 font-mono">01</div>
            <p className="text-xs text-slate-500 mt-0.5">Homologation</p>
          </div>
        </div>

        {/* Card 4: BROUILLONS */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Brouillons
            </span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileEdit className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-800 font-mono">01</div>
            <p className="text-xs text-slate-500 mt-0.5">En configuration</p>
          </div>
        </div>

        {/* Card 5: SUSPENDUES */}
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs flex flex-col justify-between space-y-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Suspendues
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <PauseCircle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-400 font-mono">00</div>
            <p className="text-xs text-slate-500 mt-0.5">Mises en pause</p>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Applications récentes & Journal d'audit (récent) matching Screenshot 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications récentes */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Applications récentes</h2>
            <button
              onClick={() => dispatch(setActiveTab('applications'))}
              className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              Voir tout (3) <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Recent App 1: Boutique Mode & Accessoires */}
            <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100 shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Boutique Mode & Accessoires
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                    <span className="font-mono">#APP-0003</span>
                    <span>•</span>
                    <span>Commerce & Vente</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">ACTIVE</span>
                    <span>•</span>
                    <span className="font-mono font-medium">v1.0.0</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenApp('app-0003')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Ouvrir
                </button>
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recent App 2: Le Bistro Gourmand */}
            <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shrink-0">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Le Bistro Gourmand
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                    <span className="font-mono">#APP-0002</span>
                    <span>•</span>
                    <span>Restauration</span>
                    <span>•</span>
                    <span className="text-amber-700 font-semibold">EN TEST</span>
                    <span>•</span>
                    <span className="font-mono font-medium">v0.9.0</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenApp('app-0002')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Ouvrir
                </button>
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Recent App 3: Auto Express Services */}
            <div className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                    Auto Express Services
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                    <span className="font-mono">#APP-0001</span>
                    <span>•</span>
                    <span>Automobile</span>
                    <span>•</span>
                    <span className="text-slate-600 font-semibold">BROUILLON</span>
                    <span>•</span>
                    <span className="font-mono font-medium">v0.1.0</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleOpenApp('app-0001')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Ouvrir
                </button>
                <button className="p-1 text-slate-400 hover:text-slate-600">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Journal d'audit (récent) matching Screenshot 3 */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Journal d'audit (récent)</h2>
            <button
              onClick={() => onOpenAuditLogs && onOpenAuditLogs()}
              className="text-xs text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              Voir tout <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            {/* Audit Item 1 */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Administrateur</span>
                  <span className="text-[11px] text-slate-400">09:57</span>
                </div>
                <p className="text-slate-600">Passage du statut de CONFIGURING à READY</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 font-mono text-[10px] rounded">
                    BUSINESS.STATUS.CHANGED
                  </span>
                  <span className="text-slate-500 text-[11px]">Le Bistro Gourmand</span>
                </div>
              </div>
            </div>

            {/* Audit Item 2 */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Administrateur</span>
                  <span className="text-[11px] text-slate-400">09:57</span>
                </div>
                <p className="text-slate-600">Création de l'application Le Bistro Gourmand</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 font-mono text-[10px] rounded">
                    BUSINESS.APPLICATION.CREATED
                  </span>
                  <span className="text-slate-500 text-[11px]">Le Bistro Gourmand</span>
                </div>
              </div>
            </div>

            {/* Audit Item 3 */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                <Code2 className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Éditeur Lead</span>
                  <span className="text-[11px] text-slate-400">09:57</span>
                </div>
                <p className="text-slate-600">Création du brouillon version 1.1.0</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 font-mono text-[10px] rounded">
                    BUSINESS.VERSION.CREATED
                  </span>
                  <span className="text-slate-500 text-[11px]">Boutique Mode & Accessoires</span>
                </div>
              </div>
            </div>

            {/* Audit Item 4 */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-3">
              <div className="w-7 h-7 rounded-md bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 mt-0.5">
                <CloudUpload className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">Administrateur</span>
                  <span className="text-[11px] text-slate-400">09:57</span>
                </div>
                <p className="text-slate-600">Publication de la version 1.0.0 sur PRODUCTION</p>
                <div className="flex items-center gap-2 pt-0.5">
                  <span className="px-2 py-0.5 bg-slate-200/70 text-slate-700 font-mono text-[10px] rounded">
                    BUSINESS.APPLICATION.PUBLISHED
                  </span>
                  <span className="text-slate-500 text-[11px]">Boutique Mode & Accessoires</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Stepper: Cycle de vie (toutes applications) matching Screenshot 3 */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900">Cycle de vie (toutes applications)</h2>
          <span className="text-xs text-slate-500">6 étapes de qualification</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Step 1: DRAFT */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 text-center space-y-1">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">DRAFT</div>
            <div className="text-xl font-bold text-slate-900 font-mono">01</div>
            <div className="text-[11px] text-slate-500">Brouillons</div>
          </div>

          {/* Step 2: CONFIGURING */}
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 text-center space-y-1">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              CONFIGURING
            </div>
            <div className="text-xl font-bold text-blue-900 font-mono">01</div>
            <div className="text-[11px] text-blue-600">En configuration</div>
          </div>

          {/* Step 3: VALIDATION */}
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50 text-center space-y-1">
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              VALIDATION
            </div>
            <div className="text-xl font-bold text-amber-900 font-mono">01</div>
            <div className="text-[11px] text-amber-600">En validation</div>
          </div>

          {/* Step 4: READY */}
          <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50 text-center space-y-1">
            <div className="text-xs font-bold text-purple-700 uppercase tracking-wider">READY</div>
            <div className="text-xl font-bold text-purple-900 font-mono">01</div>
            <div className="text-[11px] text-purple-600">Prêtes à publier</div>
          </div>

          {/* Step 5: PUBLISHED */}
          <div className="p-3 rounded-xl border border-teal-200 bg-teal-50/50 text-center space-y-1">
            <div className="text-xs font-bold text-teal-700 uppercase tracking-wider">
              PUBLISHED
            </div>
            <div className="text-xl font-bold text-teal-900 font-mono">01</div>
            <div className="text-[11px] text-teal-600">Publiées</div>
          </div>

          {/* Step 6: ACTIVE */}
          <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-center space-y-1">
            <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider">ACTIVE</div>
            <div className="text-xl font-bold text-emerald-900 font-mono">01</div>
            <div className="text-[11px] text-emerald-600">En production</div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Actions rapides (6 cards matching Screenshot 3) */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900">Actions rapides</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Action 1: Nouvelle application */}
          <button
            onClick={() => onOpenNewApp && onOpenNewApp()}
            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs transition-all text-left space-y-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">
                Nouvelle application
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Créer une application métier</p>
            </div>
          </button>

          {/* Action 2: Explorer les modèles */}
          <button
            onClick={() =>
              dispatch(
                addToast({
                  type: 'info',
                  title: 'Modèles & Templates',
                  message: 'Catalogue de packs préconfigurés (E-commerce, Santé, Logistique...).',
                })
              )
            }
            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs transition-all text-left space-y-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">
                Explorer les modèles
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Parcourir le catalogue</p>
            </div>
          </button>

          {/* Action 3: Banc d'homologation */}
          <button
            onClick={() => dispatch(setActiveTab('validation'))}
            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs transition-all text-left space-y-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">
                Banc d'homologation
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Lancer les tests P0.1</p>
            </div>
          </button>

          {/* Action 4: Voir le journal d'audit */}
          <button
            onClick={() => onOpenAuditLogs && onOpenAuditLogs()}
            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs transition-all text-left space-y-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">
                Voir le journal d'audit
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Consulter les événements</p>
            </div>
          </button>

          {/* Action 5: Environnements */}
          <button
            onClick={() => dispatch(setActiveTab('environments'))}
            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs transition-all text-left space-y-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">Environnements</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Gérer les environnements</p>
            </div>
          </button>

          {/* Action 6: Paramètres P0.1 */}
          <button
            onClick={() => dispatch(setActiveTab('config'))}
            className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-xs transition-all text-left space-y-2 group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-xs sm:text-sm">Paramètres P0.1</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Configuration globale</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
