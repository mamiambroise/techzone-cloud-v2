"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Rocket, Loader2, CheckCircle2, History, ArrowRight, ShieldCheck } from "lucide-react";
import { api, getCurrentUserRole, hasClientPermission, PERMISSIONS } from "@/lib/api-client";
import { StatusBadge, EnvironmentBadge } from "@/components/ui/StatusBadge";
import { PublishModal } from "@/components/modals/PublishModal";
import { ValidationModal } from "@/components/modals/ValidationModal";

function PublicationInner() {
  const searchParams = useSearchParams();
  const appParam = searchParams.get("app");
  const role = getCurrentUserRole();

  const [apps, setApps] = useState([]);
  const [appId, setAppId] = useState(appParam || "");
  const [app, setApp] = useState(null);
  const [versions, setVersions] = useState([]);
  const [publications, setPublications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPublish, setShowPublish] = useState(false);
  const [showValidate, setShowValidate] = useState(false);

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

  const refresh = async () => {
    if (!appId) return;
    setLoading(true);
    try {
      const [a, v, p] = await Promise.all([
        api.getApplication(appId),
        api.listVersions(appId),
        api.listPublications(appId),
      ]);
      if (a.success) setApp(a.data);
      if (v.success) setVersions(v.data || []);
      if (p.success) setPublications(p.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  const draft = versions.find((v) => v.status === "DRAFT" || v.status === "READY" || v.status === "TESTING") || null;
  const published = versions.find((v) => v.id === app?.publishedVersionId) || null;

  return (
    <div className="space-y-5 max-w-[1100px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Publication</h1>
          <p className="text-sm text-slate-500 mt-1">
            Déploiement transactionnel : validation préalable, une version publiée par environnement, historique conservé.
          </p>
        </div>
        <div className="w-full sm:w-72">
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
      </div>

      {loading || !app ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          {/* Current vs Target */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                Version actuellement publiée
              </p>
              {published ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-black font-mono text-slate-900">v{published.versionNumber}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Publiée le {new Date(published.publishedAt || published.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <StatusBadge status="PUBLISHED" size="md" />
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4">Aucune version en production.</p>
              )}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
                <EnvironmentBadge environment={app.environment} />
                <span>Environnement cible</span>
              </div>
            </div>

            <div className="bg-white border border-blue-200 rounded-xl p-5 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-100/60 rounded-full blur-2xl" />
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 mb-3">
                Version candidate à la publication
              </p>
              {draft ? (
                <div className="flex items-center justify-between relative">
                  <div>
                    <p className="text-3xl font-black font-mono text-slate-900">v{draft.versionNumber}</p>
                    <p className="text-xs text-slate-500 mt-1">{draft.comment || "Brouillon en préparation"}</p>
                  </div>
                  <StatusBadge status={draft.status} size="md" />
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-4 relative">Aucun brouillon disponible.</p>
              )}
              {draft && role !== "VIEWER" && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 relative">
                  <button
                    onClick={() => setShowValidate(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-400" /> Valider d'abord
                  </button>
                  <button
                    onClick={() => setShowPublish(true)}
                    disabled={!hasClientPermission(PERMISSIONS.PUBLISH_VERSION)}
                    title={!hasClientPermission(PERMISSIONS.PUBLISH_VERSION) ? "Rôle actuel non autorisé à publier (business.application.publish)" : undefined}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold"
                  >
                    <Rocket className="w-4 h-4" /> Publier
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Publications history */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-extrabold text-slate-900">Historique des publications</h2>
              <span className="text-xs text-slate-400">({publications.length})</span>
            </div>
            {publications.length === 0 ? (
              <p className="py-12 text-center text-xs text-slate-400">Aucune publication enregistrée pour cette application.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {publications.map((p) => (
                  <div key={p.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                          p.type === "ROLLBACK" ? "bg-amber-100 text-amber-600" : "bg-green-100 text-green-600"
                        }`}
                      >
                        {p.type === "ROLLBACK" ? <History className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {p.type === "ROLLBACK" ? "Rollback vers" : "Publication de"}{" "}
                          <span className="font-mono">v{p.versionNumber || "—"}</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(p.publishedAt).toLocaleString("fr-FR")} • par {p.publishedBy} • env {p.environment}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <EnvironmentBadge environment={p.environment} />
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          p.status === "SUCCESS" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {app && draft && (
        <>
          <ValidationModal
            application={app}
            version={draft}
            isOpen={showValidate}
            onClose={() => setShowValidate(false)}
            onOpenPublish={() => {
              setShowValidate(false);
              setShowPublish(true);
            }}
          />
          <PublishModal
            application={app}
            version={draft}
            isOpen={showPublish}
            onClose={() => setShowPublish(false)}
            onPublished={refresh}
          />
        </>
      )}
    </div>
  );
}

export default function PublicationPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>}>
      <PublicationInner />
    </Suspense>
  );
}
