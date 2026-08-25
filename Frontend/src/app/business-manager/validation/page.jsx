"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Loader2,
  BadgeCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Rocket,
  ShieldCheck,
} from "lucide-react";
import { api, getCurrentUserRole } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PublishModal } from "@/components/modals/PublishModal";

const CHECK_ICONS = {
  PASS: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  WARNING: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  FAIL: <XCircle className="w-5 h-5 text-red-500" />,
};

function ValidationInner() {
  const searchParams = useSearchParams();
  const appParam = searchParams.get("app");
  const role = getCurrentUserRole();

  const [apps, setApps] = useState([]);
  const [appId, setAppId] = useState(appParam || "");
  const [app, setApp] = useState(null);
  const [versions, setVersions] = useState([]);
  const [versionId, setVersionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState(null);
  const [showPublish, setShowPublish] = useState(false);

  useEffect(() => {
    if (appParam) setAppId(appParam);
  }, [appParam]);

  useEffect(() => {
    api.listApplications({ limit: 50 }).then((res) => {
      if (res.success && res.data) {
        setApps(res.data);
        if (!appId && res.data.length > 0) setAppId(res.data[0].id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!appId) return;
    setLoading(true);
    setResult(null);
    Promise.all([api.getApplication(appId), api.listVersions(appId)]).then(([a, v]) => {
      if (a.success) setApp(a.data);
      if (v.success) {
        const list = v.data || [];
        setVersions(list);
        const draft = list.find((x) => x.status === "DRAFT") || list[0];
        setVersionId(draft?.id || "");
      }
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const runValidation = async () => {
    if (!appId || !versionId) return;
    setValidating(true);
    try {
      const res = await api.validateVersion(appId, versionId);
      if (res.success) setResult(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setValidating(false);
    }
  };

  const selectedVersion = versions.find((v) => v.id === versionId) || null;

  return (
    <div className="space-y-5 max-w-[1100px] mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Validation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Contrôles de pré-publication exécutés côté backend (le frontend ne recalcule aucune règle).
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Application</label>
          <select
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {apps.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Version cible</label>
          <select
            value={versionId}
            onChange={(e) => {
              setVersionId(e.target.value);
              setResult(null);
            }}
            className="w-full h-10 px-3 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber} — {v.status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={runValidation}
            disabled={validating || !versionId || role === "VIEWER"}
            className="flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold"
          >
            {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
            Lancer la validation
          </button>
          <button
            onClick={runValidation}
            className="p-2.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            title="Re-vérifier"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : result ? (
        <div className="space-y-4">
          <div
            className={`p-5 rounded-xl border flex items-center justify-between ${
              result.canPublish ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg text-white flex items-center justify-center ${result.canPublish ? "bg-green-500" : "bg-red-500"}`}>
                {result.canPublish ? <ShieldCheck className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className={`text-sm font-black uppercase tracking-wide ${result.canPublish ? "text-green-800" : "text-red-800"}`}>
                  {result.canPublish ? "Prêt pour publication" : "Validation échouée"}
                </p>
                <p className={`text-xs ${result.canPublish ? "text-green-700" : "text-red-700"}`}>
                  Version v{selectedVersion?.versionNumber} — {result.summary.passed} PASS • {result.summary.warnings} WARNING • {result.summary.failed} FAIL
                </p>
              </div>
            </div>
            {result.canPublish && role !== "VIEWER" && (
              <button
                onClick={() => setShowPublish(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold"
              >
                <Rocket className="w-4 h-4" /> Publier maintenant
              </button>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
            {result.checks.map((c) => (
              <div key={c.code} className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {CHECK_ICONS[c.status]}
                  <div>
                    <p className="text-sm font-bold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{c.message}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">{c.code}</p>
                  </div>
                </div>
                <StatusBadge status={c.status === "PASS" ? "ACTIVE" : c.status === "WARNING" ? "READY" : "ERROR"} size="sm" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center bg-white border border-slate-200 rounded-xl space-y-2">
          <BadgeCheck className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-600">Aucune validation exécutée</p>
          <p className="text-xs text-slate-400">Sélectionnez une version puis lancez la validation backend.</p>
        </div>
      )}

      {app && selectedVersion && (
        <PublishModal
          application={app}
          version={selectedVersion}
          isOpen={showPublish}
          onClose={() => setShowPublish(false)}
          onPublished={() => {
            setShowPublish(false);
            setResult(null);
          }}
        />
      )}
    </div>
  );
}

export default function ValidationPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>}>
      <ValidationInner />
    </Suspense>
  );
}
