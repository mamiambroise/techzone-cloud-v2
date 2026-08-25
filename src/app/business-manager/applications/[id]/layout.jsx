"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api-client";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { WorkspaceTabs } from "@/components/workspace/WorkspaceTabs";
export const WorkspaceContext = React.createContext({
  application: null,
  versions: [],
  activities: [],
  loading: true,
  refresh: () => {}
});
export default function ApplicationWorkspaceLayout({
  children,
  params
}) {
  const {
    id
  } = use(params);
  const router = useRouter();
  const [application, setApplication] = useState(null);
  const [versions, setVersions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadWorkspaceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [appRes, verRes, actRes] = await Promise.all([api.getApplication(id), api.listVersions(id), api.getApplicationActivity(id, {
        limit: 10
      })]);
      if (!appRes.success || !appRes.data) {
        setError(appRes.error?.message || "Application introuvable.");
        setLoading(false);
        return;
      }
      setApplication(appRes.data);
      if (verRes.success && verRes.data) setVersions(verRes.data);
      if (actRes.success && actRes.data) setActivities(actRes.data);
    } catch (err) {
      setError(err.message || "Erreur de chargement du Workspace.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadWorkspaceData();
  }, [id]);
  if (loading && !application) {
    return <div className="py-24 flex flex-col items-center justify-center text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-xs font-semibold text-slate-500">Chargement de l'Espace de Travail (Workspace)...</p>
      </div>;
  }
  if (error || !application) {
    return <div className="py-16 text-center max-w-md mx-auto p-8 rounded-3xl bg-white border border-red-200 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Application Introuvable</h2>
          <p className="text-xs text-slate-500 mt-1">{error || "Cette application n'existe pas ou a été supprimée."}</p>
        </div>
        <Link href="/business-manager/applications" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à la liste des applications</span>
        </Link>
      </div>;
  }
  return <WorkspaceContext.Provider value={{
    application,
    versions,
    activities,
    loading,
    refresh: loadWorkspaceData
  }}>
      <div className="space-y-6">
        <WorkspaceHeader application={application} onRefresh={loadWorkspaceData} onOpenPublish={() => {
        router.push(`/business-manager/applications/${application.id}/versions`);
      }} />

        <WorkspaceTabs applicationId={application.id} />

        <div>{children}</div>
      </div>
    </WorkspaceContext.Provider>;
}