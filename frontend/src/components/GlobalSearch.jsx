import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSearchQuery, setActiveTab, addToast } from '../store/platformSlice.js';
import { setSelectedAppId } from '../store/applicationsSlice.js';
import { setSelectedEnvId } from '../store/environmentsSlice.js';
import { setSelectedScope } from '../store/configSlice.js';
import {
  Search,
  X,
  Boxes,
  Server,
  Sliders,
  CornerDownLeft,
  ChevronRight,
  Filter,
  Shield,
  Tag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export default function GlobalSearch({ isMobileExpanded = false, onCloseMobile }) {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const searchQuery = useSelector((state) => state.platform.searchQuery);
  const currentTab = useSelector((state) => state.platform.activeTab);
  const applications = useSelector((state) => state.applications.applications);
  const environments = useSelector((state) => state.environments.environments);
  const configItems = useSelector((state) => state.config.items);

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL'); // 'ALL' | 'APPS' | 'ENVS' | 'CONFIGS'

  // Global hotkey: Cmd+K / Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === '/' && document.activeElement !== inputRef.current && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        inputRef.current?.blur();
        if (onCloseMobile) onCloseMobile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCloseMobile]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        inputRef.current &&
        !inputRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter Applications
  const matchedApps = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return applications.filter(
      (app) =>
        app.code.toLowerCase().includes(q) ||
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        (app.tags && app.tags.some((t) => t.toLowerCase().includes(q))) ||
        app.status.toLowerCase().includes(q)
    );
  }, [applications, searchQuery]);

  // Filter Environments
  const matchedEnvs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return environments.filter(
      (env) =>
        env.code.toLowerCase().includes(q) ||
        env.name.toLowerCase().includes(q) ||
        env.region.toLowerCase().includes(q) ||
        env.baseUrl.toLowerCase().includes(q) ||
        env.securityTier.toLowerCase().includes(q) ||
        env.type.toLowerCase().includes(q) ||
        (env.deployedApps &&
          env.deployedApps.some(
            (da) =>
              da.appCode.toLowerCase().includes(q) ||
              da.versionNumber.toLowerCase().includes(q)
          ))
    );
  }, [environments, searchQuery]);

  // Filter Configuration Keys
  const matchedConfigs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return configItems.filter(
      (cfg) =>
        cfg.key.toLowerCase().includes(q) ||
        cfg.scope.toLowerCase().includes(q) ||
        (cfg.description && cfg.description.toLowerCase().includes(q)) ||
        (cfg.value && String(cfg.value).toLowerCase().includes(q)) ||
        cfg.type.toLowerCase().includes(q)
    );
  }, [configItems, searchQuery]);

  const totalMatches = matchedApps.length + matchedEnvs.length + matchedConfigs.length;

  const handleSelectApp = (app) => {
    dispatch(setSelectedAppId(app.id));
    dispatch(setActiveTab('applications'));
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
    dispatch(
      addToast({
        type: 'info',
        title: 'Application sélectionnée',
        message: `${app.name} (${app.code}) affichée dans Applications & Versions.`,
      })
    );
  };

  const handleSelectEnv = (env) => {
    dispatch(setSelectedEnvId(env.id));
    dispatch(setActiveTab('environments'));
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
    dispatch(
      addToast({
        type: 'info',
        title: 'Environnement sélectionné',
        message: `Bascule sur l'environnement ${env.code} (${env.region}).`,
      })
    );
  };

  const handleSelectConfig = (cfg) => {
    dispatch(setSelectedScope(cfg.scope));
    dispatch(setActiveTab('config'));
    setIsOpen(false);
    if (onCloseMobile) onCloseMobile();
    dispatch(
      addToast({
        type: 'info',
        title: 'Variable de configuration',
        message: `Clé ${cfg.key} ciblée dans le Configuration Manager (scope ${cfg.scope}).`,
      })
    );
  };

  const handleQuickSearch = (keyword) => {
    dispatch(setSearchQuery(keyword));
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const clearSearch = () => {
    dispatch(setSearchQuery(''));
    inputRef.current?.focus();
  };

  // Helper to highlight search term in text
  const renderHighlighted = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-amber-950 px-0.5 rounded-xs font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="relative w-full">
      {/* Input container */}
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <Search className="w-4 h-4 text-slate-400" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => {
            dispatch(setSearchQuery(e.target.value));
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Filtrer applications, environnements, clés de config..."
          className={`w-full pl-9.5 pr-20 py-1.5 sm:py-2 text-xs bg-slate-100/80 hover:bg-slate-100 border rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
            isOpen || searchQuery
              ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white'
              : 'border-slate-200/80 hover:border-slate-300'
          }`}
          aria-label="Recherche globale sur la plateforme"
        />

        {/* Right input utilities: clear button & shortcut hint */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {searchQuery ? (
            <button
              onClick={clearSearch}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              title="Effacer la recherche"
              aria-label="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200/70 border border-slate-300/60 rounded-md text-[10px] font-mono font-medium text-slate-500 select-none">
              <span className="text-[11px]">⌘</span>K
            </div>
          )}
        </div>
      </div>

      {/* Instant Interactive Results Dropdown Panel */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh] sm:max-h-[520px] flex flex-col"
        >
          {/* Top Bar: Category Filter Pills */}
          <div className="p-2.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between gap-2 overflow-x-auto text-xs">
            <div className="flex items-center gap-1.5 flex-nowrap shrink-0">
              <button
                onClick={() => setActiveCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all whitespace-nowrap ${
                  activeCategory === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tous {searchQuery ? `(${totalMatches})` : ''}
              </button>

              <button
                onClick={() => setActiveCategory('APPS')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all whitespace-nowrap ${
                  activeCategory === 'APPS'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Boxes className="w-3 h-3 text-indigo-400" />
                Applications {searchQuery ? `(${matchedApps.length})` : `(${applications.length})`}
              </button>

              <button
                onClick={() => setActiveCategory('ENVS')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all whitespace-nowrap ${
                  activeCategory === 'ENVS'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Server className="w-3 h-3 text-sky-400" />
                Environnements {searchQuery ? `(${matchedEnvs.length})` : `(${environments.length})`}
              </button>

              <button
                onClick={() => setActiveCategory('CONFIGS')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all whitespace-nowrap ${
                  activeCategory === 'CONFIGS'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Sliders className="w-3 h-3 text-amber-400" />
                Clés Config {searchQuery ? `(${matchedConfigs.length})` : `(${configItems.length})`}
              </button>
            </div>

            {searchQuery && (
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline shrink-0">
                {totalMatches} résultat(s)
              </span>
            )}
          </div>

          {/* Results Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-3">
            {/* If no query is entered: Show prompt & suggested quick searches */}
            {!searchQuery.trim() && (
              <div className="p-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Recherche globale unifiée</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tapez un mot-clé pour filtrer instantanément à travers les 3 piliers du socle.
                  </p>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Suggestions rapides
                  </span>
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {[
                      { label: 'CORE-API', cat: 'app' },
                      { label: 'PRODUCTION', cat: 'env' },
                      { label: 'DEVELOPMENT', cat: 'env' },
                      { label: 'platform.http.timeout_ms', cat: 'cfg' },
                      { label: 'rate_limit', cat: 'cfg' },
                      { label: 'ERP-SYNC', cat: 'app' },
                    ].map((s) => (
                      <button
                        key={s.label}
                        onClick={() => handleQuickSearch(s.label)}
                        className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 rounded-lg text-slate-700 font-mono transition-colors"
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* When search query is entered but nothing matched */}
            {searchQuery.trim() && totalMatches === 0 && (
              <div className="p-6 text-center space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Aucun résultat trouvé</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-xs mx-auto">
                    Aucune application, environnement ou clé de configuration ne correspond à «{' '}
                    <span className="font-semibold text-slate-700">{searchQuery}</span> ».
                  </p>
                </div>
                <button
                  onClick={clearSearch}
                  className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                >
                  Effacer la recherche
                </button>
              </div>
            )}

            {/* Applications Matches */}
            {(activeCategory === 'ALL' || activeCategory === 'APPS') && matchedApps.length > 0 && (
              <div className="space-y-1 pt-1">
                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                    Applications ({matchedApps.length})
                  </span>
                  <span className="text-[10px] font-normal normal-case text-slate-400">PF-CDC-02</span>
                </div>

                <div className="space-y-1">
                  {matchedApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => handleSelectApp(app)}
                      className="p-2.5 rounded-xl hover:bg-indigo-50/70 border border-transparent hover:border-indigo-200/80 cursor-pointer transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-950">
                            {renderHighlighted(app.name, searchQuery)}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                            {renderHighlighted(app.code, searchQuery)}
                          </span>
                          <span
                            className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-md ${
                              app.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {app.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {renderHighlighted(app.description, searchQuery)}
                        </p>
                        {app.tags && app.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            {app.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100/80 text-slate-600 font-mono"
                              >
                                #{renderHighlighted(tag, searchQuery)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 group-hover:text-indigo-600 shrink-0 pt-1">
                        <span className="text-[10px] font-medium hidden sm:inline">Ouvrir</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Environments Matches */}
            {(activeCategory === 'ALL' || activeCategory === 'ENVS') && matchedEnvs.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-sky-500" />
                    Environnements ({matchedEnvs.length})
                  </span>
                  <span className="text-[10px] font-normal normal-case text-slate-400">PF-CDC-03</span>
                </div>

                <div className="space-y-1">
                  {matchedEnvs.map((env) => (
                    <div
                      key={env.id}
                      onClick={() => handleSelectEnv(env)}
                      className="p-2.5 rounded-xl hover:bg-sky-50/70 border border-transparent hover:border-sky-200/80 cursor-pointer transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 group-hover:text-sky-950">
                            {renderHighlighted(env.name, searchQuery)}
                          </span>
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-sky-100/80 text-sky-800 font-semibold border border-sky-200">
                            {renderHighlighted(env.code, searchQuery)}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                            {env.region}
                          </span>
                          <span
                            className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded-md border ${
                              env.securityTier === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : env.securityTier === 'HIGH'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}
                          >
                            Tier {env.securityTier}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1 font-mono">
                          <span className="truncate">{renderHighlighted(env.baseUrl, searchQuery)}</span>
                          <span className="text-slate-300">•</span>
                          <span className="shrink-0 text-slate-600">
                            {env.deployedApps?.length || 0} app(s) déployée(s)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 group-hover:text-sky-600 shrink-0 pt-1">
                        <span className="text-[10px] font-medium hidden sm:inline">Gérer</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Configuration Keys Matches */}
            {(activeCategory === 'ALL' || activeCategory === 'CONFIGS') && matchedConfigs.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="px-2 py-1 flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    Variables & Clés de Config ({matchedConfigs.length})
                  </span>
                  <span className="text-[10px] font-normal normal-case text-slate-400">PF-CDC-05</span>
                </div>

                <div className="space-y-1">
                  {matchedConfigs.map((cfg) => (
                    <div
                      key={cfg.id}
                      onClick={() => handleSelectConfig(cfg)}
                      className="p-2.5 rounded-xl hover:bg-amber-50/70 border border-transparent hover:border-amber-200/80 cursor-pointer transition-all flex items-start justify-between gap-3 group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-indigo-900 group-hover:text-amber-950">
                            {renderHighlighted(cfg.key, searchQuery)}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-amber-100/70 text-amber-800 font-semibold border border-amber-200">
                            {cfg.scope}
                          </span>
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-600">
                            {cfg.type}
                          </span>
                          {cfg.isSecret && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                              SECRET
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {renderHighlighted(cfg.description, searchQuery)}
                        </p>

                        <div className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-2">
                          <span className="text-slate-400">Valeur:</span>
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded text-slate-800 truncate max-w-xs">
                            {cfg.isSecret ? '••••••••' : renderHighlighted(String(cfg.value), searchQuery)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-slate-400 group-hover:text-amber-700 shrink-0 pt-1">
                        <span className="text-[10px] font-medium hidden sm:inline">Éditer</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Dropdown Footer: Direct filter confirmation & shortcuts */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onCloseMobile) onCloseMobile();
                }}
                className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-semibold text-xs transition-colors flex items-center gap-1"
              >
                <span>Fermer le panneau</span>
              </button>

              {searchQuery && (
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Filtre actif : « <strong>{searchQuery}</strong> »
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="hidden sm:inline">Échap pour fermer</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
