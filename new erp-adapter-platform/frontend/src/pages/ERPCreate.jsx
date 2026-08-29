import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { erpRegistryService } from '../services/api';

const TYPES = ['CLOUD', 'ON_PREMISE', 'MOCK', 'HYBRID'];
const ENVIRONMENTS = ['DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION'];

function ERPCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    type: 'CLOUD',
    url: '',
    environment: 'DEVELOPMENT',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code.trim() || !formData.nom.trim()) {
      setError('Le code et le nom sont obligatoires');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await erpRegistryService.create({
        code: formData.code.trim(),
        nom: formData.nom.trim(),
        type: formData.type,
        url: formData.url.trim(),
        environment: formData.environment,
      });
      navigate('/erps');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la creation';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Ajouter un nouvel ERP</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow border border-gray-200 p-6 space-y-6">
        {/* Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            placeholder="Ex: SAP_B1"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            placeholder="Ex: SAP Business One"
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
            placeholder="https://..."
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
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer'}
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

export default ERPCreate;
