"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { History, Loader2, RotateCcw } from "lucide-react";
import { api, getCurrentUserRole, hasClientPermission, PERMISSIONS } from "@/lib/api-client";
import { ActivityTab } from "@/components/workspace/ActivityTab";
import { RollbackModal } from "@/components/modals/RollbackModal";

function HistoriqueInner() {
  const searchParams = useSearchParams();
  const appParam = searchParams.get("app");
  const role = getCurrentUserRole();

  const [apps, setApps] = useState([]);
  const [appId, setAppId] = useState(appParam || "");
  const [app, setApp] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRollback, setShowRollback] = useState(false);

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
      const [a, v] = await Promise.all([api.getApplication(appId), api.listVersions(appId)]);
      if (a.success) setApp(a.data);
      if (v.success) setVersions(v.data || []);
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

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Historique & Rollback</h1>
          <p className="text-sm text-slate-500 mt-1">
            Journal d'audit complet (trace_id inclus) et restauration contrôlée des versions publiées.
          </p>
        </div>
        <div className="flex items-end gap-2 w-full sm:w-auto">
          <div className="flex-1 sm:w-64">
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
          {hasClientPermission(PERMISSIONS.ROLLBACK_VERSION) && (
            <button
              onClick={() => setShowRollback(true)}
              disabled={!app || versions.length < 2}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-xs font-bold"
              title="Restaurer une version précédemment publiée"
            >
              <RotateCcw className="w-4 h-4" /> Restaurer une version
            </button>
          )}
        </div>
      </div>

      {loading || !app ? (
        <div className="py-24 flex justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <History className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-relaxed">
              Le rollback ne supprime aucune version ni aucun événement : il crée une nouvelle opération de type{" "}
              <span className="font-bold">ROLLBACK</span> consignée dans l'audit, et la version cible redevient active
              immédiatement (Specs Section 18).
            </p>
          </div>

          <ActivityTab applicationId={app.id} />
        </>
      )}

      {app && (
        <RollbackModal
          application={app}
          versions={versions}
          isOpen={showRollback}
          onClose={() => setShowRollback(false)}
          onRollbackComplete={refresh}
        />
      )}
    </div>
  );
}

export default function HistoriquePage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>}>
      <HistoriqueInner />
    </Suspense>
  );
}
