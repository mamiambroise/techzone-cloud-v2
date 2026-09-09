// MenuEngineView.jsx — Menu Engine & Navigation Manager (BM-CDC-05)
import React, { useState, useMemo } from 'react';
import {
  Menu as MenuIcon,
  Layers,
  LayoutDashboard,
  Boxes,
  ShoppingCart,
  Gift,
  Settings,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Smartphone,
  Monitor,
  Eye,
  CheckCircle2,
  Lock,
  Download,
  FolderTree,
  ArrowUp,
  ArrowDown,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function MenuEngineView() {
  const {
    selectedApp,
    selectedVersion,
    applications,
    setSelectedAppId,
    menus,
    createMenuItem,
    deleteMenuItem,
    resolveNavigationTree,
    appFeatures,
    showToast,
    isVersionReadOnly,
  } = useApp();

  const [selectedLocation, setSelectedLocation] = useState('SIDEBAR');
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'
  const [evaluationRole, setEvaluationRole] = useState('ADMIN'); // 'ADMIN' | 'BUILDER' | 'VIEWER'
  const [activeTab, setActiveTab] = useState('tree'); // 'tree' | 'resolver' | 'preview'
  const [selectedItemId, setSelectedItemId] = useState('nav_cat');
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  const [itemForm, setItemForm] = useState({
    label: '',
    icon: 'Folder',
    route: '/new-view',
    targetType: 'ROUTE',
    badge: '',
    requiredFeatures: [],
  });

  const currentMenu = useMemo(() => {
    return menus.find((m) => m.location === selectedLocation) || menus[0] || { items: [] };
  }, [menus, selectedLocation]);

  // Flattened items for selection
  const allItems = useMemo(() => {
    const list = [];
    const traverse = (items) => {
      items?.forEach((it) => {
        list.push(it);
        if (it.children?.length) traverse(it.children);
      });
    };
    traverse(currentMenu?.items);
    return list;
  }, [currentMenu]);

  const selectedItem = useMemo(() => {
    return allItems.find((i) => i.id === selectedItemId) || allItems[0] || null;
  }, [allItems, selectedItemId]);

  // Dynamic Navigation Resolution
  const resolvedItems = useMemo(() => {
    return resolveNavigationTree(selectedLocation, evaluationRole);
  }, [resolveNavigationTree, selectedLocation, evaluationRole]);

  const handleCreateMenuItemSubmit = (e) => {
    e.preventDefault();
    if (!itemForm.label) return;
    createMenuItem(selectedLocation, itemForm);
    setIsNewItemModalOpen(false);
    setItemForm({ label: '', icon: 'Folder', route: '/new-view', targetType: 'ROUTE', badge: '', requiredFeatures: [] });
  };

  const handleExportMenuJSON = () => {
    const payload = JSON.stringify(
      {
        standard: 'BM-CDC-05',
        application: selectedApp?.code,
        version: selectedVersion?.versionNumber,
        generatedAt: new Date().toISOString(),
        menus,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `navigation-${selectedApp?.code || 'app'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Topologie des menus exportée au format JSON.');
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Menu Engine</h1>
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">
              BM-CDC-05
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Arborescence de navigation, conditionnement dynamique par Feature Flag et prévisualisation du rendu UI.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Target App Switcher */}
          <select
            value={selectedApp?.id || ''}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
          >
            {applications.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (v{a.publishedVersionNumber || a.currentVersionNumber || '1.0.0'})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportMenuJSON}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter JSON</span>
          </button>

          <button
            onClick={() => setIsNewItemModalOpen(true)}
            disabled={isVersionReadOnly}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter Entrée Menu</span>
          </button>
        </div>
      </div>

      {/* 2. Top Location Selector & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          {menus.map((m) => (
            <button
              key={m.location}
              onClick={() => setSelectedLocation(m.location)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedLocation === m.location
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {m.name} ({m.items?.length || 0})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'tree' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Arbre Structurel
          </button>
          <button
            onClick={() => setActiveTab('resolver')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'resolver' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Moteur de Résolution (Live)
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
              activeTab === 'preview' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Aperçu Rendu UI
          </button>
        </div>
      </div>

      {/* 3. Tab 1: Structural Tree */}
      {activeTab === 'tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Menu Items */}
          <div className="lg:col-span-6 space-y-2">
            <div className="p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>Éléments de navigation ({currentMenu.items?.length || 0})</span>
              <span className="text-[10px] text-slate-400">Emplacement : {currentMenu.name}</span>
            </div>

            <div className="space-y-2">
              {currentMenu.items?.map((item) => {
                const isSelected = item.id === selectedItem?.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItemId(item.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/60 border-indigo-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                          <FolderTree className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                            <span>{item.label}</span>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-black">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{item.route}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.requiredFeatures?.length > 0 && (
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold">
                            {item.requiredFeatures.join(', ')}
                          </span>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteMenuItem(selectedLocation, item.id);
                          }}
                          disabled={isVersionReadOnly}
                          className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Render Children if any */}
                    {item.children?.length > 0 && (
                      <div className="mt-3 pl-6 border-l-2 border-indigo-100 space-y-1.5">
                        {item.children.map((child) => (
                          <div
                            key={child.id}
                            className="p-2 rounded-lg bg-slate-50 flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-slate-700">{child.label}</span>
                            <span className="font-mono text-[10px] text-slate-400">{child.route}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Item Inspector */}
          <div className="lg:col-span-6 space-y-4">
            {selectedItem ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-sm font-black text-slate-900 border-b pb-3">Inspecteur de l'entrée sélectionnée</h3>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Libellé</span>
                    <span className="font-extrabold text-slate-900">{selectedItem.label}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Route Cible</span>
                    <span className="font-mono font-bold text-indigo-700">{selectedItem.route}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Type d'Ouverture</span>
                    <span className="font-semibold text-slate-800">{selectedItem.openMode || 'SAME_VIEW'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Conditionnement Feature</span>
                    <span className="font-mono text-slate-800">
                      {selectedItem.requiredFeatures?.join(', ') || 'Aucune (Toujours visible)'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">Sélectionnez une entrée de menu</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Live Resolver */}
      {activeTab === 'resolver' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Moteur de Résolution Dynamique en Temps Réel</h3>
              <p className="text-xs text-slate-500">
                Filtrage automatique selon les Feature Flags actifs et le rôle IAM de l'utilisateur (BM-CDC-05 Section 33).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Évaluer le rôle :</span>
              <select
                value={evaluationRole}
                onChange={(e) => setEvaluationRole(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="ADMIN">ADMINISTRATEUR</option>
                <option value="BUILDER">BUILDER STUDIO</option>
                <option value="VIEWER">INVITÉ (VIEWER)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Arborescence Résolue ({resolvedItems.length} éléments visibles)
            </h4>

            <div className="space-y-2">
              {resolvedItems.map((it) => (
                <div
                  key={it.id}
                  className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-emerald-950">{it.label}</span>
                    <span className="font-mono text-[10px] text-emerald-700">{it.route}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                    ACCÈS AUTORISÉ
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: UI Preview */}
      {activeTab === 'preview' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-sm font-black text-slate-900">Aperçu du rendu visuel de la navigation</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`p-1.5 rounded-lg ${
                  previewMode === 'desktop' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`p-1.5 rounded-lg ${
                  previewMode === 'mobile' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-center p-8 bg-slate-100 rounded-2xl">
            {previewMode === 'desktop' ? (
              <div className="w-64 bg-slate-900 text-white p-4 rounded-2xl shadow-xl space-y-4">
                <div className="font-black text-xs text-indigo-400 uppercase tracking-wider">
                  {selectedApp?.name || 'Application'}
                </div>
                <div className="space-y-1">
                  {resolvedItems.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded bg-rose-500 text-white text-[9px] font-black">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="w-72 bg-white border-4 border-slate-900 rounded-3xl p-4 shadow-xl space-y-4">
                <div className="h-4 w-20 bg-slate-200 rounded-full mx-auto" />
                <div className="text-center font-black text-xs text-slate-800">{selectedApp?.name}</div>
                <div className="space-y-1">
                  {resolvedItems.map((item) => (
                    <div
                      key={item.id}
                      className="px-3 py-2 rounded-xl bg-slate-50 text-xs font-bold text-slate-700 flex items-center justify-between"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Nouvelle Entrée Menu */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">Ajouter une entrée au menu ({currentMenu.name})</h3>
              <button onClick={() => setIsNewItemModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMenuItemSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Libellé affiché *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Commandes, Statistiques"
                  value={itemForm.label}
                  onChange={(e) => setItemForm({ ...itemForm, label: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Route applicative (/route)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: /orders, /analytics"
                  value={itemForm.route}
                  onChange={(e) => setItemForm({ ...itemForm, route: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge optionnel</label>
                <input
                  type="text"
                  placeholder="Ex: NEW, PRO, 5"
                  value={itemForm.badge}
                  onChange={(e) => setItemForm({ ...itemForm, badge: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Ajouter au menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
