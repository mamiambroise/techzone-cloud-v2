"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { api } from "@/lib/api-client";
import { VersionsTab } from "@/components/workspace/VersionsTab";

function VersionsInner() {
  const searchParams = useSearchParams();
  const appParam = searchParams.get("app");

  const [apps, setApps] = useState([]);
  const [appId, setAppId] = useState(appParam || "");
  const [app, setApp] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-5 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Versions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cycle complet de versioning : création, comparaison, validation, publication et rollback.
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
                {a.name} ({a.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || !app ? (
        <div className="py-24 flex items-center justify-center">
          <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
        </div>
      ) : (
        <VersionsTab application={app} versions={versions} onRefresh={refresh} />
      )}
    </div>
  );
}

export default function VersionsPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>}>
      <VersionsInner />
    </Suspense>
  );
}
