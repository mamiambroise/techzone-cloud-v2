// Breadcrumb.jsx — Dynamic navigational breadcrumbs
import React from 'react';
import { Home, ChevronRight, Boxes, GitBranch } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function Breadcrumb() {
  const { currentView, setCurrentView, selectedApp } = useApp();

  return (
    <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3 select-none flex-wrap">
      <button
        onClick={() => setCurrentView('overview')}
        className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Business Manager</span>
      </button>

      {currentView === 'overview' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Vue d ensemble</span>
        </>
      )}

      {currentView === 'applications' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Applications</span>
        </>
      )}

      {currentView === 'new-application' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setCurrentView('applications')}
            className="hover:text-blue-600 transition-colors"
          >
            Applications
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Nouvelle application</span>
        </>
      )}

      {currentView === 'application-detail' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button
            onClick={() => setCurrentView('applications')}
            className="hover:text-blue-600 transition-colors"
          >
            Applications
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold truncate max-w-xs">
            {selectedApp?.name || 'Détails de l application'}
          </span>
        </>
      )}

      {currentView === 'versions' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Versions</span>
        </>
      )}

      {currentView === 'data-model' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Data Model Manager (P0.2)</span>
        </>
      )}

      {currentView === 'features' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Feature & Capability Manager (P0.3)</span>
        </>
      )}

      {currentView === 'menus' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Menu Engine & Navigation (P0.4)</span>
        </>
      )}

      {currentView === 'configuration' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Configuration & Metadata (P0.5)</span>
        </>
      )}

      {currentView === 'integrations' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Integration & Runtime Bridge (P0.6)</span>
        </>
      )}

      {currentView === 'validation' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Validation & Qualité</span>
        </>
      )}

      {currentView === 'audit' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Journal d Audit & Traçabilité</span>
        </>
      )}

      {currentView === 'e2e-bench' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Banc de Test & Homologation E2E</span>
        </>
      )}

      {/* Pack Manager Breadcrumbs */}
      {currentView === 'pack-overview' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-cyan-600 font-bold">Pack Manager</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Cockpit & Supervision (PM-CDC-01)</span>
        </>
      )}

      {currentView === 'packs' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-cyan-600 font-bold">Pack Manager</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Registre & Définition des Packs (PM-CDC-02)</span>
        </>
      )}

      {currentView === 'pack-versions' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-cyan-600 font-bold">Pack Manager</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Versions & Manifests Scellés (PM-CDC-03)</span>
        </>
      )}

      {currentView === 'pack-dependencies' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-cyan-600 font-bold">Pack Manager</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Graphe & Matrice de Dépendances (PM-CDC-06)</span>
        </>
      )}

      {currentView === 'pack-rules' && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-cyan-600 font-bold">Pack Manager</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Moteur de Règles & Conditions (PM-CDC-07)</span>
        </>
      )}

      {/* Auth & IAM Breadcrumbs (IAM-CDC-01) */}
      {(currentView === 'iam-overview' || currentView === 'iam-users' || currentView === 'iam-roles' || currentView === 'iam-tenants') && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-purple-600 font-bold">Auth • IAM + Context</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-extrabold">Global Status & Gouvernance IAM (IAM-CDC-01)</span>
        </>
      )}
    </nav>
  );
}
