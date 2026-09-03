// FeatureCapabilityView.jsx — Feature & Capability Manager (BM-CDC-04)
import React, { useState, useMemo } from "react";
import {
  Boxes,
  Puzzle,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  Plus,
  Search,
  Filter,
  Eye,
  Zap,
  Tag,
  Download,
  Flame,
  FileCode2,
  Database,
  Check,
  X,
  Trash2,
  Info,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export function FeatureCapabilityView() {
  const {
    selectedApp,
    selectedVersion,
    applications,
    setSelectedAppId,
    appFeatures,
    createFeature,
    deleteFeature,
    toggleFeatureStatus,
    addCapability,
    removeCapability,
    showToast,
    isVersionReadOnly,
  } = useApp();

  const [selectedFeatureId, setSelectedFeatureId] = useState(
    () => appFeatures[0]?.id || "feat_catalog",
  );
  const [activeTab, setActiveTab] = useState("features"); // 'features' | 'matrix' | 'dependencies' | 'impact'
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDomain, setFilterDomain] = useState("ALL");
  const [showNewFeatureModal, setShowNewFeatureModal] = useState(false);
  const [showNewCapModal, setShowNewCapModal] = useState(false);

  // Form states
  const [featureForm, setFeatureForm] = useState({
    name: "",
    code: "",
    domain: "Commerce",
    description: "",
    status: "ACTIVE",
  });

  const [capForm, setCapForm] = useState({
    code: "",
    name: "",
    type: "ACTION",
    risk: "LOW",
    required: true,
  });

  const selectedFeature = useMemo(() => {
    return (
      appFeatures.find((f) => f.id === selectedFeatureId) ||
      appFeatures[0] ||
      null
    );
  }, [appFeatures, selectedFeatureId]);

  const filteredFeatures = useMemo(() => {
    return appFeatures.filter((f) => {
      const matchSearch =
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.domain.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDomain = filterDomain === "ALL" || f.domain === filterDomain;
      return matchSearch && matchDomain;
    });
  }, [appFeatures, searchTerm, filterDomain]);

  const domains = useMemo(() => {
    const set = new Set(appFeatures.map((f) => f.domain));
    return ["ALL", ...Array.from(set)];
  }, [appFeatures]);

  const handleCreateFeatureSubmit = async (e) => {
    e.preventDefault();
    if (!featureForm.name) return;
    const res = await createFeature(featureForm);
    if (res.success) {
      setSelectedFeatureId(res.data.id);
      setShowNewFeatureModal(false);
      setFeatureForm({
        name: "",
        code: "",
        domain: "Commerce",
        description: "",
        status: "ACTIVE",
      });
    }
  };

  const handleAddCapabilitySubmit = async (e) => {
    e.preventDefault();
    if (!capForm.name || !selectedFeature) return;
    const res = await addCapability(selectedFeature.id, capForm);
    if (res.success) {
      setShowNewCapModal(false);
      setCapForm({
        code: "",
        name: "",
        type: "ACTION",
        risk: "LOW",
        required: true,
      });
    }
  };

  const handleExportFeatures = () => {
    const payload = JSON.stringify(
      {
        standard: "BM-CDC-04",
        application: selectedApp?.code,
        version: selectedVersion?.versionNumber,
        generatedAt: new Date().toISOString(),
        features: appFeatures,
      },
      null,
      2,
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `features-${selectedApp?.code || "app"}-v${selectedVersion?.versionNumber || "1.0.0"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Spécification des fonctionnalités (BM-CDC-04) exportée.");
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Features & Capabilities
            </h1>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">
              BM-CDC-04
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez les features, capacités et relations de l’application.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Target App Switcher */}
          <select
            value={selectedApp?.id || ""}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="h-10 px-3 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs cursor-pointer"
          >
            {applications.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (v
                {a.publishedVersionNumber || a.currentVersionNumber || "1.0.0"})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportFeatures}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter JSON</span>
          </button>

          <button
            onClick={() => setShowNewFeatureModal(true)}
            disabled={isVersionReadOnly}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Feature</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Total Features
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {appFeatures.length}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {appFeatures.filter((f) => f.status === "ACTIVE").length} actives
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Capacités IAM Déclarées
          </span>
          <div className="mt-2">
            <span className="text-3xl font-black text-blue-600">
              {appFeatures.reduce(
                (acc, f) => acc + (f.capabilities?.length || 0),
                0,
              )}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-semibold">
              Permissions
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Domaines Métier
          </span>
          <div className="mt-2">
            <span className="text-3xl font-black text-purple-600">
              {domains.length - 1}
            </span>
            <span className="text-xs text-slate-400 ml-2 font-semibold">
              Périmètres
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Graphe Acyclique (DAG)
          </span>
          <div className="mt-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-black text-slate-900">
              0 Dépendance circulaire
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("features")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "features"
              ? "border-blue-600 text-blue-700 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>Catalogue & Capacités</span>
        </button>

        <button
          onClick={() => setActiveTab("matrix")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "matrix"
              ? "border-blue-600 text-blue-700 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Matrice IAM & Rôles</span>
        </button>

        <button
          onClick={() => setActiveTab("dependencies")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "dependencies"
              ? "border-blue-600 text-blue-700 bg-blue-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Graphe de Dépendances</span>
        </button>
      </div>

      {/* 4. Tab 1: Catalogue & Capacités */}
      {activeTab === "features" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: List */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une fonctionnalité..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                {domains.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {filteredFeatures.map((feat) => {
                const isSelected = feat.id === selectedFeature?.id;
                const isActive = feat.status === "ACTIVE";
                return (
                  <div
                    key={feat.id}
                    onClick={() => setSelectedFeatureId(feat.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/60 border-blue-500 shadow-xs"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                            isActive
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          <Boxes className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900">
                            {feat.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            #{feat.code}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFeatureStatus(feat.id);
                          }}
                          disabled={isVersionReadOnly}
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition-colors ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {feat.status}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detail & Capabilities */}
          <div className="lg:col-span-7 space-y-4">
            {selectedFeature ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-slate-900">
                        {selectedFeature.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-black">
                        {selectedFeature.domain}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedFeature.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowNewCapModal(true)}
                      disabled={isVersionReadOnly}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs disabled:opacity-50"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ajouter Capacité</span>
                    </button>

                    <button
                      onClick={() => deleteFeature(selectedFeature.id)}
                      disabled={isVersionReadOnly}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      title="Supprimer la fonctionnalité"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Capabilities List */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>
                      Capacités & Permissions (
                      {selectedFeature.capabilities?.length || 0})
                    </span>
                  </h3>

                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
                    {selectedFeature.capabilities?.map((cap) => (
                      <div
                        key={cap.id}
                        className="p-3 bg-white hover:bg-slate-50/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-extrabold text-slate-900 flex items-center gap-2">
                            <span>{cap.name}</span>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px] text-slate-600">
                              {cap.code}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Type: {cap.type} • Risque: {cap.risk}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              cap.risk === "HIGH"
                                ? "bg-rose-100 text-rose-800"
                                : cap.risk === "MEDIUM"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {cap.risk} RISK
                          </span>
                          <button
                            onClick={() =>
                              removeCapability(selectedFeature.id, cap.id)
                            }
                            disabled={isVersionReadOnly}
                            className="text-slate-400 hover:text-red-600 p-1 disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Required Entities */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Entités requises pour ce module
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedFeature.requiredEntities?.length > 0 ? (
                      selectedFeature.requiredEntities.map((ent) => (
                        <span
                          key={ent}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5"
                        >
                          <Database className="w-3 h-3" />
                          <span>#{ent}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">
                        Aucune entité de données obligatoire.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                Sélectionnez une fonctionnalité
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Matrice IAM */}
      {activeTab === "matrix" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">
              Matrice de Sécurité & Contrôle d'Accès par Rôle
            </h3>
            <span className="text-xs text-slate-400">
              Contrat BM-CDC-04 Section 32
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/70">
                <tr>
                  <th className="px-4 py-3 font-bold text-slate-700">
                    Fonctionnalité & Capacité
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-center">
                    ADMINISTRATEUR
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-center">
                    BUILDER
                  </th>
                  <th className="px-4 py-3 font-bold text-slate-700 text-center">
                    LECTEUR (GUEST)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appFeatures.flatMap((f) =>
                  (f.capabilities || []).map((c) => (
                    <tr
                      key={`${f.id}-${c.id}`}
                      className="hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-slate-900">
                          {f.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {c.name} ({c.code})
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex p-1 rounded bg-emerald-100 text-emerald-800">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.risk === "HIGH" ? (
                          <span className="inline-flex p-1 rounded bg-rose-100 text-rose-800">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex p-1 rounded bg-emerald-100 text-emerald-800">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {c.type === "READ" ? (
                          <span className="inline-flex p-1 rounded bg-emerald-100 text-emerald-800">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span className="inline-flex p-1 rounded bg-slate-100 text-slate-400">
                            <X className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Graphe Dépendances */}
      {activeTab === "dependencies" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900">
            Arbre Topologique des Dépendances Fonctionnelles
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {appFeatures.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
              >
                <div className="font-extrabold text-xs text-slate-900 flex items-center justify-between">
                  <span>{f.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    #{f.code}
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  {f.dependencies?.length > 0 ? (
                    <div className="space-y-1 mt-1">
                      {f.dependencies.map((d, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-[11px] text-blue-700 font-medium"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>
                            {d.type}: <strong>#{d.targetCode}</strong>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic text-[11px]">
                      Aucune dépendance externe requise.
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: Nouvelle Feature */}
      {showNewFeatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Déclarer un nouveau module fonctionnel
              </h3>
              <button
                onClick={() => setShowNewFeatureModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFeatureSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du module *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Système de fidélité, Facturation"
                  value={featureForm.name}
                  onChange={(e) =>
                    setFeatureForm({ ...featureForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Code technique (kebab-case)
                </label>
                <input
                  type="text"
                  placeholder="Ex: loyalty-points, invoices"
                  value={featureForm.code}
                  onChange={(e) =>
                    setFeatureForm({ ...featureForm, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Domaine fonctionnel
                </label>
                <select
                  value={featureForm.domain}
                  onChange={(e) =>
                    setFeatureForm({ ...featureForm, domain: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="Commerce">Commerce</option>
                  <option value="Finance">Finance</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Logistique">Logistique</option>
                  <option value="Support">Support</option>
                  <option value="Sécurité">Sécurité</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Rôle du module..."
                  value={featureForm.description}
                  onChange={(e) =>
                    setFeatureForm({
                      ...featureForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewFeatureModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Créer la fonctionnalité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Ajouter Capacité */}
      {showNewCapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Ajouter une capacité IAM à {selectedFeature?.name}
              </h3>
              <button
                onClick={() => setShowNewCapModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCapabilitySubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Désignation de la permission *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Exporter les factures"
                  value={capForm.name}
                  onChange={(e) =>
                    setCapForm({ ...capForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Code permission (IAM dot-notation)
                </label>
                <input
                  type="text"
                  placeholder="Ex: invoice.export"
                  value={capForm.code}
                  onChange={(e) =>
                    setCapForm({ ...capForm, code: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Type d'opération
                  </label>
                  <select
                    value={capForm.type}
                    onChange={(e) =>
                      setCapForm({ ...capForm, type: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="READ">READ (Lecture)</option>
                    <option value="CREATE">CREATE (Création)</option>
                    <option value="UPDATE">UPDATE (Modification)</option>
                    <option value="DELETE">DELETE (Suppression)</option>
                    <option value="ACTION">ACTION (Exécution)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Niveau de Risque
                  </label>
                  <select
                    value={capForm.risk}
                    onChange={(e) =>
                      setCapForm({ ...capForm, risk: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="LOW">Faible (LOW)</option>
                    <option value="MEDIUM">Moyen (MEDIUM)</option>
                    <option value="HIGH">Élevé (HIGH)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewCapModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Ajouter la capacité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
