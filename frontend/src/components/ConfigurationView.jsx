import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectedScope,
  addConfigItem,
  updateConfigItem,
  deleteConfigItem,
  CONFIG_SCOPES,
  CONFIG_TYPES,
  validateConfigEntry,
  fetchConfigsAsync,
  addConfigItemAsync,
  updateConfigItemAsync,
} from '../store/configSlice.js';
import { logAuditAction } from '../store/auditSlice.js';
import { addToast, setSearchQuery } from '../store/platformSlice.js';
import {
  Sliders,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  GitBranch,
  Layers,
  ArrowRight,
  ShieldCheck,
  Search,
  Filter,
  X,
} from 'lucide-react';

export default function ConfigurationView() {
  const dispatch = useDispatch();

  const configItems = useSelector((state) => state.config.items);
  const selectedScope = useSelector((state) => state.config.selectedScope);
  const applications = useSelector((state) => state.applications.applications);
  const environments = useSelector((state) => state.environments.environments);
  const activeUser = useSelector((state) => state.platform.activeUser);
  const searchQuery = useSelector((state) => state.platform.searchQuery);
  const providerMode = useSelector((state) => state.platform.providerMode);

  useEffect(() => {
    if (providerMode === 'REAL') {
      dispatch(fetchConfigsAsync());
    }
  }, [dispatch, providerMode]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showSecrets, setShowSecrets] = useState(false);

  // Inspector state (PF-CDC-05 Section 5 - Priority Resolution)
  const [inspectorKey, setInspectorKey] = useState('gateway.rate_limit.max_rps');
  const [inspectorAppId, setInspectorAppId] = useState('app-core-api');
  const [inspectorEnvId, setInspectorEnvId] = useState('env-prod');
  const [inspectorTenantId, setInspectorTenantId] = useState('tenant-logistics-de');

  // New config form state
  const [formKey, setFormKey] = useState('');
  const [formScope, setFormScope] = useState('PLATFORM');
  const [formScopeId, setFormScopeId] = useState('platform-root');
  const [formType, setFormType] = useState('STRING');
  const [formValue, setFormValue] = useState('');
  const [formDefaultValue, setFormDefaultValue] = useState('');
  const [formRequired, setFormRequired] = useState(true);
  const [formIsSecret, setFormIsSecret] = useState(false);
  const [formDesc, setFormDesc] = useState('');

  // Filtering
  const filteredConfigs = configItems.filter((item) => {
    const matchesScope = selectedScope === 'ALL' || item.scope === selectedScope;
    if (!searchQuery.trim()) return matchesScope;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.key.toLowerCase().includes(q) ||
      item.scope.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.value && String(item.value).toLowerCase().includes(q)) ||
      item.type.toLowerCase().includes(q);
    return matchesScope && matchesSearch;
  });

  // Calculate resolution inheritance for Inspector (PF-CDC-05 Section 5)
  const computeResolutionHierarchy = (key) => {
    // 1. Platform Default
    const platItem = configItems.find((c) => c.key === key && c.scope === 'PLATFORM');
    // 2. Application
    const appItem = configItems.find((c) => c.key === key && c.scope === 'APPLICATION' && c.scopeId === inspectorAppId);
    // 3. Application Version
    const verItem = configItems.find((c) => c.key === key && c.scope === 'APPLICATION_VERSION');
    // 4. Environment
    const envItem = configItems.find((c) => c.key === key && c.scope === 'ENVIRONMENT' && c.scopeId === inspectorEnvId);
    // 5. Tenant override
    const tenantItem = configItems.find((c) => c.key === key && c.scope === 'TENANT' && c.scopeId === inspectorTenantId);

    const steps = [
      { level: '1. Platform Default', item: platItem, note: 'Valeur socle racine' },
      { level: '2. Application', item: appItem, note: `Applicable à ${inspectorAppId}` },
      { level: '3. Application Version', item: verItem, note: 'Spécifique à la release candidate' },
      { level: '4. Environment', item: envItem, note: `Spécifique à ${inspectorEnvId}` },
      { level: '5. Tenant Override', item: tenantItem, note: `Dérogation pour ${inspectorTenantId}` },
    ];

    // Winner is the last defined level from bottom up (highest precedence)
    const effective = tenantItem || envItem || verItem || appItem || platItem;

    return { steps, effective };
  };

  const hierarchyResult = computeResolutionHierarchy(inspectorKey);

  const handleSaveConfig = (e) => {
    e.preventDefault();

    if (editingItem) {
      if (providerMode === 'MOCK') {
        dispatch(
          updateConfigItem({
            id: editingItem.id,
            key: formKey.trim(),
            scope: formScope,
            scopeId: formScopeId,
            type: formType,
            value: formValue.trim(),
            defaultValue: formDefaultValue.trim(),
            required: formRequired,
            isSecret: formIsSecret,
            description: formDesc.trim(),
            updatedBy: activeUser.email,
          })
        );
        dispatch(
          addToast({
            type: 'success',
            title: 'Configuration mise à jour',
            message: `La clé ${formKey} a été réévaluée et validée.`,
          })
        );
        setEditingItem(null);
      } else {
        dispatch(
          updateConfigItemAsync({
            id: editingItem.id,
            key: formKey.trim(),
            value: formValue.trim(),
            defaultValue: formDefaultValue.trim() || formValue.trim(),
            required: formRequired,
            schema: editingItem.schema,
          })
        ).then((result) => {
          if (result.meta.requestStatus === 'fulfilled') {
            dispatch(
              addToast({
                type: 'success',
                title: 'Configuration mise à jour',
                message: `La clé ${formKey} a été réévaluée et validée.`,
              })
            );
            setEditingItem(null);
          }
        });
      }
    } else {
      if (providerMode === 'MOCK') {
        dispatch(
          addConfigItem({
            key: formKey.trim(),
            scope: formScope,
            scopeId: formScopeId,
            type: formType,
            value: formValue.trim(),
            defaultValue: formDefaultValue.trim() || formValue.trim(),
            required: formRequired,
            isSecret: formIsSecret,
            description: formDesc.trim(),
            updatedBy: activeUser.email,
          })
        );
        dispatch(
          addToast({
            type: 'success',
            title: 'Nouvelle configuration ajoutée',
            message: `Clé ${formKey} déclarée sur le scope ${formScope}.`,
          })
        );
      } else {
        dispatch(
          addConfigItemAsync({
            key: formKey.trim(),
            scope: formScope,
            scopeId: formScopeId,
            type: formType,
            value: formValue.trim(),
            defaultValue: formDefaultValue.trim() || formValue.trim(),
            required: formRequired,
            schema: {},
          })
        ).then((result) => {
          if (result.meta.requestStatus === 'fulfilled') {
            dispatch(
              addToast({
                type: 'success',
                title: 'Nouvelle configuration ajoutée',
                message: `Clé ${formKey} déclarée sur le scope ${formScope}.`,
              })
            );
          }
        });
      }
    }

    dispatch(
      logAuditAction({
        actor: activeUser.email,
        role: activeUser.role,
        action: editingItem ? 'UPDATE_CONFIG' : 'CREATE_CONFIG',
        resourceType: 'CONFIG',
        resourceId: formKey,
        details: `Modification de paramètre scope: ${formScope} / ${formScopeId}. Type: ${formType}`,
        status: 'SUCCESS',
      })
    );

    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormKey('');
    setFormScope('PLATFORM');
    setFormScopeId('platform-root');
    setFormType('STRING');
    setFormValue('');
    setFormDefaultValue('');
    setFormRequired(true);
    setFormIsSecret(false);
    setFormDesc('');
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormKey(item.key);
    setFormScope(item.scope);
    setFormScopeId(item.scopeId);
    setFormType(item.type);
    setFormValue(item.value);
    setFormDefaultValue(item.defaultValue || '');
    setFormRequired(item.required !== false);
    setFormIsSecret(Boolean(item.isSecret));
    setFormDesc(item.description || '');
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              PF-CDC-05
            </span>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Configuration Manager (Typée & Versionnée)</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Gestion des paramètres techniques selon les 5 portées (Platform, App, Version, Env, Tenant), masquage des secrets Vault et validation stricte.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all active:scale-95"
            title="Masquer ou afficher les références de secrets"
          >
            {showSecrets ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
            <span>{showSecrets ? 'Masquer Références' : 'Voir Références Vault'}</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une Clé</span>
          </button>
        </div>
      </div>

      {/* Interactive Inheritance Resolution Inspector Bento Box (PF-CDC-05 Section 5) */}
      <div className="bg-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Inspecteur de Résolution d'Héritage (Precedence Cascade)</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Ordre canonique : Platform Default ➔ Application ➔ App Version ➔ Environment ➔ Tenant Override
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Select key */}
            <select
              value={inspectorKey}
              onChange={(e) => setInspectorKey(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 font-mono text-[11px] shadow-2xs"
            >
              {Array.from(new Set(configItems.map((c) => c.key))).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5-Step Visual Waterfall */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
          {hierarchyResult.steps.map((step) => {
            const hasValue = Boolean(step.item);
            const isWinner = hierarchyResult.effective && step.item?.id === hierarchyResult.effective.id;

            return (
              <div
                key={step.level}
                className={`p-3.5 rounded-2xl border transition-all duration-150 text-xs flex flex-col justify-between ${
                  isWinner
                    ? 'bg-indigo-600/30 border-indigo-400 ring-2 ring-indigo-400/20 shadow-md'
                    : hasValue
                    ? 'bg-slate-900/90 border-slate-800'
                    : 'bg-slate-950/60 border-slate-900 opacity-40'
                }`}
              >
                <div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">{step.level}</div>
                  <div className="mt-1 font-semibold text-slate-200 text-xs truncate">
                    {hasValue ? (
                      <span className="font-mono text-emerald-300">{step.item.value}</span>
                    ) : (
                      <span className="text-slate-500 italic">Non défini</span>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400 truncate mr-1">{step.note}</span>
                  {isWinner && (
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500 text-white font-bold font-mono text-[9px] shrink-0">
                      GAGNANT
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-300 font-mono">
          <span className="text-slate-400">Valeur résolue effective pour l'exécution :</span>
          <span className="px-3.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs w-fit">
            {hierarchyResult.effective ? hierarchyResult.effective.value : 'N/A'}
          </span>
        </div>
      </div>

      {/* Scope Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-200/50 rounded-2xl w-fit">
        <button
          onClick={() => dispatch(setSelectedScope('ALL'))}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
            selectedScope === 'ALL'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
          }`}
        >
          Tous les Scopes ({configItems.length})
        </button>
        {CONFIG_SCOPES.map((sc) => {
          const count = configItems.filter((c) => c.scope === sc).length;
          return (
            <button
              key={sc}
              onClick={() => dispatch(setSelectedScope(sc))}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                selectedScope === sc
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              {sc} ({count})
            </button>
          );
        })}
      </div>

      {/* Global Search Active Banner */}
      {searchQuery && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs text-amber-950 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Filtre actif : « <strong>{searchQuery}</strong> » — {filteredConfigs.length} clé(s) trouvée(s)
            </span>
          </div>
          <button
            onClick={() => dispatch(setSearchQuery(''))}
            className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            <span>Réinitialiser le filtre</span>
          </button>
        </div>
      )}

      {/* Config Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-5">Clé Technique</th>
                <th className="py-3.5 px-3">Portée (Scope)</th>
                <th className="py-3.5 px-3">Type</th>
                <th className="py-3.5 px-4">Valeur Active</th>
                <th className="py-3.5 px-3">Statut & Validation</th>
                <th className="py-3.5 px-3">Version</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConfigs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Search className="w-5 h-5 mx-auto text-slate-300 mb-1.5" />
                    Aucune clé de configuration ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredConfigs.map((item) => {
                const isInvalid = item.status === 'INVALID';

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-mono font-bold text-slate-900">{item.key}</div>
                      {item.description && (
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold block w-fit">
                        {item.scope}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5 block truncate max-w-[120px]">
                        {item.scopeId}
                      </span>
                    </td>

                    <td className="py-3.5 px-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {item.isSecret ? (
                        <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 w-fit">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>{showSecrets ? item.value : '•••••••••••••••• (Vault Ref)'}</span>
                        </span>
                      ) : (
                        <span className={`font-semibold ${isInvalid ? 'text-rose-600 line-through' : 'text-slate-800'}`}>
                          {item.value}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3">
                      {isInvalid ? (
                        <div className="flex items-start gap-1 text-rose-600 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <div>
                            <span>INVALID</span>
                            <div className="text-[10px] text-rose-500 font-normal font-sans">
                              {item.validationError || 'Validation échouée'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>VALID</span>
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-3 font-mono text-slate-500">v{item.version || 1}</td>

                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Éditer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (providerMode === 'REAL') {
                              dispatch(
                                addToast({
                                  type: 'warning',
                                  title: 'Suppression désactivée',
                                  message: 'La suppression de configuration n\'est pas disponible en mode réel (pas d\'endpoint DELETE).',
                                })
                              );
                              return;
                            }
                            if (window.confirm(`Supprimer la clé ${item.key} ?`)) {
                              dispatch(deleteConfigItem(item.id));
                              dispatch(addToast({ type: 'info', title: 'Clé supprimée', message: item.key }));
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            providerMode === 'REAL'
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                          }`}
                          title={providerMode === 'REAL' ? 'Non disponible en mode réel' : 'Supprimer'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit Config */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">
              {editingItem ? 'Modifier le paramètre de configuration' : 'Déclarer un nouveau paramètre'}
            </h3>
            <form onSubmit={handleSaveConfig} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clé (Format pointé stable)</label>
                <input
                  type="text"
                  required
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  placeholder="ex: gateway.rate_limit.max_rps"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Portée (Scope)</label>
                  <select
                    value={formScope}
                    onChange={(e) => setFormScope(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-semibold"
                  >
                    {CONFIG_SCOPES.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Identifiant Scope Cible</label>
                  <input
                    type="text"
                    required
                    value={formScopeId}
                    onChange={(e) => setFormScopeId(e.target.value)}
                    placeholder="ex: app-core-api ou env-prod"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type de donnée</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-semibold"
                  >
                    {CONFIG_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valeur</label>
                  <input
                    type="text"
                    required
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder={formIsSecret ? 'vault://platform/secrets/...' : 'Valeur'}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={formIsSecret}
                    onChange={(e) => setFormIsSecret(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Est un Secret (Référence Vault protégée)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
                  <input
                    type="checkbox"
                    checked={formRequired}
                    onChange={(e) => setFormRequired(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Obligatoire</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Usage et impact de cette configuration..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg"
                >
                  {editingItem ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
