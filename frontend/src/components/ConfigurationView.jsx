import { api } from '../services/apiClient.js';
import { Link, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../app/routes.js';
import { useTenant } from '../contexts/TenantProvider.jsx';
import { ContextBar } from './ContextBar.jsx';
import { getEffective } from '../services/api/platformConfigService.js';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setSelectedScope,
  addConfigItem,
  updateConfigItem,
  deleteConfigItem,
  CONFIG_SCOPES,
  CONFIG_TYPES,
  fetchConfigsAsync,
  addConfigItemAsync,
  updateConfigItemAsync,
} from '../store/configSlice.js';
import { logAuditAction } from '../store/auditSlice.js';
import { addToast, setSearchQuery } from '../store/platformSlice.js';
import {
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  X,
} from 'lucide-react';

export default function ConfigurationView() {
  const dispatch = useDispatch();
  const { activeTenant } = useTenant();
  const [params] = useSearchParams();
  const [tab, setTab] = useState('definitions');
  const [effective, setEffective] = useState([]);
  const [effectiveError, setEffectiveError] = useState('');
  const [effectiveLoading, setEffectiveLoading] = useState(false);
  let storedContext = {};
  try { storedContext = JSON.parse(sessionStorage.getItem('bm-context:'+activeTenant?.id) || '{}'); } catch {}
  const context = {applicationId:params.get('applicationId') || storedContext.applicationId,applicationVersionId:params.get('applicationVersionId') || storedContext.versionId,environmentId:params.get('environmentId')};
  const [contextLabels,setContextLabels] = useState({});
  const [saveError,setSaveError] = useState('');
  useEffect(()=>{let live=true;setContextLabels({});if(context.applicationId && context.applicationVersionId) Promise.all([api.get('/business-manager/applications/'+context.applicationId),api.get('/business-manager/versions/'+context.applicationVersionId)]).then(([a,v])=>{if(live)setContextLabels({application:a.data.name,version:v.data.version,status:v.data.status});}).catch(()=>{});return()=>{live=false;};},[activeTenant?.id,context.applicationId,context.applicationVersionId]);
  const hasContext = Object.values(context).every(value => /^[0-9a-f-]{36}$/i.test(value || ''));
  const loadEffective = async () => { setEffectiveLoading(true); setEffectiveError(''); try { const rows = await getEffective(context); setEffective(rows); } catch { setEffectiveError('Impossible de résoudre la configuration effective.'); } finally { setEffectiveLoading(false); } };
  const configLoading = useSelector(state => state.config.loading);
  const configError = useSelector(state => state.config.error);

  const configItems = useSelector((state) => state.config.items);
  const selectedScope = useSelector((state) => state.config.selectedScope);
  const activeUser = useSelector((state) => state.platform.activeUser);
  const searchQuery = useSelector((state) => state.platform.searchQuery);
  const providerMode = 'REAL';

  useEffect(() => {
    if (providerMode === 'REAL') {
      dispatch(fetchConfigsAsync());
    }
  }, [dispatch, providerMode, activeTenant?.id]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showSecrets, setShowSecrets] = useState(false);

  const [formKey, setFormKey] = useState('');
  const [formScope, setFormScope] = useState('PLATFORM');
  const [formScopeId, setFormScopeId] = useState('platform-root');
  const [formType, setFormType] = useState('STRING');
  const [formValue, setFormValue] = useState('');
  const [formDefaultValue, setFormDefaultValue] = useState('');
  const [formRequired, setFormRequired] = useState(true);
  const [formIsSecret, setFormIsSecret] = useState(false);
  const [formDesc, setFormDesc] = useState('');

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

  const handleSaveConfig = async (e) => {
    e.preventDefault(); setSaveError('');
    try {
      const body = {key:formKey.trim(),value:formValue.trim(),defaultValue:formDefaultValue.trim() || formValue.trim(),required:formRequired,schema:editingItem?.schema || {}};
      if(editingItem) await dispatch(updateConfigItemAsync({id:editingItem.id,body})).unwrap();
      else await dispatch(addConfigItemAsync({...body,scope:formScope,...(formScope!=='PLATFORM'?{scopeId:formScopeId}:{}),type:formType})).unwrap();
      dispatch(addToast({type:'success',title:'Configuration enregistrée',message:formKey}));
      setShowAddModal(false); setEditingItem(null); resetForm();
    } catch { setSaveError('Enregistrement impossible. Vérifiez le scope, les valeurs et vos droits, puis réessayez.'); }
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
    <div className="w-full space-y-5">
      <nav aria-label="Fil d’Ariane" className="text-xs text-slate-400"><Link to={ROUTES.bm}>Business Manager</Link> / Configuration</nav>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div><h1 className="text-2xl font-semibold text-slate-900">Configuration</h1><p className="mt-2 text-sm text-slate-600">Gérez les paramètres et leurs valeurs effectives pour la version courante.</p></div>
        <div className="flex items-center gap-2.5 shrink-0 mt-4 sm:mt-0">
          <button
            onClick={() => setShowSecrets(!showSecrets)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-all "
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
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm "
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un paramètre</span>
          </button>
        </div>
      </div>

      <ContextBar application={contextLabels.application} version={contextLabels.version} status={contextLabels.status} tenant={activeTenant?.name || activeTenant?.code} />
      {saveError && <p role="alert" className="text-red-700">{saveError}</p>}
      <div role="tablist" aria-label="Configuration" className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">{[['definitions','Définitions'],['values','Valeurs'],['effective','Configuration effective']].map(([id,label]) => <button key={id} role="tab" aria-selected={tab===id} onClick={() => setTab(id)} className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors duration-150 ease-out motion-reduce:transition-none ${tab===id?'border-blue-100 bg-blue-50 text-blue-700':'border-transparent bg-white text-slate-500 hover:bg-slate-50'}`}>{label}</button>)}</div>
      {configLoading && <p role="status">Chargement des paramètres…</p>}
      {configError && <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-800">Impossible de charger les paramètres. <button className="ml-2 text-blue-600" onClick={()=>dispatch(fetchConfigsAsync())}>Réessayer</button></p>}
      {tab === 'effective' ? <section className="rounded-xl border bg-white p-5 space-y-4"><h2 className="text-lg font-semibold">Valeurs effectives et provenance</h2>
        {!hasContext ? <p className="text-slate-600">Sélectionnez une application, une version et un environnement pour résoudre les valeurs effectives. Le contexte complet n’est pas encore fourni par tous les écrans.</p> : <button disabled={effectiveLoading} onClick={loadEffective} className="rounded bg-blue-600 px-4 py-2 text-white">{effectiveLoading?'Chargement…':'Résoudre les valeurs'}</button>}
        {effectiveError && <p role="alert">{effectiveError}</p>}
        <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50/80 text-xs text-slate-500"><tr><th>Paramètre</th><th>Valeur effective</th><th>Provenance</th></tr></thead><tbody>{effective.map(item => <tr key={item.id} className="border-t border-slate-100 bg-white hover:bg-slate-50/50 transition-colors duration-150 ease-out motion-reduce:transition-none"><td className="py-3">{item.key}</td><td>{JSON.stringify(item.value)}</td><td>{item.scope} / {item.scopeId || 'Plateforme'}</td></tr>)}</tbody></table></div>
      </section> : <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-slate-200/50 rounded-xl w-fit">
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

        <div className="relative w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une clé, scope, type..."
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
              className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => dispatch(setSearchQuery(''))}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {searchQuery && (
        <div className="flex items-center justify-between gap-2 p-3.5 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-950 animate-in fade-in mb-4">
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
            <span>Réinitialiser</span>
          </button>
        </div>
      )}

      {filteredConfigs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden p-12 text-center">
          <Search className="w-6 h-6 mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500">Aucune clé de configuration ne correspond à votre recherche.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-5">Clé Technique</th>
                  <th className="py-3.5 px-3">Portée (Scope)</th>
                  <th className="py-3.5 px-3">Type</th>
                  <th className="py-3.5 px-4">{tab === 'definitions' ? 'Valeur par défaut' : 'Valeur configurée'}</th>
                  <th className="py-3.5 px-3">Statut</th>
                  <th className="py-3.5 px-3">Version</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredConfigs.map((item) => {
                  const isInvalid = item.status === 'INVALID';

                  return (
                    <tr key={item.id} className="bg-white hover:bg-slate-50/50 transition-colors duration-150 ease-out motion-reduce:transition-none">
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-slate-900">{item.key}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{item.description}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold">
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
                            {JSON.stringify(tab === 'definitions' ? item.defaultValue : item.value)}
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
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      </>}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
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
                    onChange={(e) => { const scope=e.target.value; setFormScope(scope); setFormScopeId(scope==='TENANT'?activeTenant?.id || '':scope==='APPLICATION'?context.applicationId || '':scope==='APPLICATION_VERSION'?context.applicationVersionId || '':''); }}
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
                  className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
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
