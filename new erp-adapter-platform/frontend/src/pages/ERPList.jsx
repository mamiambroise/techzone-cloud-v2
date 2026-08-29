import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { erpRegistryService } from '../services/api';

const ITEMS_PER_PAGE = 5;

function ERPList() {
  const [erps, setErps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const fetchErps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await erpRegistryService.getAll();
      setErps(res.data);
    } catch (err) {
      setError('Erreur lors du chargement des ERP');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchErps();
  }, [fetchErps]);

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Supprimer l'ERP "${code}" ?`)) return;
    try {
      setDeleteLoading(id);
      await erpRegistryService.delete(id);
      setErps((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert('Erreur lors de la suppression');
      console.error(err);
    } finally {
      setDeleteLoading(null);
    }
  };

  // Filtrage
  const filtered = erps.filter((erp) => {
    const term = search.toLowerCase();
    return erp.code.toLowerCase().includes(term) || erp.nom.toLowerCase().includes(term);
  });

  // Pagination
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Chargement des ERP...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Titre et bouton ajouter */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des ERP</h1>
        <Link
          to="/erps/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Ajouter un ERP
        </Link>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par nom ou code..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:w-80 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Sante</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    {search ? 'Aucun ERP correspondant' : 'Aucun ERP enregistre'}
                  </td>
                </tr>
              ) : (
                paginated.map((erp, index) => (
                  <tr key={erp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(page - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm font-medium text-gray-800">{erp.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{erp.nom}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium">
                        {erp.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        erp.status === 'active' ? 'bg-green-100 text-green-700' :
                        erp.status === 'inactive' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {erp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        erp.healthStatus === 'healthy' ? 'bg-blue-100 text-blue-700' :
                        erp.healthStatus === 'unknown' ? 'bg-gray-100 text-gray-600' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {erp.healthStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        <Link
                          to={`/erps/edit/${erp.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Modifier
                        </Link>
                        <button
                          onClick={() => handleDelete(erp.id, erp.code)}
                          disabled={deleteLoading === erp.id}
                          className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                        >
                          {deleteLoading === erp.id ? '...' : 'Supprimer'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
            <span className="text-sm text-gray-500">
              {filtered.length} resultat(s) — Page {page}/{totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Precedent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ERPList;
