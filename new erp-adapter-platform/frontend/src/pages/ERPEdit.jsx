import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { erpRegistryService } from '../services/api';

const TYPES = ['CLOUD', 'ON_PREMISE', 'MOCK', 'HYBRID'];
const ENVIRONMENTS = ['DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION'];

function ERPEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    type: '',
    url: '',
    environment: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchErp = async () => {
      try {
        const res = await erpRegistryService.getOne(id);
        const erp = res.data;
        const env = erp.capabilities?.environment || 'DEVELOPMENT';
        setFormData({
          code: erp.code,
          nom: erp.nom,
          type: erp.type,
          url: erp.url,
          environment: env,
        });
      } catch (err) {
        setError('Impossible de charger les donnees de l\'ERP');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchErp();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nom.trim()) {
      setError('Le nom est obligatoire');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await erpRegistryService.update(id, {
        nom: formData.nom.trim(),
        type: formData.type,
        url: formData.url.trim(),
        environment: formData.environment,
      });
      navigate('/erps');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la mise a jour';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Modifier l'ERP</h1>
      <p className="text-gray-500 mb-6">Code: <span className="font-mono font-medium">{formData.code}</span></p>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-6">
        {/* Code (lecture seule) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
          <input
            type="text"
            value={formData.code}
            disabled
            className="w-full border border-gray-200 rounded-lg px-4 py-2 bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Le code ne peut pas etre modifie</p>
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
          <input
            type="text"
            name="url"
            value={formData.url}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Environnement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Environnement</label>
          <select
            name="environment"
            value={formData.environment}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ENVIRONMENTS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        {/* Boutons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/erps')}
            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default ERPEdit;
