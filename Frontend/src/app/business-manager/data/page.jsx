"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Database, Loader2 } from "lucide-react";
import { api, dm } from "@/lib/api-client";
import { DataWorkspace } from "@/components/datamodel/DataWorkspace";
import { StatusBadge } from "@/components/ui/StatusBadge";

function DataPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const appId = searchParams.get("app") || "";
  const versionId = searchParams.get("version") || "";
  const tab = searchParams.get("tab") || "overview";

  const [apps, setApps] = useState([]);
  const [versions, setVersions] = useState([]);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listApplications({ limit: 50 }).then((res) => {
      if (res.success && res.data) {
        setApps(res.data);
        if (!appId && res.data.length > 0) {
          router.replace(`/business-manager/data?app=${res.data[0].id}`);
        }
      }
      setLoading(false);
    });
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (!appId) return;
    setLoading(true);
    Promise.all([api.getApplication(appId), api.listVersions(appId)]).then(([a, v]) => {
      if (a.success) setApp(a.data);
      if (v.success) {
        const list = v.data || [];
        setVersions(list);
        if (!versionId && list.length > 0) {
          const draft = list.find((x) => x.status === "DRAFT") || list[0];
          router.replace(`/business-manager/data?app=${appId}&version=${draft.id}&tab=${tab}`);
        }
      }
      setLoading(false);
    });
    // eslint-disable-next-line
  }, [appId]);

  const navigate = (patch) => {
    const q = new URLSearchParams(searchParams.toString());
    Object.entries(patch).forEach(([k, v]) => q.set(k, v));
    router.push(`/business-manager/data?${q.toString()}`);
  };

  return (
    <div className="space-y-5 max-w-[1400px] mx-auto">
      {/* Breadcrumb + heading */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400">
        <Link href="/business-manager" className="hover:text-blue-600 font-semibold">Business Manager</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-bold text-slate-700">P0.2 — Data Model Manager</span>
      </nav>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#1E4FC2] flex items-center gap-2.5">
            <Database className="w-6 h-6" /> Data Model Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Définissez visuellement Entities, Fields, Relations, Constraints, Validations et Formulas — rattachés à une Application Version.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Application</label>
            <select
              value={appId}
              onChange={(e) => router.push(`/business-manager/data?app=${e.target.value}`)}
              className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-700 min-w-[220px]"
            >
              {apps.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">Application Version</label>
            <select
              value={versionId}
              onChange={(e) => navigate({ version: e.target.value })}
              className="h-10 px-3 rounded-lg bg-white border border-slate-200 text-xs font-bold font-mono text-slate-700 min-w-[180px]"
            >
              {versions.map((v) => <option key={v.id} value={v.id}>v{v.versionNumber} — {v.status}</option>)}
            </select>
          </div>
          {app && <StatusBadge status={app.status} size="md" />}
        </div>
      </div>

      {loading || !app || !versionId ? (
        <div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>
      ) : (
        <DataWorkspace appId={appId} versionId={versionId} tab={tab} app={{ ...app, publishedVersionNumber: app.publishedVersionNumber, currentVersionNumber: app.currentVersionNumber }} versions={versions} navigate={navigate} />
      )}
    </div>
  );
}

export default function DataPage() {
  return (
    <Suspense fallback={<div className="py-24 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-blue-600" /></div>}>
      <DataPageInner />
    </Suspense>
  );
}
