import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { api } from "../../lib/api";
import { PageHeader } from "../common/PageHeader";
import { ErrorState } from "../common/ErrorState";
import { StatusBadge } from "../common/StatusBadge";
import { TechnicalDetails } from "../common/TechnicalDetails";
import { JsonViewer } from "../common/JsonViewer";

export function E2EBenchView() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async () => {
    setLoading(true); setError("");
    try {
      const [providers, resilience, cache] = await Promise.all([
        api.getRuntimeProvidersHealth(), api.getRuntimeResilienceStatus(), api.getRuntimeCacheStatus(),
      ]);
      setResult({ providers, resilience, cache, checkedAt: new Date().toISOString() });
    } catch (reason) { setError(reason.message || "Diagnostic indisponible."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const providers = result?.providers?.providers || result?.providers || [];
  const healthy = Array.isArray(providers) && providers.length > 0 && providers.every((item) => ["UP", "HEALTHY", true].includes(item.status ?? item.healthy));
  return <div className="space-y-6 pb-12">
    <PageHeader eyebrow="Observability" title="État d’intégration" description="Lecture des signaux opérationnels réels du Pack Runtime. Les suites automatisées restent exécutées par la CI et Playwright." badge="PARTIAL" actions={<button type="button" onClick={load} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-xs font-bold text-white disabled:opacity-50"><RefreshCw className="h-4 w-4" /> {loading ? "Vérification…" : "Vérifier"}</button>} />
    {error ? <ErrorState description={error} onRetry={load} /> : result && <>
      <section className="grid gap-3 sm:grid-cols-3">
        <Metric label="Providers runtime" value={Array.isArray(providers) ? providers.length : 0} status={healthy ? "AVAILABLE" : "PARTIAL"} />
        <Metric label="Résilience" value={result.resilience?.status || "Disponible"} status="AVAILABLE" />
        <Metric label="Cache" value={result.cache?.status || "Disponible"} status="AVAILABLE" />
      </section>
      <TechnicalDetails><JsonViewer value={result} maxHeight={420} /></TechnicalDetails>
    </>}
  </div>;
}

function Metric({ label, value, status }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-slate-500">{label}</p><StatusBadge status={status} /></div><p className="mt-3 text-xl font-black text-slate-950">{String(value)}</p></article>;
}
