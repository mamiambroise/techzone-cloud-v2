"use client";

import React, { useState, useEffect } from "react";
import { Activity, Filter, Copy, Check, User, Clock, ChevronDown, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { api } from "@/lib/api-client";
export default function GlobalActivityPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState("");
  const [copiedTraceId, setCopiedTraceId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const loadActivities = async () => {
    setLoading(true);
    try {
      const res = await api.getGlobalActivity({
        eventType: eventType || undefined,
        limit: 100
      });
      if (res.success && res.data) {
        setActivities(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadActivities();
  }, [eventType]);
  const copyTrace = id => {
    navigator.clipboard.writeText(id);
    setCopiedTraceId(id);
    setTimeout(() => setCopiedTraceId(null), 2000);
  };
  const eventTypeLabels = {
    "business.application.created": {
      label: "Création App",
      color: "bg-blue-100 text-blue-800"
    },
    "business.application.updated": {
      label: "Modification",
      color: "bg-slate-100 text-slate-800"
    },
    "business.application.status.changed": {
      label: "Transition Statut",
      color: "bg-amber-100 text-amber-800"
    },
    "business.application.version.created": {
      label: "Version Créée",
      color: "bg-purple-100 text-purple-800"
    },
    "business.application.version.validated": {
      label: "Version Validée",
      color: "bg-indigo-100 text-indigo-800"
    },
    "business.application.published": {
      label: "Publication Active",
      color: "bg-emerald-100 text-emerald-800"
    },
    "business.application.rollback": {
      label: "Rollback Restauration",
      color: "bg-rose-100 text-rose-800"
    },
    "business.application.cloned": {
      label: "Clonage App",
      color: "bg-violet-100 text-violet-800"
    },
    "business.application.archived": {
      label: "Archivage",
      color: "bg-gray-100 text-gray-800"
    }
  };
  return <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-indigo-600" />
            Journal d'Audit Global (Specs Section 6, 27 & 47)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Traçabilité transactionnelle de toutes les mutations, publications, rollbacks et clonages sur la plateforme.
          </p>
        </div>

        <button onClick={loadActivities} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs self-start sm:self-auto">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700">Filtrer par type d'événement :</span>
        </div>

        <select value={eventType} onChange={e => setEventType(e.target.value)} className="h-10 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tous les événements ({activities.length})</option>
          <option value="business.application.created">business.application.created</option>
          <option value="business.application.published">business.application.published</option>
          <option value="business.application.rollback">business.application.rollback</option>
          <option value="business.application.version.created">business.application.version.created</option>
          <option value="business.application.status.changed">business.application.status.changed</option>
          <option value="business.application.cloned">business.application.cloned</option>
          <option value="business.application.updated">business.application.updated</option>
          <option value="business.application.archived">business.application.archived</option>
        </select>
      </div>

      {/* Events Stream */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            <p className="text-xs font-semibold text-slate-500">Chargement des événements d'audit...</p>
          </div> : activities.length === 0 ? <div className="py-16 text-center text-xs text-slate-400">
            Aucun événement d'audit enregistré.
          </div> : <div className="divide-y divide-slate-100">
            {activities.map(act => {
          const meta = eventTypeLabels[act.eventType] || {
            label: act.eventType,
            color: "bg-slate-100 text-slate-700"
          };
          const isExpanded = expandedId === act.id;
          return <div key={act.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button onClick={() => setExpandedId(isExpanded ? null : act.id)} className="mt-0.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] px-2.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-900">
                            {act.action}
                          </span>
                          {act.applicationName && <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                              App: {act.applicationName}
                            </span>}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${act.result === "SUCCESS" ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
                            {act.result}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Acteur: {act.actorId}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(act.createdAt).toLocaleString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trace ID Tool */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                        {act.traceId}
                      </span>
                      <button onClick={() => copyTrace(act.traceId)} className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="Copier le trace ID">
                        {copiedTraceId === act.traceId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                      {act.before && <div className="p-3 rounded-2xl bg-slate-900 text-slate-300 overflow-x-auto">
                          <p className="text-amber-400 font-bold mb-1">// État Avant (Before)</p>
                          <pre>{JSON.stringify(act.before, null, 2)}</pre>
                        </div>}
                      {act.after && <div className="p-3 rounded-2xl bg-slate-900 text-slate-300 overflow-x-auto">
                          <p className="text-emerald-400 font-bold mb-1">// État Après (After)</p>
                          <pre>{JSON.stringify(act.after, null, 2)}</pre>
                        </div>}
                      {act.metadata && Object.keys(act.metadata).length > 0 && <div className="p-3 rounded-2xl bg-slate-900 text-slate-300 overflow-x-auto md:col-span-2">
                          <p className="text-indigo-400 font-bold mb-1">// Contexte Métadonnées</p>
                          <pre>{JSON.stringify(act.metadata, null, 2)}</pre>
                        </div>}
                    </div>}
                </div>;
        })}
          </div>}
      </div>
    </div>;
}