import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Shield,
  BarChart3,
  FileText,
  AlertTriangle,
  Search,
  ExternalLink,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { iamObservabilityService } from '../../../services/apiClient.js';
import {
  obsCockpitMock,
  obsMonitoringPageMock,
  obsSecurityEventsPageMock,
  obsAlertInstances,
  obsAuditLogs,
} from './mockData.js';
import { ModernSpinner } from '../../../components/Loaders.jsx';
import { useToast } from '../../../hooks/useToast.js';

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</span>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {subtitle && <span className="text-xs text-slate-500">{subtitle}</span>}
        </div>
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color: color }}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const cfg = {
    CRITICAL: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    HIGH: { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
    MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    LOW: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
    INFO: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  };
  const c = cfg[severity] || cfg.LOW;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {severity}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    HEALTHY: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
    DEGRADED: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
    UNHEALTHY: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
    WARNING: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
    UNKNOWN: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  };
  const c = cfg[status] || cfg.UNKNOWN;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

export default function ObservabilityOverview() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [services, setServices] = useState([]);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await iamObservabilityService.monitoring();
      const data = response.data;
      setServices(Array.isArray(data?.services) ? data.services : []);
      setOverview(null);
    } catch {
      {
        toast.error('Erreur lors du chargement de l\'observabilité.');
        setServices([]);
        setOverview(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <ModernSpinner />
      </div>
    );
  }

  if (!overview) return <div role="status" className="p-6">Les indicateurs de synthèse ne sont pas disponibles via une source de télémétrie réelle.</div>;

  return (
    <div className="p-6">
      <nav className="text-xs text-slate-500 mb-4">
        <span>Observability & Security</span> <span className="mx-1">/</span>
        <span className="text-slate-900 font-medium">Observability</span>
      </nav>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Observability</h1>
          <button onClick={loadOverview} title="Actualiser" className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <Activity className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-1">Vue d'ensemble de la santé, des événements de sécurité et des alertes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <StatCard icon={TrendingUp} label="Requêtes (24h)" value={overview.requests24h.toLocaleString('fr-FR')} color="#2563eb" subtitle={`${overview.errorRate24h}% d'erreurs`} />
        <StatCard icon={BarChart3} label="Latence moyenne" value={`${overview.avgLatency} ms`} color="#7c3aed" subtitle={`Dispo ${services.filter((s) => s.status === 'HEALTHY').length}/${services.length}`} />
        <StatCard icon={Shield} label="Événements sécurité ouverts" value={overview.securityEventsOpen} color="#ef4444" subtitle="Nécessitent attention" />
        <StatCard icon={AlertTriangle} label="Alertes critiques" value={overview.criticalAlerts} color="#f97316" subtitle="À traiter" />
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Services monitorés</h2>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Service</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Composant</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Statut</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Latence (ms)</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Disponibilité</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Taux d'erreur</th>
                <th className="text-left px-4 py-3 font-medium text-slate-700">Requêtes</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.service} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{service.service}</td>
                  <td className="px-4 py-3 text-slate-600">{service.component}</td>
                  <td className="px-4 py-3"><StatusBadge status={service.status} /></td>
                  <td className="px-4 py-3 text-slate-600">{service.latency}</td>
                  <td className="px-4 py-3 text-slate-600">{service.availability}%</td>
                  <td className="px-4 py-3 text-slate-600">{service.errorRate}%</td>
                  <td className="px-4 py-3 text-slate-600">{service.requestCount.toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Événements de sécurité récents</h2>
          <div className="space-y-3">
            {obsSecurityEventsPageMock.events.slice(0, 5).map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                <SeverityBadge severity={event.severity} />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 text-sm">{event.eventType}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{event.detailsSafe}</div>
                </div>
                <span className="text-xs text-slate-400">{new Date(event.timestamp).toLocaleString('fr-FR')}</span>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <a href="/iam/observability/security-events" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              Voir tous les événements <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Alertes actives</h2>
          <div className="space-y-3">
            {obsAlertInstances.filter((a) => a.status === 'OPEN' || a.status === 'ACKNOWLEDGED').map((alert) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                <SeverityBadge severity={alert.severity} />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 text-sm">{alert.code}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{alert.scope}</div>
                </div>
                <StatusBadge status={alert.status} />
              </div>
            ))}
            {obsAlertInstances.filter((a) => a.status === 'OPEN' || a.status === 'ACKNOWLEDGED').length === 0 && (
              <div className="text-center py-6 text-slate-500"><CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-300" />Aucune alerte active</div>
            )}
          </div>
          <div className="mt-4">
            <a href="/iam/observability/alerts" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
              Voir le gestionnaire d'alertes <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
