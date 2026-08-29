import React, { useState, useEffect } from 'react';
import { erpRegistryService } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0, healthy: 0 });
  const [recentErps, setRecentErps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await erpRegistryService.getAll();
        const erps = res.data;
        setRecentErps(erps.slice(0, 5));
        setStats({
          total: erps.length,
          active: erps.filter((e) => e.status === 'active').length,
          inactive: erps.filter((e) => e.status === 'inactive').length,
          healthy: erps.filter((e) => e.healthStatus === 'healthy').length,
        });
      } catch (err) {
        setError('Impossible de charger les donnees');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-600 font-medium">{error}</p>
      </div>
    );
  }

  const cards = [
    { title: 'Total ERP', value: stats.total, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { title: 'Actifs', value: stats.active, color: 'green', bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    { title: 'Inactifs', value: stats.inactive, color: 'red', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    { title: 'Sains', value: stats.healthy, color: 'purple', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tableau de bord</h1>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div key={card.title} className={`${card.bg} rounded-xl shadow border ${card.border} p-6`}>
            <p className="text-sm font-medium text-gray-500">{card.title}</p>
            <p className={`text-3xl font-bold ${card.text} mt-2`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Graphique simplifie */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Activite des ERP</h3>
        <div className="flex items-end space-x-3 h-40">
          {[
            { label: 'Total', value: stats.total, color: 'bg-blue-500' },
            { label: 'Actifs', value: stats.active, color: 'bg-green-500' },
            { label: 'Inactifs', value: stats.inactive, color: 'bg-red-500' },
            { label: 'Sains', value: stats.healthy, color: 'bg-purple-500' },
          ].map((bar) => {
            const maxVal = Math.max(stats.total, 1);
            const height = Math.max((bar.value / maxVal) * 100, 4);
            return (
              <div key={bar.label} className="flex flex-col items-center flex-1">
                <span className="text-sm font-medium text-gray-600 mb-1">{bar.value}</span>
                <div className={`w-full ${bar.color} rounded-t-md transition-all`} style={{ height: `${height}%` }} />
                <span className="text-xs text-gray-500 mt-2">{bar.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Derniers ERP */}
      <div className="bg-white rounded-xl shadow border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Derniers ERP ajoutes</h3>
        </div>
        <div className="p-6">
          {recentErps.length === 0 ? (
            <p className="text-gray-500">Aucun ERP enregistre</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-gray-100">
                    <th className="pb-3 font-medium">Code</th>
                    <th className="pb-3 font-medium">Nom</th>
                    <th className="pb-3 font-medium">Statut</th>
                    <th className="pb-3 font-medium">Sante</th>
                  </tr>
                </thead>
                <tbody>
                  {recentErps.map((erp) => (
                    <tr key={erp.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 font-mono text-sm font-medium">{erp.code}</td>
                      <td className="py-3 text-gray-700">{erp.nom}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          erp.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {erp.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          erp.healthStatus === 'healthy' ? 'bg-blue-100 text-blue-700' :
                          erp.healthStatus === 'unknown' ? 'bg-gray-100 text-gray-600' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {erp.healthStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
