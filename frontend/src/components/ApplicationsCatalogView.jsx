import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedAppId } from '../store/applicationsSlice.js';
import { setActiveTab, addToast } from '../store/platformSlice.js';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  RotateCw,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Star,
  ShoppingBag,
  Utensils,
  Car,
  GraduationCap,
  Pill,
  Boxes,
  Building2,
  ExternalLink,
} from 'lucide-react';

const ICON_MAP = {
  ShoppingBag: ShoppingBag,
  Utensils: Utensils,
  Car: Car,
  GraduationCap: GraduationCap,
  Pill: Pill,
  Boxes: Boxes,
  Building2: Building2,
};

export default function ApplicationsCatalogView({ onOpenNewApp }) {
  const dispatch = useDispatch();
  const applications = useSelector((state) => state.applications.applications);

  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [envFilter, setEnvFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [showNewAppMenu, setShowNewAppMenu] = useState(false);

  // Status counts for quick pills matching Screenshot 2
  const counts = {
    all: applications.length,
    active: applications.filter((a) => a.status === 'ACTIVE').length,
    test: applications.filter((a) => a.status === 'EN TEST').length,
    draft: applications.filter((a) => a.status === 'BROUILLON').length,
    suspended: applications.filter((a) => a.status === 'SUSPENDUE').length,
    archived: applications.filter((a) => a.status === 'ARCHIVÉE').length,
  };

  const filteredApps = applications.filter((app) => {
    const q = searchFilter.toLowerCase();
    const matchSearch =
      !searchFilter ||
      app.name.toLowerCase().includes(q) ||
      (app.appNumber && app.appNumber.toLowerCase().includes(q)) ||
      (app.code && app.code.toLowerCase().includes(q)) ||
      (app.category && app.category.toLowerCase().includes(q)) ||
      (app.description && app.description.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && app.status === 'ACTIVE') ||
      (statusFilter === 'EN TEST' && app.status === 'EN TEST') ||
      (statusFilter === 'BROUILLON' && app.status === 'BROUILLON') ||
      (statusFilter === 'SUSPENDUE' && app.status === 'SUSPENDUE') ||
      (statusFilter === 'ARCHIVÉE' && app.status === 'ARCHIVÉE');

    const matchEnv =
      envFilter === 'ALL' ||
      (app.targetEnvironment && app.targetEnvironment.toUpperCase() === envFilter.toUpperCase());

    const matchCategory = categoryFilter === 'ALL' || app.category === categoryFilter;

    return matchSearch && matchStatus && matchEnv && matchCategory;
  });

  const toggleSelectAll = () => {
    if (selectedRowIds.length === filteredApps.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredApps.map((a) => a.id));
    }
  };

  const toggleSelectRow = (id) => {
    if (selectedRowIds.includes(id)) {
      setSelectedRowIds(selectedRowIds.filter((i) => i !== id));
    } else {
      setSelectedRowIds([...selectedRowIds, id]);
    }
  };

  const handleOpenApp = (app) => {
    dispatch(setSelectedAppId(app.id));
    dispatch(setActiveTab('workspace'));
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ACTIVE
          </span>
        );
      case 'EN TEST':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            EN TEST
          </span>
        );
      case 'BROUILLON':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            BROUILLON
          </span>
        );
      case 'SUSPENDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            SUSPENDUE
          </span>
        );
      case 'ARCHIVÉE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            ARCHIVÉE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Applications</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Gérez l'ensemble de vos applications métier, leurs versions, environnements et cycles de vie.
          </p>
        </div>

        <div className="flex items-center gap-2 relative shrink-0">
          <button
            id="new-app-main-btn"
            onClick={() => onOpenNewApp && onOpenNewApp()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle application</span>
            <ChevronDown className="w-3.5 h-3.5 ml-0.5 text-blue-200" />
          </button>
          <button
            id="apps-options-btn"
            onClick={() =>
              dispatch(
                addToast({
                  type: 'info',
                  title: 'Options du catalogue',
                  message: 'Import en masse, modèles et exports disponibles.',
                })
              )
            }
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Toolbar matching Screenshot 2 */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Rechercher par nom, code, description..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white placeholder-slate-400 text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Statut Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">Statut : Tous</option>
              <option value="ACTIVE">Actives</option>
              <option value="EN TEST">En test</option>
              <option value="BROUILLON">Brouillons</option>
              <option value="SUSPENDUE">Suspendues</option>
              <option value="ARCHIVÉE">Archivées</option>
            </select>
          </div>

          {/* Environnement Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={envFilter}
              onChange={(e) => setEnvFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">Environnement : Tous</option>
              <option value="PRODUCTION">Production</option>
              <option value="STAGING">Staging</option>
              <option value="DEVELOPPEMENT">Développement</option>
            </select>
          </div>

          {/* Catégorie Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">Catégorie : Toutes</option>
              <option value="Commerce & Vente">Commerce & Vente</option>
              <option value="Restauration">Restauration</option>
              <option value="Automobile">Automobile</option>
              <option value="Éducation">Éducation</option>
              <option value="Santé">Santé</option>
              <option value="Stock & Logistique">Stock & Logistique</option>
              <option value="Hôtellerie">Hôtellerie</option>
            </select>
          </div>

          {/* Advanced Filters Button */}
          <div className="lg:col-span-1 flex justify-end">
            <button
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'info',
                    title: 'Filtres avancés',
                    message: 'Filtres par date, tags et mainteneur appliqués.',
                  })
                )
              }
              className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors w-full flex items-center justify-center gap-1 text-xs"
            >
              <Filter className="w-3.5 h-3.5" />
              <span className="lg:hidden">Filtres avancés</span>
            </button>
          </div>
        </div>

        {/* Quick Filter Pills Row matching Screenshot 2 */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous <span className="opacity-70 ml-1">{counts.all}</span>
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'ACTIVE'
                  ? 'bg-emerald-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Actives <span className="opacity-70 ml-1">{counts.active}</span>
            </button>
            <button
              onClick={() => setStatusFilter('EN TEST')}
              className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'EN TEST'
                  ? 'bg-amber-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              En test <span className="opacity-70 ml-1">{counts.test}</span>
            </button>
            <button
              onClick={() => setStatusFilter('BROUILLON')}
              className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'BROUILLON'
                  ? 'bg-slate-700 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Brouillons <span className="opacity-70 ml-1">{counts.draft}</span>
            </button>
            <button
              onClick={() => setStatusFilter('SUSPENDUE')}
              className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'SUSPENDUE'
                  ? 'bg-rose-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Suspendues <span className="opacity-70 ml-1">{counts.suspended}</span>
            </button>
            <button
              onClick={() => setStatusFilter('ARCHIVÉE')}
              className={`px-3 py-1 rounded-md whitespace-nowrap transition-colors ${
                statusFilter === 'ARCHIVÉE'
                  ? 'bg-slate-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Archivées <span className="opacity-70 ml-1">{counts.archived}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() =>
                dispatch(
                  addToast({
                    type: 'info',
                    title: 'Catalogue actualisé',
                    message: 'Synchronisation terminée avec le registre central.',
                  })
                )
              }
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-md hover:bg-slate-100 transition-colors"
              title="Actualiser"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <span className="text-xs text-slate-500 hidden sm:inline">Tri : Dernière modif.</span>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vue tableau"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Vue cartes"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table matching Screenshot 2 */}
      {viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredApps.length > 0 && selectedRowIds.length === filteredApps.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold">
                    Application
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold hidden md:table-cell">
                    Catégorie
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold">
                    Statut
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold hidden sm:table-cell">
                    Version active
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold hidden lg:table-cell">
                    Environnement
                  </th>
                  <th scope="col" className="py-3.5 px-4 font-semibold hidden xl:table-cell">
                    Dernière modification
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredApps.map((app) => {
                  const IconComp = ICON_MAP[app.iconType] || Boxes;
                  const isSelected = selectedRowIds.includes(app.id);

                  return (
                    <tr
                      key={app.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(app.id)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Application Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                            <IconComp className="w-4 h-4" />
                          </div>
                          <div>
                            <button
                              onClick={() => handleOpenApp(app)}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left"
                            >
                              {app.name}
                            </button>
                            <div className="text-[11px] text-slate-500 font-mono">
                              {app.appNumber || 'APP-0001'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Catégorie */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="text-slate-700 font-medium">{app.category}</span>
                      </td>

                      {/* Statut */}
                      <td className="py-3.5 px-4">{renderStatusBadge(app.status)}</td>

                      {/* Version active */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1 font-mono text-xs font-medium text-slate-800">
                          {app.hasStarVersion && (
                            <Star className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                          )}
                          {app.activeVersion || 'v1.0.0'}
                        </span>
                      </td>

                      {/* Environnement */}
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">
                          {app.targetEnvironment || 'PRODUCTION'}
                        </span>
                      </td>

                      {/* Dernière modification */}
                      <td className="py-3.5 px-4 hidden xl:table-cell">
                        <div className="text-xs text-slate-700 font-medium">
                          {app.lastModifiedBy || 'Ranja Avo Efraim'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {app.lastModifiedDate || '25/08/2026 09:57'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`open-app-${app.id}`}
                            onClick={() => handleOpenApp(app)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                          >
                            Ouvrir
                          </button>
                          <button
                            onClick={() =>
                              dispatch(
                                addToast({
                                  type: 'info',
                                  title: app.name,
                                  message: 'Options : Dupliquer, Exporter ou Archiver l\'application.',
                                })
                              )
                            }
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination bar matching Screenshot 2 */}
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Affichage de <span className="font-semibold text-slate-800">1</span> à{' '}
              <span className="font-semibold text-slate-800">{filteredApps.length}</span> sur{' '}
              <span className="font-semibold text-slate-800">{applications.length}</span> applications
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled
                className="p-1.5 rounded border border-slate-200 text-slate-400 cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="px-3 py-1 rounded border border-blue-600 bg-blue-50 text-blue-600 font-semibold">
                1
              </button>
              <button
                disabled
                className="p-1.5 rounded border border-slate-200 text-slate-400 cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredApps.map((app) => {
            const IconComp = ICON_MAP[app.iconType] || Boxes;

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <IconComp className="w-5 h-5" />
                    </div>
                    {renderStatusBadge(app.status)}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{app.name}</h3>
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      {app.appNumber} • {app.category}
                    </div>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2">{app.description}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Version active</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {app.activeVersion}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Environnement</span>
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {app.targetEnvironment}
                    </span>
                  </div>

                  <button
                    onClick={() => handleOpenApp(app)}
                    className="w-full py-2 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Ouvrir le workspace
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
