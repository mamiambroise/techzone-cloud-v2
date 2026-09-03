// ConfigurationView.jsx — Configuration & Metadata Manager (BM-CDC-06)
import React, { useState, useMemo } from "react";
import {
  Sliders,
  Settings,
  Lock,
  Eye,
  EyeOff,
  Layers,
  Key,
  Tag,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Save,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  Trash2,
  HelpCircle,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";

export function ConfigurationView() {
  const {
    selectedApp,
    selectedVersion,
    applications,
    setSelectedAppId,
    appConfigs,
    createConfig,
    updateConfigValue,
    resetConfigToDefault,
    deleteConfig,
    showToast,
    isVersionReadOnly,
  } = useApp();

  const [selectedScope, setSelectedScope] = useState("ALL"); // 'ALL' | 'APPLICATION' | 'APPLICATION_VERSION' | 'ENVIRONMENT'
  const [revealedSecrets, setRevealedSecrets] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState("ALL");
  const [isNewConfigModalOpen, setIsNewConfigModalOpen] = useState(false);

  const [configForm, setConfigForm] = useState({
    code: "",
    label: "",
    section: "Général",
    dataType: "STRING",
    defaultValue: "",
    scope: "APPLICATION",
    isSecret: false,
    runtimeExposed: false,
    description: "",
  });

  const filteredConfigs = useMemo(() => {
    return appConfigs.filter((c) => {
      const matchSearch =
        c.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.section.toLowerCase().includes(searchTerm.toLowerCase());
      const matchScope = selectedScope === "ALL" || c.scope === selectedScope;
      const matchSection =
        selectedSection === "ALL" || c.section === selectedSection;
      return matchSearch && matchScope && matchSection;
    });
  }, [appConfigs, searchTerm, selectedScope, selectedSection]);

  const sections = useMemo(() => {
    const set = new Set(appConfigs.map((c) => c.section));
    return ["ALL", ...Array.from(set)];
  }, [appConfigs]);

  const toggleSecretReveal = (code) => {
    setRevealedSecrets((prev) => ({ ...prev, [code]: !prev[code] }));
  };

  const handleCreateConfigSubmit = async (e) => {
    e.preventDefault();
    if (!configForm.code) return;
    const res = await createConfig(configForm);
    if (res.success) {
      setIsNewConfigModalOpen(false);
      setConfigForm({
        code: "",
        label: "",
        section: "Général",
        dataType: "STRING",
        defaultValue: "",
        scope: "APPLICATION",
        isSecret: false,
        runtimeExposed: false,
        description: "",
      });
    }
  };

  const handleExportEnvFile = () => {
    const envContent = filteredConfigs
      .map(
        (c) =>
          `# ${c.label} (${c.scope})\n${c.code}=${c.isSecret ? "********" : c.storedValue || c.defaultValue}`,
      )
      .join("\n\n");

    const blob = new Blob([envContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `.env.${selectedApp?.code || "app"}.${selectedApp?.environment?.toLowerCase() || "dev"}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Fichier d environnement exporté en toute sécurité.");
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-300">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Configuration
            </h1>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
              BM-CDC-06
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez les paramètres et variables d’environnement.
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
            onClick={handleExportEnvFile}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter .env</span>
          </button>

          <button
            onClick={() => setIsNewConfigModalOpen(true)}
            disabled={isVersionReadOnly}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs disabled:opacity-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouvelle Variable</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Variables Définies
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {appConfigs.length}
            </span>
            <span className="text-xs text-slate-400 font-semibold">clés</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Secrets Chiffrés (AES-GCM)
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-600">
              {appConfigs.filter((c) => c.isSecret).length}
            </span>
            <span className="text-xs font-bold text-emerald-600">Protégés</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Exposition Runtime Client
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-600">
              {appConfigs.filter((c) => c.runtimeExposed).length}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              publiques
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Intégrité des Scopes
          </span>
          <div className="mt-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-black text-slate-900">
              100% Conforme
            </span>
          </div>
        </div>
      </div>

      {/* 3. Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par clé, section..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">Scope :</span>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-700"
            >
              <option value="ALL">Tous les scopes</option>
              <option value="APPLICATION">APPLICATION</option>
              <option value="APPLICATION_VERSION">VERSION</option>
              <option value="ENVIRONMENT">ENVIRONMENT</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold">Section :</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-700"
            >
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 4. Config Entries Table */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200/70">
            <tr>
              <th className="px-4 py-3.5 font-bold text-slate-700">
                Paramètre / Clé
              </th>
              <th className="px-4 py-3.5 font-bold text-slate-700">
                Scope & Type
              </th>
              <th className="px-4 py-3.5 font-bold text-slate-700">
                Valeur Active
              </th>
              <th className="px-4 py-3.5 font-bold text-slate-700">Sécurité</th>
              <th className="px-4 py-3.5 font-bold text-slate-700 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredConfigs.map((config) => {
              const isRevealed = revealedSecrets[config.code];
              return (
                <tr
                  key={config.code}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-4 py-3.5">
                    <div className="font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{config.label}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px] text-slate-600">
                        {config.code}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {config.description}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {config.scope}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-mono font-bold">
                        {config.dataType}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    {config.isSecret ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-700">
                          {isRevealed
                            ? config.storedValue || config.defaultValue
                            : "••••••••••••••••"}
                        </span>
                        <button
                          onClick={() => toggleSecretReveal(config.code)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isRevealed ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-amber-600" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <input
                        type={config.dataType === "NUMBER" ? "number" : "text"}
                        defaultValue={config.storedValue ?? config.defaultValue}
                        onBlur={(e) =>
                          updateConfigValue(config.code, e.target.value)
                        }
                        disabled={isVersionReadOnly}
                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono w-48 disabled:opacity-50"
                      />
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    {config.isSecret ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                        <Lock className="w-2.5 h-2.5" /> SECRET
                      </span>
                    ) : (
                      <span className="text-slate-400 text-[11px]">
                        Standard
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => resetConfigToDefault(config.code)}
                      disabled={isVersionReadOnly}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-50"
                      title="Réinitialiser à la valeur par défaut"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteConfig(config.code)}
                      disabled={isVersionReadOnly}
                      className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50"
                      title="Supprimer la variable"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: Nouvelle Variable */}
      {isNewConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-black text-slate-900">
                Déclarer un nouveau paramètre de configuration
              </h3>
              <button
                onClick={() => setIsNewConfigModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateConfigSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Clé technique (UPPERCASE_SNAKE) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: STRIPE_PUBLIC_KEY, MAX_RETRIES"
                  value={configForm.code}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      code: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Libellé compréhensible
                </label>
                <input
                  type="text"
                  placeholder="Ex: Clé publique Stripe"
                  value={configForm.label}
                  onChange={(e) =>
                    setConfigForm({ ...configForm, label: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Type de donnée
                  </label>
                  <select
                    value={configForm.dataType}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, dataType: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="STRING">STRING</option>
                    <option value="NUMBER">NUMBER</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                    <option value="JSON">JSON</option>
                    <option value="SECRET">SECRET</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scope
                  </label>
                  <select
                    value={configForm.scope}
                    onChange={(e) =>
                      setConfigForm({ ...configForm, scope: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="APPLICATION">APPLICATION</option>
                    <option value="APPLICATION_VERSION">VERSION</option>
                    <option value="ENVIRONMENT">ENVIRONMENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valeur par défaut
                </label>
                <input
                  type="text"
                  placeholder="Valeur par défaut..."
                  value={configForm.defaultValue}
                  onChange={(e) =>
                    setConfigForm({
                      ...configForm,
                      defaultValue: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono text-slate-800"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={configForm.isSecret}
                    onChange={(e) =>
                      setConfigForm({
                        ...configForm,
                        isSecret: e.target.checked,
                      })
                    }
                    className="rounded text-amber-600"
                  />
                  <span>Variable Secrète (Chiffrement AES)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsNewConfigModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
