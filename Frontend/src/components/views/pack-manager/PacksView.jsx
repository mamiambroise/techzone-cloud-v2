// PacksView.jsx — PM-CDC-02 Pack Definition Manager & Registry
import React, { useState, useMemo } from 'react';
import { useApp } from '../../../context/AppContext';
import { EmptyState } from '../../common/EmptyState';
import {
  Boxes,
  Layers,
  Search,
  Plus,
  Filter,
  Grid,
  List,
  Edit,
  Copy,
  Archive,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Tag,
  SlidersHorizontal,
  RefreshCw,
  Eye,
} from 'lucide-react';
import NewPackModal from './NewPackModal';
import EditPackModal from './EditPackModal';
import DuplicatePackModal from './DuplicatePackModal';
import ArchivePackModal from './ArchivePackModal';
import PackDetailDrawer from './PackDetailDrawer';

export default function PacksView() {
  const {
    packs,
    selectedPackId,
    setSelectedPackId,
    openPackWorkspace,
    restorePack,
    setCurrentView,
    showToast,
  } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ACTIVE');
  const [selectedSource, setSelectedSource] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals & Drawer State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [packToEdit, setPackToEdit] = useState(null);
  const [packToClone, setPackToClone] = useState(null);
  const [packToArchive, setPackToArchive] = useState(null);
  const [packToInspect, setPackToInspect] = useState(null);

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set(packs.map((p) => p.category).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [packs]);

  // Filtered Packs
  const filteredPacks = useMemo(() => {
    return packs.filter((pack) => {
      const matchSearch =
        !searchTerm.trim() ||
        pack.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pack.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pack.metadata?.tags && pack.metadata.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchCat = selectedCategory === 'ALL' || pack.category === selectedCategory;

      const matchStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && pack.status === 'ACTIVE') ||
        (selectedStatus === 'ARCHIVED' && pack.status === 'ARCHIVED') ||
        (selectedStatus === 'DEPRECATED' && pack.status === 'DEPRECATED');

      const matchSource = selectedSource === 'ALL' || pack.sourceType === selectedSource;

      return matchSearch && matchCat && matchStatus && matchSource;
    });
  }, [packs, searchTerm, selectedCategory, selectedStatus, selectedSource]);

  return (
    <div className="space-y-4 animate-fadeIn pb-6">
      {/* 1. Top Header Banner (White Card Theme) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Pack Manager
            </span>
            <span className="text-xs text-slate-500">
              {filteredPacks.length} / {packs.length} packs affichés
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
              <Boxes className="w-5 h-5" />
            </div>
            Packs
          </h1>
          <p className="text-xs text-slate-600 max-w-3xl">
            Gérez les packs disponibles et ouvrez leurs versions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau pack</span>
          </button>
        </div>
      </div>

      {/* 2. Search, Filter & Layout Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, code (stock, sales), tag ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 text-xs font-medium cursor-pointer"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'ALL' ? 'Toutes catégories' : cat}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 text-xs font-medium cursor-pointer"
          >
            <option value="ACTIVE">Actifs uniquement</option>
            <option value="ALL">Tous les statuts</option>
            <option value="DEPRECATED">Dépréciés</option>
            <option value="ARCHIVED">Archivés</option>
          </select>

          {/* Source Typology */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:outline-none focus:border-blue-500 text-xs font-medium cursor-pointer"
          >
            <option value="ALL">Toutes sources</option>
            <option value="CUSTOM">Personnalisé (Custom)</option>
            <option value="TEMPLATE">Modèle (Template)</option>
            <option value="SYSTEM">Système (Core)</option>
            <option value="CLONED">Cloné (Cloned)</option>
          </select>

          {/* Layout Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Affichage en Grille"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Affichage en Liste"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. Packs Grid / Table View */}
      {filteredPacks.length === 0 ? (
        <EmptyState title={packs.length === 0 ? 'Aucun pack' : 'Aucun résultat'} description={packs.length === 0 ? 'Créez un pack pour commencer.' : 'Ajustez votre recherche ou réinitialisez les filtres.'} action={packs.length === 0 ? <button type="button" onClick={() => setIsNewModalOpen(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">Nouveau pack</button> : <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('ALL');
              setSelectedStatus('ALL');
              setSelectedSource('ALL');
            }}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            Réinitialiser les filtres
          </button>} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPacks.map((pack) => (
            <div
              key={pack.id}
              className={`bg-white border ${
                selectedPackId === pack.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-slate-200/80'
              } hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between transition-all group shadow-xs hover:shadow-sm`}
            >
              {/* Card Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs flex-shrink-0"
                      style={{ backgroundColor: pack.color || '#3B82F6' }}
                    >
                      <Boxes className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3
                        onClick={() => setPackToInspect(pack)}
                        className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate cursor-pointer"
                        title={pack.name}
                      >
                        {pack.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-[11px] text-blue-600 font-semibold">{pack.code}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.2 rounded-full ${
                            pack.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : pack.status === 'ARCHIVED'
                              ? 'bg-slate-100 text-slate-600 border border-slate-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {pack.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                    {pack.sourceType}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed min-h-[32px]">
                  {pack.description || 'Aucune description spécifiée.'}
                </p>

                {/* Tags */}
                {pack.metadata?.tags && pack.metadata.tags.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {pack.metadata.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200"
                      >
                        #{tag}
                      </span>
                    ))}
                    {pack.metadata.tags.length > 3 && (
                      <span className="text-[10px] text-slate-500">+{pack.metadata.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer / Metrics & Actions */}
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] bg-slate-50/70 p-2 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Version</span>
                    <span className="font-bold text-slate-900">
                      v{pack.publishedVersionNumber || pack.currentVersionNumber || '1.0.0'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Modules</span>
                    <span className="font-bold text-blue-600">{pack.modulesCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase font-semibold">Features</span>
                    <span className="font-bold text-purple-600">{pack.featuresCount || 0}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPackToInspect(pack)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                      title="Inspecter le pack"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPackToEdit(pack)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Modifier les métadonnées"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPackToClone(pack)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                      title="Dupliquer / Cloner ce pack"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    {pack.status === 'ARCHIVED' ? (
                      <button
                        onClick={() => restorePack(pack.id)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Restaurer le pack"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setPackToArchive(pack)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Archiver ce pack"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPackId(pack.id);
                      setCurrentView('pack-versions');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-2xs"
                  >
                    <span>Versions</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table Mode */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Pack & Code</th>
                  <th className="px-4 py-3.5">Catégorie</th>
                  <th className="px-4 py-3.5">Statut</th>
                  <th className="px-4 py-3.5">Typologie</th>
                  <th className="px-4 py-3.5">Version active</th>
                  <th className="px-4 py-3.5 text-center">Modules</th>
                  <th className="px-4 py-3.5 text-center">Features</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPacks.map((pack) => (
                  <tr key={pack.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-xs"
                          style={{ backgroundColor: pack.color || '#3B82F6' }}
                        >
                          <Boxes className="w-4 h-4" />
                        </div>
                        <div>
                          <div
                            onClick={() => setPackToInspect(pack)}
                            className="font-bold text-slate-900 hover:text-blue-600 cursor-pointer transition-colors"
                          >
                            {pack.name}
                          </div>
                          <div className="font-mono text-[11px] text-blue-600">{pack.code}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-slate-600">{pack.category}</td>

                    <td className="px-4 py-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          pack.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : pack.status === 'ARCHIVED'
                            ? 'bg-slate-100 text-slate-600 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {pack.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-slate-600">{pack.sourceType}</td>

                    <td className="px-4 py-4 font-bold text-slate-900">
                      v{pack.publishedVersionNumber || pack.currentVersionNumber || '1.0.0'}
                    </td>

                    <td className="px-4 py-4 text-center font-bold text-blue-600">{pack.modulesCount || 0}</td>

                    <td className="px-4 py-4 text-center font-bold text-purple-600">{pack.featuresCount || 0}</td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPackToInspect(pack)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                          title="Inspecter"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPackToEdit(pack)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPackToClone(pack)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                          title="Dupliquer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedPackId(pack.id);
                            setCurrentView('pack-versions');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 text-white font-bold text-[11px] hover:bg-blue-700 transition-colors shadow-2xs"
                        >
                          Versions
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals & Drawer */}
      <NewPackModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} />
      <EditPackModal
        isOpen={Boolean(packToEdit)}
        onClose={() => setPackToEdit(null)}
        packToEdit={packToEdit}
      />
      <DuplicatePackModal
        isOpen={Boolean(packToClone)}
        onClose={() => setPackToClone(null)}
        packToClone={packToClone}
      />
      <ArchivePackModal
        isOpen={Boolean(packToArchive)}
        onClose={() => setPackToArchive(null)}
        packToArchive={packToArchive}
      />
      <PackDetailDrawer
        isOpen={Boolean(packToInspect)}
        onClose={() => setPackToInspect(null)}
        pack={packToInspect}
        onEdit={(p) => {
          setPackToInspect(null);
          setPackToEdit(p);
        }}
        onDuplicate={(p) => {
          setPackToInspect(null);
          setPackToClone(p);
        }}
        onArchive={(p) => {
          setPackToInspect(null);
          setPackToArchive(p);
        }}
        onRestore={(id) => {
          restorePack(id);
          setPackToInspect(null);
        }}
      />
    </div>
  );
}
