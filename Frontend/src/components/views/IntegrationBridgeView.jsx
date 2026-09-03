// IntegrationBridgeView.jsx — Integration, Contracts & Runtime Bridge (BM-CDC-07)
import React, { useState, useMemo } from "react";
import {
  Server,
  Network,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Activity,
  Download,
  Terminal,
  RefreshCw,
  Zap,
  Globe,
  Smartphone,
  Tablet,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  Code2,
  Copy,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export function IntegrationBridgeView() {
  const {
    selectedApp,
    selectedVersion,
    applications,
    setSelectedAppId,
    appIntegrations,
    createIntegration,
    deleteIntegration,
    testIntegration,
    generateRuntimeManifest,
    showToast,
    isVersionReadOnly,
  } = useApp();

  const [activeTab, setActiveTab] = useState("integrations"); // 'integrations' | 'manifest' | 'channels' | 'readiness'
  const [testingIntId, setTestingIntId] = useState(null);
  const [activeChannel, setActiveChannel] = useState("WEB");
  const [isNewIntegrationModalOpen, setIsNewIntegrationModalOpen] =
    useState(false);

  const [intForm, setIntForm] = useState({
    name: "",
    code: "",
    category: "ERP / Paiement",
    provider: "Stripe, SAP, SendGrid",
    protocol: "REST_JSON",
    endpoint: "https://api.example.com/v1",
  });

  const runtimeManifest = useMemo(() => {
    return generateRuntimeManifest(selectedApp?.id, selectedVersion?.id);
  }, [generateRuntimeManifest, selectedApp, selectedVersion]);

  const handleTestConnection = async (intId) => {
    setTestingIntId(intId);
    await testIntegration(intId);
    setTestingIntId(null);
  };

  const handleCreateIntegrationSubmit = async (e) => {
    e.preventDefault();
    if (!intForm.name) return;
    const res = await createIntegration(intForm);
    if (!res.success) return;
    setIsNewIntegrationModalOpen(false);
    setIntForm({
      name: "",
      code: "",
      category: "ERP / Paiement",
      provider: "Stripe, SAP, SendGrid",
      protocol: "REST_JSON",
      endpoint: "https://api.example.com/v1",
    });
  };

  const handleCopyManifest = () => {
    navigator.clipboard.writeText(JSON.stringify(runtimeManifest, null, 2));
    showToast("Manifeste de runtime (BM-CDC-07) copié dans le presse-papier.");
  };

  const handleDownloadManifest = () => {
    const blob = new Blob([JSON.stringify(runtimeManifest, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `runtime-manifest-${selectedApp?.code || "app"}-v${selectedVersion?.versionNumber || "1.0.0"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Manifeste de runtime téléchargé.");
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Contracts & Runtime Bridge
            </h1>
            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black uppercase">
              BM-CDC-07
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Générateur de manifeste de runtime déterministe, connecteurs
            externes et passerelles omnicanales.
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
            onClick={handleDownloadManifest}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger Manifeste</span>
          </button>

          <button
            onClick={() => setIsNewIntegrationModalOpen(true)}
            disabled={isVersionReadOnly}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Connecteur</span>
          </button>
        </div>
      </div>

      {/* 2. Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Connecteurs Connectés
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {appIntegrations.length}
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {appIntegrations.filter((i) => i.status === "CONNECTED").length}{" "}
              opérationnels
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Latence Moyenne
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">
              {Math.round(
                appIntegrations.reduce(
                  (acc, i) => acc + (i.latencyMs || 40),
                  0,
                ) / (appIntegrations.length || 1),
              )}
            </span>
            <span className="text-xs text-slate-400 font-semibold">ms</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Canaux Omnicanaux
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-purple-600">4</span>
            <span className="text-xs text-slate-400 font-semibold">
              Web, iOS, POS, Kiosk
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Intégrité Signature SHA-256
          </span>
          <div className="mt-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-black text-slate-900">Validée</span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("integrations")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "integrations"
              ? "border-purple-600 text-purple-700 bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Connecteurs & Adaptateurs</span>
        </button>

        <button
          onClick={() => setActiveTab("manifest")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "manifest"
              ? "border-purple-600 text-purple-700 bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Manifeste de Runtime (JSON)</span>
        </button>

        <button
          onClick={() => setActiveTab("channels")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "channels"
              ? "border-purple-600 text-purple-700 bg-purple-50/50"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Canaux Cibles Omnicanaux</span>
        </button>
      </div>

      {/* 4. Tab 1: Connecteurs */}
      {activeTab === "integrations" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appIntegrations.map((int) => {
            const isTesting = testingIntId === int.id;
            return (
              <div
                key={int.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">
                        {int.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {int.provider} • {int.protocol}
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                    {int.status}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-600 space-y-1">
                  <div className="truncate">Endpoint : {int.endpoint}</div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Dernière synchro : {int.lastSync}</span>
                    <span>Latence : {int.latencyMs} ms</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex gap-1">
                    {int.boundEntities?.map((ent) => (
                      <span
                        key={ent}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold"
                      >
                        #{ent}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestConnection(int.id)}
                      disabled={isTesting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3 h-3 ${isTesting ? "animate-spin" : ""}`}
                      />
                      <span>
                        {isTesting ? "Test en cours..." : "Tester le ping"}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteIntegration(int.id)}
                      disabled={isVersionReadOnly}
                      className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Runtime Manifest */}
      {activeTab === "manifest" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Manifeste de Runtime Scellé (BM-CDC-07)
              </h3>
              <p className="text-xs text-slate-500">
                Payload JSON contractuel prêt pour injection dans les moteurs
                frontends Techzone Cloud.
              </p>
            </div>
            <button
              onClick={handleCopyManifest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold"
            >
              <Copy className="w-3 h-3" />
              <span>Copier le JSON</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-900 text-purple-300 font-mono text-xs overflow-x-auto leading-relaxed">
            {JSON.stringify(runtimeManifest, null, 2)}
          </pre>
        </div>
      )}

      {/* Tab 3: Omnichannel Targets */}
      {activeTab === "channels" && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            {
              id: "WEB",
              name: "Web Studio (PWA)",
              icon: Globe,
              status: "Prêt",
              desc: "Rendu SSR / Hydratation React",
            },
            {
              id: "MOBILE",
              name: "App Mobile iOS & Android",
              icon: Smartphone,
              status: "Prêt",
              desc: "Pont React Native & Flutter",
            },
            {
              id: "POS",
              name: "Terminal Point de Vente",
              icon: ShoppingBag,
              status: "Prêt",
              desc: "Mode hors-ligne & Cache local",
            },
            {
              id: "KIOSK",
              name: "Borne Interactive",
              icon: Tablet,
              status: "Prêt",
              desc: "Affichage haute cadence",
            },
          ].map((channel) => {
            const Icon = channel.icon;
            return (
              <div
                key={channel.id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-extrabold text-sm text-slate-900">
                  {channel.name}
                </div>
                <p className="text-xs text-slate-500">{channel.desc}</p>
                <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  {channel.status}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Nouveau Connecteur */}
      {isNewIntegrationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Configurer un connecteur d'intégration
              </h3>
              <button
                onClick={() => setIsNewIntegrationModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateIntegrationSubmit}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Désignation du connecteur *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Passerelle de Paiement Stripe"
                  value={intForm.name}
                  onChange={(e) =>
                    setIntForm({ ...intForm, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fournisseur / Solution
                </label>
                <input
                  type="text"
                  placeholder="Ex: Stripe, SAP S/4HANA, Twilio"
                  value={intForm.provider}
                  onChange={(e) =>
                    setIntForm({ ...intForm, provider: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Protocole
                  </label>
                  <select
                    value={intForm.protocol}
                    onChange={(e) =>
                      setIntForm({ ...intForm, protocol: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="REST_JSON">REST / JSON</option>
                    <option value="GRAPHQL">GraphQL</option>
                    <option value="GRPC">gRPC</option>
                    <option value="WEBHOOK">Webhook</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <input
                    type="text"
                    value={intForm.category}
                    onChange={(e) =>
                      setIntForm({ ...intForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  URL Endpoint / Host
                </label>
                <input
                  type="text"
                  placeholder="https://api.provider.com/v1"
                  value={intForm.endpoint}
                  onChange={(e) =>
                    setIntForm({ ...intForm, endpoint: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewIntegrationModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Enregistrer Connecteur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
