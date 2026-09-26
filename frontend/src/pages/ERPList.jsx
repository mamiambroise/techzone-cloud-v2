import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ServerStackIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { erpRegistryService } from '../services/apiClient.js';
import { ModernSpinner } from '../components/Loaders.jsx';
import { useToast } from '../hooks/useToast.js';
import ConfirmModal from '../components/ui/ConfirmModal.jsx';

const ITEMS_PER_PAGE = 5;

function ERPList() {
  const { toast } = useToast();
  const [erps, setErps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetchErps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await erpRegistryService.getAll();
      setErps(res.data);
    } catch (err) {
      setError("Erreur lors du chargement des ERP");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErps();
  }, [fetchErps]);

  const handleDelete = async (id, code) => {
    try {
      setDeleteLoading(id);
      await erpRegistryService.delete(id);
      setErps((prev) => prev.filter((e) => e.id !== id));
      toast.success(`L'ERP « ${code} » a été supprimé.`);
    } catch (err) {
      toast.error("Erreur lors de la suppression de l'ERP.");
    } finally {
      setDeleteLoading(null);
      setConfirmTarget(null);
    }
  };

  const filtered = erps.filter((erp) => {
    const term = search.toLowerCase();
    return erp.code.toLowerCase().includes(term) || erp.nom.toLowerCase().includes(term);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) {
    return <ModernSpinner label="Chargement des ERP..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">ERP Registry</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gestion des systèmes ERP enregistrés</p>
        </div>
        <Link
          to="/erps/create"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <PlusIcon className="w-5 h-5" />
          Ajouter un ERP
        </Link>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="relative">
        <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher par nom ou code..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-80 pl-11 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Santé</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <ServerStackIcon className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    {search ? 'Aucun ERP correspondant' : 'Aucun ERP enregistré'}
                  </td>
                </tr>
              ) : (
                paginated.map((erp, index) => (
                  <tr key={erp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-medium text-slate-800 dark:text-slate-100">{erp.code}</td>
                    <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-200">{erp.nom}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                        {erp.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full font-medium ${
                        erp.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : erp.status === 'inactive'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${erp.status === 'active' ? 'bg-emerald-500 dark:bg-emerald-400' : erp.status === 'inactive' ? 'bg-red-500 dark:bg-red-400' : 'bg-slate-400 dark:bg-slate-500'}`} />
                        {erp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                        erp.healthStatus === 'healthy'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          : erp.healthStatus === 'unknown'
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}>
                        {erp.healthStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Link
                          to={`/erps/edit/${erp.id}`}
                          title="Modifier"
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => setConfirmTarget(erp)}
                          disabled={deleteLoading === erp.id}
                          title="Supprimer"
                          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                        >
                          {deleteLoading === erp.id ? (
                            <span className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-red-500 rounded-full animate-spin inline-block" />
                          ) : (
                            <TrashIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {filtered.length} résultat(s) — Page {page}/{totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-600 dark:text-slate-300"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-600 dark:text-slate-300"
              >
                Suivant
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(confirmTarget)}
        title="Supprimer cet ERP"
        message={`Voulez-vous vraiment supprimer l'ERP « ${confirmTarget?.code ?? ''} » ? Cette action est irréversible.`}
        confirmLabel={deleteLoading ? 'Suppression...' : 'Supprimer'}
        cancelLabel="Annuler"
        danger
        loading={Boolean(deleteLoading)}
        onConfirm={() => handleDelete(confirmTarget.id, confirmTarget.code)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

export default ERPList;
