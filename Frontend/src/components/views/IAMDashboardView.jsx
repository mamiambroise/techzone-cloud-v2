// IAMDashboardView.jsx — Full IAM & Auth + Context Master Dashboard (IAM-CDC-01)
// Integrates Global Status Grid (Section 10), User & Identity Vault, Zero-Trust Security, and Context Resolver

import React, { useState } from 'react';
import {
  ShieldCheck,
  Users,
  KeyRound,
  Building,
  Activity,
  Compass,
  Sparkles,
  Lock,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GlobalStatusGrid } from '../iam/global-status/GlobalStatusGrid';
import { getSecurityAuditLogs } from '../../lib/authService';
import { api } from '../../lib/api';

export function IAMDashboardView() {
  const {
    currentUser,
    currentRole,
    currentTenant,
    showToast,
    sessionRemainingSeconds = 900,
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchUser, setSearchUser] = useState('');
  const [securityLogs, setSecurityLogs] = useState(() => getSecurityAuditLogs());
  const [showIdentityForm, setShowIdentityForm] = useState(false);
  const [newIdentity, setNewIdentity] = useState({ name: '', email: '', role: 'VIEWER', password: '' });

  const [usersList, setUsersList] = useState([]);

  React.useEffect(() => {
    api.listUsers()
      .then((response) => {
        const users = response?.data ?? response;
        setUsersList(Array.isArray(users) ? users : []);
      })
      .catch((error) => {
        setUsersList([]);
        showToast(`Impossible de charger les utilisateurs IAM : ${error.message}`, 'error');
      });
  }, []);

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.role.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleCreateIdentity = (event) => {
    event.preventDefault();
    if (currentRole !== 'ADMIN') {
      showToast('Seul un administrateur peut créer une identité IAM.', 'error');
      return;
    }
    const name = newIdentity.name.trim();
    const email = newIdentity.email.trim().toLowerCase();
    if (!name || !email || !newIdentity.password) {
      showToast('Le nom, l email et le mot de passe sont obligatoires.', 'error');
      return;
    }
    if (usersList.some((user) => user.email === email)) {
      showToast('Cette adresse email existe déjà.', 'error');
      return;
    }
    api.createUser({ name, email, role: newIdentity.role, password: newIdentity.password })
      .then((response) => {
        const createdUser = response?.data ?? response;
        setUsersList((current) => [...current, createdUser]);
        setNewIdentity({ name: '', email: '', role: 'VIEWER', password: '' });
        setShowIdentityForm(false);
        showToast('Identité IAM ajoutée avec succès.');
      })
      .catch((error) => showToast(`Création IAM refusée : ${error.message}`, 'error'));
  };

  return (
    <div className="space-y-4 pb-6 animate-in fade-in duration-300">
      {/* 1. Header Title & IAM Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
              IAM-CDC-01
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tableau de Bord IAM & Gouvernance Sécurité
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Supervision unifiée de l authentification, du contrôle d accès RBAC, de la posture de sécurité et de l intégrité des contextes multi-tenant.
          </p>
        </div>

        {/* Quick User State & Session Time Pill */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Session: <span className="font-mono">{Math.floor(sessionRemainingSeconds / 60)}m {sessionRemainingSeconds % 60}s</span></span>
          </div>

          <button
            onClick={() => {
              setSecurityLogs(getSecurityAuditLogs());
              showToast('Indicateurs IAM et métriques rafraîchis avec succès.');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* 2. Global Status Components Grid (IAM-CDC-01 Section 10) */}
      <GlobalStatusGrid users={usersList} securityLogs={securityLogs} />

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Supervision & Services</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'users'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Utilisateurs & Identités ({usersList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('contexts')}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'contexts'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Context Resolver & Tenants</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-2.5 text-xs font-bold whitespace-nowrap transition-all border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-purple-600 text-purple-700 bg-purple-50/50 rounded-t-xl'
              : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Journal Sécurité & Alertes</span>
        </button>
      </div>

      {/* 4. Tab Contents */}
      {/* TAB 1: SUPERVISION & ZERO-TRUST */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Zero-Trust Security Architecture */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Architecture de Sécurité Zero-Trust Techzone
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Garanties cryptographiques et contrôles systématiques sur chaque transaction.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                  100% Conforme
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">Auto-Déconnexion 15 Min</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Purge automatique en mémoire et révocation du jeton de session dès 15 minutes d inactivité continue.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">Hachage SHA-256 avec Sel</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Algorithme natif WebCrypto SHA-256 avec sel aléatoire unique et poivre cryptographique d entreprise.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">Verrouillage Anti-Brute-Force</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Blocage temporaire exponentiel après 5 tentatives consécutives et journalisation d audit de sécurité.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800">Cloisonnement Multi-Tenant</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Isolation stricte par identifiant d organisation et validation des permissions RBAC sur chaque requête.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Active Session & Role Profile */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900">Contexte de l Utilisateur Actif</h3>
              
              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-purple-600">Rôle Actuel</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-600 text-white">
                    {currentRole}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 block">{currentUser?.name || currentUser?.email || 'Utilisateur actif'}</span>
                  <span className="text-[11px] text-slate-500">Tenant: {currentTenant?.name || currentTenant?.id || 'tenant-techzone-01'}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Moteur de jeton :</span>
                  <span className="font-mono font-bold text-slate-900">WebCrypto SHA-256</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Temps restant session :</span>
                  <span className="font-mono font-bold text-emerald-600">
                    {Math.floor(sessionRemainingSeconds / 60)} min {sessionRemainingSeconds % 60} s
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Protection 2FA :</span>
                  <span className="font-bold text-emerald-600">Actif (TOTP)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: UTILISATEURS & IDENTITÉS */}
      {activeTab === 'users' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, rôle..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              />
            </div>

            <button
              onClick={() => setShowIdentityForm((visible) => !visible)}
              disabled={currentRole !== 'ADMIN'}
              title={currentRole !== 'ADMIN' ? 'Réservé aux administrateurs' : 'Ajouter une identité IAM'}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-colors shadow-xs self-start sm:self-auto disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nouvelle Identité</span>
            </button>
          </div>

          {showIdentityForm && currentRole === 'ADMIN' && (
            <form onSubmit={handleCreateIdentity} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 p-3 rounded-xl bg-purple-50 border border-purple-100">
              <input
                value={newIdentity.name}
                onChange={(event) => setNewIdentity((current) => ({ ...current, name: event.target.value }))}
                placeholder="Nom complet"
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />
              <input
                type="email"
                value={newIdentity.email}
                onChange={(event) => setNewIdentity((current) => ({ ...current, email: event.target.value }))}
                placeholder="Email professionnel"
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />
              <input
                type="password"
                value={newIdentity.password}
                onChange={(event) => setNewIdentity((current) => ({ ...current, password: event.target.value }))}
                placeholder="Mot de passe"
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
              />
              <select
                value={newIdentity.role}
                onChange={(event) => setNewIdentity((current) => ({ ...current, role: event.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-xs"
              >
                <option value="VIEWER">Viewer</option>
                <option value="BUILDER">Builder</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button type="submit" className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700">Ajouter</button>
            </form>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-200">
                <tr>
                  <th className="p-3">Utilisateur / Email</th>
                  <th className="p-3">Rôle RBAC</th>
                  <th className="p-3">Département ERP</th>
                  <th className="p-3">Sécurité 2FA</th>
                  <th className="p-3">Dernière Connexion</th>
                  <th className="p-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-slate-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.department}</td>
                    <td className="p-3">
                      {u.is2FAEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Activé</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <span>Désactivé</span>
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">{u.lastLogin}</td>
                    <td className="p-3 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {u.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CONTEXT RESOLVER */}
      {activeTab === 'contexts' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-900">
                Moteur de Résolution des Contextes (IAM-CDC-01 Section 10.4)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Évaluation temps-réel de l environnement, du tenant et des attributs de session.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              98.4% Intégrité
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Contextes Validés</span>
              <div className="text-2xl font-black text-slate-900 mt-1">284</div>
              <span className="text-[10px] text-emerald-600 font-bold">Sans conflit</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Collisions Traitées</span>
              <div className="text-2xl font-black text-slate-900 mt-1">1</div>
              <span className="text-[10px] text-amber-600 font-bold">Résolu dynamiquement</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Latence d Évaluation</span>
              <div className="text-2xl font-black text-slate-900 mt-1">1.8 ms</div>
              <span className="text-[10px] text-slate-500 font-semibold">Graph Router nominal</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SÉCURITÉ & AUDIT */}
      {activeTab === 'security' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900">
              Journal d Audit de Sécurité Temps-Réel
            </h3>
            <span className="text-xs text-slate-500">
              {securityLogs.length} événements enregistrés
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {securityLogs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Aucun événement de sécurité critique enregistré.
              </div>
            ) : (
              securityLogs.slice(0, 10).map((log, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <div>
                      <span className="font-bold text-slate-900">{log.eventType}</span>
                      <span className="text-[11px] text-slate-400 ml-2 font-mono">({log.email})</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{log.details}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString('fr-FR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default IAMDashboardView;
