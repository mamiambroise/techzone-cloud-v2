import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeftIcon,
  ServerStackIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { erpRegistryService } from '../services/apiClient.js';
import { useToast } from '../hooks/useToast.js';

const TYPES = ['CLOUD', 'ON_PREMISE', 'MOCK', 'HYBRID'];
const ENVIRONMENTS = ['DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION'];

const inputClass =
  'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

function ERPCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast.success(`L'ERP « ${formData.code.trim()} » a été créé avec succès.`);
      navigate('/erps');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la creation';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/erps')}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 font-medium"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        Retour
      </button>

      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
          <ServerStackIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Ajouter un nouvel ERP</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Enregistrer un nouveau système dans le registre</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/30 border border-red-200 rounded-xl p-4">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 space-y-6">
        <div>
          <label className={labelClass}>Code *</label>
          <input
            type="text"
            name="code"
            value={formData.code}
            onChange={handleChange}
            required
            placeholder="Ex: SAP_B1"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Nom *</label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
            placeholder="Ex: SAP Business One"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Type</label>
            <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Environnement</label>
            <select name="environment" value={formData.environment} onChange={handleChange} className={inputClass}>
              {ENVIRONMENTS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>URL</label>
          <input
            type="text"
            name="url"
            value={formData.url}
            onChange={handleChange}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
            ) : (
              <CheckIcon className="w-5 h-5" />
            )}
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/erps')}
            className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-6 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium"
          >
            <XMarkIcon className="w-5 h-5" />
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}

export default ERPCreate;
