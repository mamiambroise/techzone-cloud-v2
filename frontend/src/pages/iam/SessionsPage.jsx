import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Shield,
  Smartphone,
  Laptop,
  Search,
  RefreshCw,
  Eye,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { iamAdminService } from '../../services/apiClient.js';
import { iamSessionStatusConfig } from './mockData.js';
import { ModernSpinner } from '../../components/Loaders.jsx';
import ConfirmModal from '../../components/ui/ConfirmModal.jsx';
import { useToast } from '../../hooks/useToast.js';

const SESSION_STATUS_OPTIONS = ['ALL', 'ACTIVE', 'EXPIRED', 'REVOKED'];
const SESSION_STATUS_LABELS = { ALL: 'Tous', ACTIVE: 'Actif', EXPIRED: 'Expiré', REVOKED: 'Révoqué' };

function getDeviceIcon(device) {
  const lower = String(device || '').toLowerCase();
  if (lower.includes('iphone') || lower.includes('ipad') || lower.includes('android')) {
    return <Smartphone className="w-4 h-4 text-slate-500" />;
  }
  return <Laptop className="w-4 h-4 text-slate-500" />;
}

function StatCard({ stat }) {
  const Icon = stat.icon === 'session' ? Shield : stat.icon === 'device' ? Smartphone : stat.icon === 'alert' ? AlertTriangle : LogOut;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2">
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</span>
          <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          <span className="text-xs text-slate-500">{stat.context}</span>
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function ActionMenu({ session, onRevoke, onView }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
        title="Actions"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="block w-5 h-5">•••</span>
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg">
          <button
            type="button"
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            onClick={() => { setOpen(false); onView(session); }}
          >
            <Eye className="w-4 h-4" />
            Voir détails
          </button>
          {!session.isCurrent && session.status !== 'REVOKED' && (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => { setOpen(false); onRevoke(session); }}
            >
              <LogOut className="w-4 h-4" />
              Révoquer
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SessionDetailModal({ open, session, onClose }) {
  if (!open || !session) return null;
  const status = iamSessionStatusConfig[session.status] || iamSessionStatusConfig.ACTIVE;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Détails de la session</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500">Session ID</span>
              <p className="text-sm text-slate-900 mt-1">{session.id}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Statut</span>
              <p className="mt-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: status.bg, color: status.text }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                  {status.label}
                </span>
              </p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Utilisateur</span>
              <p className="text-sm text-slate-900 mt-1">{session.displayName || `${session.username}`}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Email</span>
              <p className="text-sm text-slate-900 mt-1">{session.email || '—'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Appareil</span>
              <p className="text-sm text-slate-900 mt-1 flex items-center gap-2">{getDeviceIcon(session.device)} {session.device}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">IP</span>
              <p className="text-sm text-slate-900 mt-1"><code className="bg-slate-100 px-2 py-1 rounded">{session.ip}</code></p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Localisation</span>
              <p className="text-sm text-slate-900 mt-1">{session.location}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Niveau d'authentification</span>
              <p className="text-sm text-slate-900 mt-1">{session.authenticationLevel || '—'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Créé le</span>
              <p className="text-sm text-slate-900 mt-1">{session.createdAt ? new Date(session.createdAt).toLocaleString('fr-FR') : '—'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Dernière activité</span>
              <p className="text-sm text-slate-900 mt-1">{session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString('fr-FR') : '—'}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Session actuelle</span>
              <p className="text-sm text-slate-900 mt-1">{session.isCurrent ? 'Oui' : 'Non'}</p>
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Fermer</button>
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [revokeAllOpen, setRevokeAllOpen] = useState(false);
  const [detailSession, setDetailSession] = useState(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { status: statusFilter !== 'ALL' ? statusFilter : undefined };
      const response = await iamAdminService.sessions(params);
      const data = response.data;
      setSessions(Array.isArray(data) ? data : (data?.sessions ?? data?.data ?? []));
    } catch {
      {
        toast.error('Erreur lors du chargement des sessions.');
        setSessions([]);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const revocableSessions = sessions.filter((s) => !s.isCurrent && s.status !== 'REVOKED');

  const filteredSessions = sessions.filter((s) => {
    const q = search.toLowerCase().trim();
    const matches = !q ||
      (s.username || '').toLowerCase().includes(q) ||
      (s.displayName || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q) ||
      (s.device || '').toLowerCase().includes(q) ||
      (s.ip || '').toLowerCase().includes(q) ||
      (s.location || '').toLowerCase().includes(q);
    const statusMatch = statusFilter === 'ALL' || s.status === statusFilter;
    return matches && statusMatch;
  });

  const handleRevoke = async (session) => {
    try {
      await iamAdminService.revokeSession(session.id, { reason: 'ADMIN_REVOKE' });
      setSessions((prev) => prev.map((s) => (s.id === session.id ? { ...s, status: 'REVOKED' } : s)));
      toast.success(`Session de ${session.displayName || session.username} révoquée.`);
    } catch (error) {
      if (error.normalized) {
        toast.error(`Erreur: ${error.normalized.message}`);
      } else {
        toast.error('Erreur lors de la révocation de la session.');
      }
    }
    setConfirmOpen(false);
    setConfirmAction(null);
  };

  const handleRevokeAll = async () => {
    try {
      await Promise.all(revocableSessions.map((s) => iamAdminService.revokeSession(s.id, { reason: 'ADMIN_REVOKE_ALL' })));
      setSessions((prev) =>
        prev.map((s) => (!s.isCurrent && s.status !== 'REVOKED' ? { ...s, status: 'REVOKED' } : s))
      );
      toast.success(`${revocableSessions.length} session(s) révoquée(s).`);
    } catch {
      {
        toast.error('Erreur lors de la révocation des sessions.');
      }
    }
    setRevokeAllOpen(false);
  };

  const handleView = (session) => {
    setDetailSession(session);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <ModernSpinner />
      </div>
    );
  }

  return (
    <div className="p-6">
      <nav className="text-xs text-slate-500 mb-4">
        <span>Auth + IAM + Context</span> <span className="mx-1">/</span>
        <span className="text-slate-900 font-medium">Sessions & Sécurité</span>
      </nav>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Sessions & Sécurité</h1>
          <button
            onClick={loadSessions}
            title="Actualiser"
            className="p-1.5 text-slate-500 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-slate-500 mt-1">Surveillez les sessions actives et révoquez les accès si nécessaire.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {[{ label: 'Sessions chargées', value: sessions.length, context: 'Réponse API courante', color: '#2563eb', icon: 'session' }, { label: 'Actives', value: sessions.filter(s => s.status === 'ACTIVE').length, context: 'Parmi les sessions chargées', color: '#16a34a', icon: 'session' }, { label: 'Révoquées', value: sessions.filter(s => s.status === 'REVOKED').length, context: 'Parmi les sessions chargées', color: '#dc2626', icon: 'alert' }].map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <div className="flex items-center gap-4 mb-5">
        <button
          type="button"
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={revocableSessions.length === 0}
          onClick={() => setRevokeAllOpen(true)}
        >
          Révoquer toutes les autres sessions
        </button>
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher une session..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
        >
          {SESSION_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{SESSION_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Appareil</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Localisation</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">IP</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Dernière activité</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Session actuelle</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Statut</th>
              <th className="text-left px-4 py-3 font-medium text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">Aucune session ne correspond aux filtres.</td>
              </tr>
            )}
            {filteredSessions.map((session) => {
              const status = iamSessionStatusConfig[session.status] || iamSessionStatusConfig.ACTIVE;
              return (
                <tr key={session.id} className={`border-b border-slate-100 ${session.isCurrent ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        {(session.firstName?.[0] || '') + (session.lastName?.[0] || '') || session.userId?.slice(-2) || '??'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{session.displayName || `Utilisateur #${session.userId}`}</div>
                        <div className="text-slate-500">{session.username || session.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(session.device)}
                      <span>{session.device}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{session.location}</td>
                  <td className="px-4 py-3"><code className="bg-slate-100 px-2 py-0.5 rounded text-xs">{session.ip}</code></td>
                  <td className="px-4 py-3 text-slate-500">{session.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3">{session.isCurrent && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Session actuelle</span>}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: status.bg, color: status.text }}>
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ActionMenu session={session} onRevoke={(s) => { setConfirmAction(s); setConfirmOpen(true); }} onView={handleView} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Révoquer la session"
        message={confirmAction ? `Voulez-vous révoquer la session de ${confirmAction.displayName || confirmAction.username} sur ${confirmAction.device} ?` : ''}
        confirmLabel="Révoquer"
        danger
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        onConfirm={() => confirmAction && handleRevoke(confirmAction)}
      />

      <ConfirmModal
        open={revokeAllOpen}
        title="Révoquer toutes les autres sessions"
        message={revocableSessions.length > 0 ? `Voulez-vous révoquer ${revocableSessions.length} session(s) autre(s) que la session actuelle ?` : ''}
        confirmLabel="Révoquer tout"
        danger
        onCancel={() => setRevokeAllOpen(false)}
        onConfirm={handleRevokeAll}
      />

      <SessionDetailModal
        open={!!detailSession}
        session={detailSession}
        onClose={() => setDetailSession(null)}
      />
    </div>
  );
}
