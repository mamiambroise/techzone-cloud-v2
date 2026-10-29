import React, { useState } from 'react';
import { erpRegistryService } from '../../../services/apiClient.js';
import {
  XMarkIcon,
  CloudArrowUpIcon,
  ServerIcon,
  ShieldCheckIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

export function AddDataSourceForm({ onCancel, onSubmit }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    providerType: 'REST_API',
    baseUrl: '',
    authType: 'OAUTH2',
    clientId: '',
    clientSecret: '',
    environment: 'PRODUCTION',
  });
  const [submitError, setSubmitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (formData.providerType !== 'REST_API') {
        throw new Error('Le registre backend ne prend actuellement en charge que les sources ERP REST configurées.');
      }
      const response = await erpRegistryService.create({
        code: formData.code,
        nom: formData.name,
        type: 'DOLIBARR',
        url: formData.baseUrl,
        environment: formData.environment,
        apiKey: formData.clientSecret,
      });
      onSubmit({ ...formData, created: response.data });
    } catch (error) {
      setSubmitError(error?.response?.data?.message || error?.response?.data?.error || error?.message || 'La source n’a pas pu être créée.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tz-surface max-w-2xl mx-auto overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Nouvelle source de données</h2>
          <p className="text-xs text-slate-500">Enregistrement d'un nouveau provider dans le registre canonique</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <XMarkIcon className="h-5 w-5 text-slate-500" />
        </button>
      </div>

      <div className="p-8">
        {/* Stepper */}
        <div className="flex items-center gap-4 mb-10">
          {[1, 2, 3].map(i => (
            <React.Fragment key={i}>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step === i ? 'bg-blue-600 text-white' : step > i ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {step > i ? '✓' : i}
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 rounded-full ${step > i ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Nom de la source</label>
                <input
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: ERP Dolibarr Production"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Code unique (ID)</label>
                <input
                  required
                  value={formData.code}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  placeholder="ex: ERP_DOLIBARR_PROD"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Type de provider</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'REST_API', label: 'API REST', icon: CloudArrowUpIcon },
                    { id: 'POSTGRESQL', label: 'PostgreSQL', icon: ServerIcon },
                  ].map(t => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, providerType: t.id })}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          formData.providerType === t.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <Icon className={`h-6 w-6 ${formData.providerType === t.id ? 'text-blue-600' : 'text-slate-400'}`} />
                        <span className={`text-xs font-bold ${formData.providerType === t.id ? 'text-blue-700' : 'text-slate-600'}`}>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">URL de base / Host</label>
                <input
                  required
                  value={formData.baseUrl}
                  onChange={e => setFormData({ ...formData, baseUrl: e.target.value })}
                  placeholder="https://api.example.com/v1"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Type d'authentification</label>
                <select
                  value={formData.authType}
                  onChange={e => setFormData({ ...formData, authType: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="OAUTH2">OAuth2 Client Credentials</option>
                  <option value="API_KEY">API Key</option>
                  <option value="BASIC">Basic Auth</option>
                  <option value="NONE">Aucune</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700">Client ID / Username</label>
                  <input
                    value={formData.clientId}
                    onChange={e => setFormData({ ...formData, clientId: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-slate-700">Client Secret / Password</label>
                  <input
                    type="password"
                    value={formData.clientSecret}
                    onChange={e => setFormData({ ...formData, clientSecret: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="p-6 rounded-2xl bg-blue-50 border border-blue-100 space-y-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-blue-900">
                  <ShieldCheckIcon className="h-5 w-5" />
                  Récapitulatif de sécurité
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-blue-600">Source</p>
                    <p className="text-sm text-slate-900">{formData.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-blue-600">Environnement</p>
                    <p className="text-sm text-slate-900">{formData.environment}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] uppercase font-bold text-blue-600">Endpoint</p>
                    <p className="text-sm font-mono text-slate-700 truncate">{formData.baseUrl}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 border border-slate-100 rounded-xl bg-slate-50">
                <AdjustmentsHorizontalIcon className="h-5 w-5 text-slate-400" />
                <p className="text-xs text-slate-500 italic">En validant, un test de connectivité sera automatiquement lancé avant l'activation.</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-6 border-top border-slate-100">
            <button
              type="button"
              onClick={step === 1 ? onCancel : prevStep}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              {step === 1 ? 'Annuler' : 'Précédent'}
            </button>
            <button
              type="button"
              onClick={step === 3 ? handleSubmit : nextStep}
              disabled={submitting}
              className="bg-blue-600 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60"
            >
              {submitting ? 'Création…' : step === 3 ? 'Confirmer et créer' : 'Continuer'}
            </button>
          </div>
          {submitError && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{submitError}</div>}
        </form>
      </div>
    </div>
  );
}
