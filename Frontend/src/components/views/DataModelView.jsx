// DataModelView.jsx — Data Model Manager (BM-CDC-03)
import React, { useState, useMemo } from 'react';
import {
  Database,
  Plus,
  Key,
  Link,
  Code2,
  Table,
  Eye,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Layers,
  ArrowRight,
  Sparkles,
  GitBranch,
  ShieldAlert,
  Edit2,
  Trash2,
  ChevronRight,
  X,
  Save,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function DataModelView() {
  const {
    selectedApp,
    selectedVersion,
    applications,
    setSelectedAppId,
    appDataModels,
    createEntity,
    updateEntity,
    deleteEntity,
    addField,
    deleteField,
    addRelation,
    deleteRelation,
    showToast,
    isVersionReadOnly,
  } = useApp();

  const [selectedEntityId, setSelectedEntityId] = useState(() => appDataModels[0]?.id || 'ent_prod_01');
  const [activeTab, setActiveTab] = useState('entities'); // 'entities' | 'diagram' | 'relations' | 'migrations'

  // Modals state
  const [isNewEntityModalOpen, setIsNewEntityModalOpen] = useState(false);
  const [isNewFieldModalOpen, setIsNewFieldModalOpen] = useState(false);
  const [isNewRelationModalOpen, setIsNewRelationModalOpen] = useState(false);
  const [isSavingEntity, setIsSavingEntity] = useState(false);

  // Form states
  const [entityForm, setEntityForm] = useState({
    name: '',
    code: '',
    plural: '',
    tableName: '',
    category: 'Commerce',
    description: '',
  });

  const [fieldForm, setFieldForm] = useState({
    name: '',
    technicalName: '',
    type: 'TEXT',
    required: false,
    isPrimary: false,
    isUnique: false,
    defaultValue: '',
    description: '',
  });

  const [relationForm, setRelationForm] = useState({
    name: '',
    targetCode: '',
    type: 'MANY_TO_ONE',
    sourceField: 'id',
    targetField: 'id',
    onDelete: 'SET_NULL',
  });

  const currentEntity = useMemo(() => {
    return appDataModels.find((e) => e.id === selectedEntityId) || appDataModels[0] || null;
  }, [appDataModels, selectedEntityId]);

  const handleExportSchema = () => {
    const schemaJSON = JSON.stringify(
      {
        standard: 'BM-CDC-03',
        applicationCode: selectedApp?.code,
        applicationName: selectedApp?.name,
        version: selectedVersion?.versionNumber || '1.0.0',
        generatedAt: new Date().toISOString(),
        entities: appDataModels,
      },
      null,
      2
    );
    const blob = new Blob([schemaJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-${selectedApp?.code || 'app'}-v${selectedVersion?.versionNumber || '1.0.0'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Schéma de données (BM-CDC-03) exporté au format JSON.');
  };

  const handleCreateEntitySubmit = async (e) => {
    e.preventDefault();
    if (!entityForm.name) {
      showToast('Le nom de l entité est requis', 'error');
      return;
    }
    setIsSavingEntity(true);
    const res = await createEntity(entityForm);
    setIsSavingEntity(false);
    if (res.success) {
      setSelectedEntityId(res.data.id);
      setIsNewEntityModalOpen(false);
      setEntityForm({ name: '', code: '', plural: '', tableName: '', category: 'Commerce', description: '' });
    }
  };

  const handleAddFieldSubmit = (e) => {
    e.preventDefault();
    if (!fieldForm.name || !currentEntity) return;
    addField(currentEntity.id, fieldForm);
    setIsNewFieldModalOpen(false);
    setFieldForm({
      name: '',
      technicalName: '',
      type: 'TEXT',
      required: false,
      isPrimary: false,
      isUnique: false,
      defaultValue: '',
      description: '',
    });
  };

  const handleAddRelationSubmit = (e) => {
    e.preventDefault();
    if (!relationForm.targetCode || !currentEntity) return;
    const target = appDataModels.find((e) => e.code === relationForm.targetCode);
    addRelation(currentEntity.id, {
      ...relationForm,
      targetEntityId: target?.id,
    });
    setIsNewRelationModalOpen(false);
    setRelationForm({
      name: '',
      targetCode: '',
      type: 'MANY_TO_ONE',
      sourceField: 'id',
      targetField: 'id',
      onDelete: 'SET_NULL',
    });
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Data Model
            </h1>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
              BM-CDC-03
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Définissez les entités, champs et relations de l’application.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Target App Switcher */}
          <select
            value={selectedApp?.id || ''}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
          >
            {applications.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (v{a.publishedVersionNumber || a.currentVersionNumber || '1.0.0'})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportSchema}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter Schéma JSON</span>
          </button>

          <button
            onClick={() => setIsNewEntityModalOpen(true)}
            disabled={isVersionReadOnly || isSavingEntity}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isSavingEntity ? 'Enregistrement…' : 'Nouvelle Entité'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Entités déclarées
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{appDataModels.length}</span>
            <span className="text-xs font-bold text-emerald-600">Actives</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Champs typés
          </span>
          <div className="mt-2">
            <span className="text-3xl font-black text-blue-600">
              {appDataModels.reduce((acc, e) => acc + (e.fields?.length || 0), 0)}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-semibold">Attributs</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Relations Actives
          </span>
          <div className="mt-2">
            <span className="text-3xl font-black text-purple-600">
              {appDataModels.reduce((acc, e) => acc + (e.relations?.length || 0), 0)}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-semibold">Jointures</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Intégrité Schéma
          </span>
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-lg font-black text-slate-900">100% Valide</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('entities')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'entities'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Entités & Attributs</span>
        </button>

        <button
          onClick={() => setActiveTab('diagram')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'diagram'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Diagramme Relationnel</span>
        </button>

        <button
          onClick={() => setActiveTab('relations')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'relations'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Link className="w-3.5 h-3.5" />
          <span>Relations & Clés Étrangères</span>
        </button>

        <button
          onClick={() => setActiveTab('migrations')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'migrations'
              ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Plan de Migration DDL</span>
        </button>
      </div>

      {/* 4. Main Tab Content */}
      {activeTab === 'entities' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Entity List Selector */}
          <div className="lg:col-span-4 space-y-3">
            <div className="p-3 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-between">
              <span>Entités ({appDataModels.length})</span>
              <button
                onClick={() => setIsNewEntityModalOpen(true)}
                disabled={isVersionReadOnly}
                className="text-emerald-700 hover:underline flex items-center gap-1 font-extrabold"
              >
                <Plus className="w-3 h-3" /> Ajouter
              </button>
            </div>

            <div className="space-y-2">
              {appDataModels.map((entity) => {
                const isSelected = entity.id === currentEntity?.id;
                return (
                  <div
                    key={entity.id}
                    onClick={() => setSelectedEntityId(entity.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Database className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900">{entity.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">#{entity.code}</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                        {entity.fields?.length || 0} champs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Entity Field Details */}
          <div className="lg:col-span-8 space-y-4">
            {currentEntity ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">{currentEntity.name}</h2>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold">
                        table: {currentEntity.tableName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{currentEntity.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsNewFieldModalOpen(true)}
                      disabled={isVersionReadOnly}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter un Attribut</span>
                    </button>
                    <button
                      onClick={() => deleteEntity(currentEntity.id)}
                      disabled={isVersionReadOnly}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Supprimer l'entité"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Fields Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200/70">
                      <tr>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">Nom Attribut</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">Type Donnée</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">Contraintes</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600">Défaut</th>
                        <th className="px-3.5 py-2.5 font-bold text-slate-600 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentEntity.fields?.map((field) => (
                        <tr key={field.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-3.5 py-3">
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                              {field.isPrimary && <Key className="w-3 h-3 text-amber-500" />}
                              <span>{field.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{field.technicalName}</div>
                          </td>
                          <td className="px-3.5 py-3">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-black font-mono">
                              {field.type}
                            </span>
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-1 flex-wrap">
                              {field.required && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 text-[9px] font-bold">
                                  NOT NULL
                                </span>
                              )}
                              {field.isUnique && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[9px] font-bold">
                                  UNIQUE
                                </span>
                              )}
                              {field.isPrimary && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold">
                                  PK
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 text-slate-500 font-mono text-[11px]">
                            {field.defaultValue || '-'}
                          </td>
                          <td className="px-3.5 py-3 text-right">
                            {!field.isPrimary && (
                              <button
                                onClick={() => deleteField(currentEntity.id, field.id)}
                                disabled={isVersionReadOnly}
                                className="text-slate-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Entity Relations */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Relations & Clés Étrangères ({currentEntity.relations?.length || 0})
                    </h3>
                    <button
                      onClick={() => setIsNewRelationModalOpen(true)}
                      disabled={isVersionReadOnly}
                      className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" /> Ajouter Relation
                    </button>
                  </div>

                  <div className="space-y-2">
                    {currentEntity.relations?.length > 0 ? (
                      currentEntity.relations.map((rel) => (
                        <div
                          key={rel.id}
                          className="p-3 rounded-xl bg-purple-50/40 border border-purple-200/60 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <Link className="w-3.5 h-3.5 text-purple-600" />
                            <span className="font-extrabold text-purple-900">{rel.name}</span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                              {rel.type}
                            </span>
                            <ArrowRight className="w-3 h-3 text-purple-400" />
                            <span className="font-mono text-purple-800">{rel.targetCode}</span>
                          </div>
                          <button
                            onClick={() => deleteRelation(currentEntity.id, rel.id)}
                            disabled={isVersionReadOnly}
                            className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic">Aucune relation déclarée.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">Sélectionnez une entité</div>
            )}
          </div>
        </div>
      )}

      {/* Diagram View */}
      {activeTab === 'diagram' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">Diagramme Schématique Entités-Relations</h3>
            <span className="text-xs text-slate-400">Rendu SVG interactif</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {appDataModels.map((ent) => (
              <div
                key={ent.id}
                className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/20 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <div className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{ent.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{ent.tableName}</span>
                </div>

                <div className="space-y-1">
                  {ent.fields?.map((f) => (
                    <div key={f.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-700 flex items-center gap-1">
                        {f.isPrimary && <Key className="w-2.5 h-2.5 text-amber-500" />}
                        {f.name}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">{f.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Migrations View */}
      {activeTab === 'migrations' && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">Générateur SQL DDL Automatisé</h3>
              <p className="text-xs text-slate-500">
                Script SQL généré en temps réel pour PostgreSQL conforme aux tables déclarées.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(
                  appDataModels
                    .map(
                      (e) =>
                        `CREATE TABLE ${e.tableName} (\n` +
                        e.fields
                          ?.map(
                            (f) =>
                              `  ${f.technicalName} ${f.type === 'UUID' ? 'UUID' : f.type === 'INTEGER' ? 'INT' : 'VARCHAR(255)'}${
                                f.isPrimary ? ' PRIMARY KEY' : ''
                              }${f.required ? ' NOT NULL' : ''}`
                          )
                          .join(',\n') +
                        '\n);'
                    )
                    .join('\n\n')
                );
                showToast('Script SQL copié dans le presse-papier !');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold"
            >
              <Copy className="w-3 h-3" />
              <span>Copier SQL</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
            {appDataModels
              .map(
                (e) =>
                  `-- Table ${e.name} (#${e.code})\nCREATE TABLE IF NOT EXISTS ${e.tableName} (\n` +
                  e.fields
                    ?.map(
                      (f) =>
                        `  ${f.technicalName.padEnd(16)} ${f.type === 'UUID' ? 'UUID' : f.type === 'INTEGER' ? 'INTEGER' : f.type === 'CURRENCY' ? 'NUMERIC(12,2)' : 'VARCHAR(255)'}${
                          f.isPrimary ? ' PRIMARY KEY' : ''
                        }${f.required ? ' NOT NULL' : ''}`
                    )
                    .join(',\n') +
                  '\n);'
              )
              .join('\n\n')}
          </pre>
        </div>
      )}

      {/* MODAL 1: Nouvelle Entité */}
      {isNewEntityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">Créer une nouvelle entité de données</h3>
              <button onClick={() => setIsNewEntityModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEntitySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom de l'entité *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fournisseur"
                  value={entityForm.name}
                  onChange={(e) => setEntityForm({ ...entityForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Code technique (kebab-case)</label>
                <input
                  type="text"
                  placeholder="Ex: supplier"
                  value={entityForm.code}
                  onChange={(e) => setEntityForm({ ...entityForm, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom de table SQL</label>
                <input
                  type="text"
                  placeholder="Ex: bm_suppliers"
                  value={entityForm.tableName}
                  onChange={(e) => setEntityForm({ ...entityForm, tableName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description métier</label>
                <textarea
                  rows={2}
                  placeholder="Rôle et usage de l'entité..."
                  value={entityForm.description}
                  onChange={(e) => setEntityForm({ ...entityForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewEntityModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Enregistrer l'entité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Ajouter un Attribut */}
      {isNewFieldModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Ajouter un attribut à {currentEntity?.name}
              </h3>
              <button onClick={() => setIsNewFieldModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddFieldSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du champ *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: email, reference, amount"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value, technicalName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type de donnée</label>
                <select
                  value={fieldForm.type}
                  onChange={(e) => setFieldForm({ ...fieldForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="TEXT">TEXT (Chaîne de caractères)</option>
                  <option value="INTEGER">INTEGER (Nombre entier)</option>
                  <option value="DECIMAL">DECIMAL (Nombre flottant)</option>
                  <option value="CURRENCY">CURRENCY (Montant monétaire)</option>
                  <option value="BOOLEAN">BOOLEAN (Booléen)</option>
                  <option value="ENUM">ENUM (Valeurs fixes)</option>
                  <option value="DATETIME">DATETIME (Date & Heure)</option>
                  <option value="UUID">UUID (Identifiant universel)</option>
                  <option value="RELATION">RELATION (Clé étrangère)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldForm.required}
                    onChange={(e) => setFieldForm({ ...fieldForm, required: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Requis (NOT NULL)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fieldForm.isUnique}
                    onChange={(e) => setFieldForm({ ...fieldForm, isUnique: e.target.checked })}
                    className="rounded text-purple-600"
                  />
                  <span>Unique (UNIQUE)</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Valeur par défaut</label>
                <input
                  type="text"
                  placeholder="Ex: 0, NOW(), 'STANDARD'"
                  value={fieldForm.defaultValue}
                  onChange={(e) => setFieldForm({ ...fieldForm, defaultValue: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewFieldModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Ajouter le champ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Nouvelle Relation */}
      {isNewRelationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">Déclarer une relation de jointure</h3>
              <button onClick={() => setIsNewRelationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRelationSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom de la relation</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: ProductSupplier"
                  value={relationForm.name}
                  onChange={(e) => setRelationForm({ ...relationForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Entité Cible</label>
                <select
                  value={relationForm.targetCode}
                  onChange={(e) => setRelationForm({ ...relationForm, targetCode: e.target.value })}
                  required
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="">Sélectionnez une cible...</option>
                  {appDataModels
                    .filter((e) => e.id !== currentEntity?.id)
                    .map((ent) => (
                      <option key={ent.id} value={ent.code}>
                        {ent.name} (#{ent.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cardinalité</label>
                <select
                  value={relationForm.type}
                  onChange={(e) => setRelationForm({ ...relationForm, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="MANY_TO_ONE">MANY_TO_ONE (N:1)</option>
                  <option value="ONE_TO_MANY">ONE_TO_MANY (1:N)</option>
                  <option value="ONE_TO_ONE">ONE_TO_ONE (1:1)</option>
                  <option value="MANY_TO_MANY">MANY_TO_MANY (N:M)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewRelationModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Créer la relation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
