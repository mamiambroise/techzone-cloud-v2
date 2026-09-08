import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeftIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { erpRegistryService } from '../services/api';
import { useToast } from '../components/ui/ToastProvider';

const TYPES = ['CLOUD', 'ON_PREMISE', 'MOCK', 'HYBRID'];
const ENVIRONMENTS = ['DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION'];

const inputClass =
  'w-full border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 dark:bg-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const labelClass = 'block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1';

function ERPEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
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
      toast.success(`L'ERP « ${formData.code.trim()} » a été mis à jour.`);
      navigate('/erps');
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur lors de la mise a jour';
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span className="w-5 h-5 border-2 border-slate-300 dark:border-slate-600 border-t-blue-500 rounded-full animate-spin" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

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
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
          <PencilSquareIcon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Modifier l'ERP</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Code : <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{formData.code}</span>
          </p>
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
          <label className={labelClass}>Code</label>
          <input
            type="text"
            value={formData.code}
            disabled
            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 bg-slate-50 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Le code ne peut pas être modifié</p>
        </div>

        <div>
          <label className={labelClass}>Nom *</label>
          <input
            type="text"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            required
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
            className={inputClass}
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <CheckIcon className="w-5 h-5" />
            )}
            {saving ? 'Enregistrement...' : 'Enregistrer'}
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

export default ERPEdit;
