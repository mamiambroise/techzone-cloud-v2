import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Play, RefreshCw } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../lib/api";
import { PageHeader } from "../common/PageHeader";
import { EmptyState } from "../common/EmptyState";
import { ErrorState } from "../common/ErrorState";
import { ApiMissingState } from "../common/ApiMissingState";
import { ValidationSummary } from "../common/ValidationSummary";
import { StatusBadge } from "../common/StatusBadge";
import { TechnicalDetails } from "../common/TechnicalDetails";
import { JsonViewer } from "../common/JsonViewer";
import { formatDateTime } from "../../lib/formatDateTime";

export function ValidationView() {
  const { applications, versions, selectedAppId, setSelectedAppId, showToast } = useApp();
  const [campaigns, setCampaigns] = useState([]);
  const [gate, setGate] = useState(null);
  const [report, setReport] = useState(null);
  const [tab, setTab] = useState("campaigns");
  const [mode, setMode] = useState("STANDARD");
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const selectedApp = useMemo(() => applications.find((item) => item.id === selectedAppId) || applications[0], [applications, selectedAppId]);
  const selectedVersion = useMemo(() => versions.find((item) => item.applicationId === selectedApp?.id), [versions, selectedApp]);

  const load = useCallback(async () => {
    if (!selectedVersion?.id) { setCampaigns([]); setGate(null); setReport(null); return; }
    setLoading(true); setError("");
    try {
      const [campaignData, gateData] = await Promise.all([api.listQualityCampaigns(selectedVersion.id), api.getQualityGate(selectedVersion.id)]);
      const list = Array.isArray(campaignData) ? campaignData : campaignData?.items || [];
      setCampaigns(list); setGate(gateData);
      setReport(list[0]?.id ? await api.getQualityReport(list[0].id) : null);
    } catch (reason) { setError(reason.message || "Le service qualité n’est pas disponible."); }
    finally { setLoading(false); }
  }, [selectedVersion?.id]);

  useEffect(() => { load(); }, [load]);

  const run = async () => {
    if (!selectedVersion?.id) return;
    setRunning(true);
    try {
      const result = await api.runQualityCampaign(selectedVersion.id, mode);
      showToast(result.status === "PASSED" ? "Campagne validée par le backend." : "Campagne terminée avec des points à corriger.", result.status === "PASSED" ? "success" : "error");
      await load();
    } catch (reason) { showToast(reason.message, "error"); }
    finally { setRunning(false); }
  };

  const download = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `quality-report-${report.campaign?.id || "latest"}.json`; anchor.click();
    URL.revokeObjectURL(url);
  };

  const issues = report?.issues || [];
  return <div className="space-y-6 pb-12">
    <PageHeader eyebrow="Business Manager · BM-CDC-08" title="Validation & Quality" description="Exécutez les contrôles serveur, analysez les écarts et décidez si la version est publiable." badge="PARTIAL" actions={<>
      <select aria-label="Application" value={selectedApp?.id || ""} onChange={(event) => setSelectedAppId(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold">{applications.map((application) => <option key={application.id} value={application.id}>{application.name}</option>)}</select>
      <button type="button" onClick={load} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold"><RefreshCw className="h-4 w-4" /> Actualiser</button>
    </>} />
    {!selectedVersion ? <EmptyState title="Aucune version à valider" description="Créez ou sélectionnez une version persistée dans le backend." /> : error ? <ErrorState description={error} onRetry={load} /> : <>
      <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold text-slate-950">{selectedApp?.name} · v{selectedVersion.versionNumber}</p><p className="mt-1 text-xs text-slate-500">Le résultat affiché provient exclusivement des campagnes BM enregistrées.</p></div><div className="flex flex-wrap items-center gap-2"><select value={mode} onChange={(event) => setMode(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold"><option value="STANDARD">Standard</option><option value="FULL_HOMOLOGATION">Homologation complète</option><option value="SECURITY_INTEGRITY">Sécurité & intégrité</option></select><button type="button" onClick={run} disabled={running || loading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white disabled:opacity-50"><Play className="h-4 w-4" /> {running ? "Exécution…" : "Lancer la campagne"}</button></div></section>
      <ValidationSummary status={gate?.decision || "NOT_RUN"} sections={[{ label: "Décision du gate", status: gate?.decision || "NOT_RUN" }, { label: "Score", status: gate?.score === undefined ? "NOT_RUN" : `${gate.score}/100` }, { label: "Points bloquants", status: gate?.blocking ? "FAILED" : "PASSED" }]} />
      <div className="flex gap-1 border-b border-slate-200">{[["campaigns", "Campagnes"], ["issues", "Écarts"], ["rules", "Catalogue des règles"]].map(([id, label]) => <button key={id} type="button" onClick={() => setTab(id)} className={`px-4 py-3 text-xs font-bold ${tab === id ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-500"}`}>{label}</button>)}</div>
      {tab === "rules" ? <ApiMissingState description="Cette API permettra de consulter le catalogue versionné des règles qualité et leur profil d’homologation." expectedEndpoint="GET /api/v1/business-manager/quality/rules" cdc="BM-CDC-08" /> : tab === "campaigns" ? campaigns.length ? <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">{campaigns.map((campaign) => <button key={campaign.id} type="button" onClick={async () => setReport(await api.getQualityReport(campaign.id))} className="flex w-full items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 text-left last:border-0 hover:bg-slate-50"><div><p className="text-sm font-bold text-slate-900">{campaign.mode || "STANDARD"}</p><p className="mt-1 text-xs text-slate-500">{formatDateTime(campaign.createdAt)}</p></div><StatusBadge status={campaign.status} /></button>)}</section> : <EmptyState title={loading ? "Chargement…" : "Aucune campagne"} description="Lancez la première campagne pour obtenir une décision serveur." /> : issues.length ? <section className="space-y-2">{issues.map((issue) => <article key={issue.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-slate-900">{issue.message}</p><StatusBadge status={issue.severity} /></div><p className="mt-1 text-xs text-slate-500">{issue.validator} · {issue.code}</p></article>)}</section> : <EmptyState title="Aucun écart enregistré" description="La campagne sélectionnée ne contient aucun point bloquant ou avertissement." />}
      {report && tab !== "rules" && <TechnicalDetails><div className="mb-3 flex justify-end"><button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 font-bold"><Download className="h-4 w-4" /> Exporter JSON</button></div><JsonViewer value={report} maxHeight={360} /></TechnicalDetails>}
    </>}
  </div>;
}
