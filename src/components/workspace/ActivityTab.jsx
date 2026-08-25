"use client";

import React, { useState, useEffect } from "react";
import { Activity, Filter, Copy, Check, User, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { api } from "@/lib/api-client";
export function ActivityTab({
  applicationId
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventType, setSelectedEventType] = useState("");
  const [copiedTraceId, setCopiedTraceId] = useState(null);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.getApplicationActivity(applicationId, {
        eventType: selectedEventType || undefined,
        limit: 50
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
    fetchActivities();
  }, [applicationId, selectedEventType]);
  const copyTrace = traceId => {
    navigator.clipboard.writeText(traceId);
    setCopiedTraceId(traceId);
    setTimeout(() => setCopiedTraceId(null), 2000);
  };
  const eventTypeLabels = {
    "business.application.created": {
      label: "Création",
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
      label: "Publication",
      color: "bg-emerald-100 text-emerald-800"
    },
    "business.application.rollback": {
      label: "Rollback",
      color: "bg-rose-100 text-rose-800"
    },
    "business.application.cloned": {
      label: "Clonage",
      color: "bg-violet-100 text-violet-800"
    },
    "business.application.archived": {
      label: "Archivage",
      color: "bg-gray-100 text-gray-800"
    }
  };
  return <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Journal d'Audit & Traçabilité (Specs Section 6, 27 & 47)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Historique complet des actions, mutations, publications et restaurations avec trace ID.
          </p>
        </div>

        {/* Filter select */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select value={selectedEventType} onChange={e => setSelectedEventType(e.target.value)} className="h-10 px-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tous les événements</option>
            <option value="business.application.published">Publications</option>
            <option value="business.application.rollback">Rollbacks</option>
            <option value="business.application.version.created">Créations de version</option>
            <option value="business.application.status.changed">Transitions statut</option>
            <option value="business.application.cloned">Clonages</option>
            <option value="business.application.updated">Modifications</option>
            <option value="business.application.archived">Archivages</option>
          </select>
        </div>
      </div>

      {/* Audit Events List */}
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {activities.length === 0 ? <div className="py-12 text-center text-xs text-slate-400">
              Aucun événement d'audit enregistré pour ce filtre.
            </div> : activities.map(event => {
          const meta = eventTypeLabels[event.eventType] || {
            label: event.eventType,
            color: "bg-slate-100 text-slate-700"
          };
          const isExpanded = expandedEventId === event.id;
          return <div key={event.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <button onClick={() => setExpandedEventId(isExpanded ? null : event.id)} className="mt-0.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${meta.color}`}>
                            {meta.label}
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-800">
                            {event.action}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${event.result === "SUCCESS" ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"}`}>
                            {event.result}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {event.actorId}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {new Date(event.createdAt).toLocaleString("fr-FR")}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Trace ID Tool */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                        {event.traceId}
                      </span>
                      <button onClick={() => copyTrace(event.traceId)} className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors" title="Copier le trace ID">
                        {copiedTraceId === event.traceId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] font-mono">
                      {event.before && <div className="p-3 rounded-2xl bg-slate-900 text-slate-300 overflow-x-auto">
                          <p className="text-amber-400 font-bold mb-1">// État Avant (Before)</p>
                          <pre>{JSON.stringify(event.before, null, 2)}</pre>
                        </div>}
                      {event.after && <div className="p-3 rounded-2xl bg-slate-900 text-slate-300 overflow-x-auto">
                          <p className="text-emerald-400 font-bold mb-1">// État Après (After)</p>
                          <pre>{JSON.stringify(event.after, null, 2)}</pre>
                        </div>}
                      {event.metadata && Object.keys(event.metadata).length > 0 && <div className="p-3 rounded-2xl bg-slate-900 text-slate-300 overflow-x-auto md:col-span-2">
                          <p className="text-indigo-400 font-bold mb-1">// Métadonnées Contexte</p>
                          <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                        </div>}
                    </div>}
                </div>;
        })}
        </div>
      </div>
    </div>;
}