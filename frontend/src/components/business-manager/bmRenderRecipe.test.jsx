import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Payloads réels capturés du backend local pendant la recette (API HTTP 200).
// Si un fichier manque (backend éteint), le test est sauté proprement.
const fixtureDir = '/tmp/bm-fixtures';
function fixture(name) {
  try { return JSON.parse(readFileSync(resolve(fixtureDir, `${name}.json`), 'utf-8')); } catch { return null; }
}
const hasFixtures = fixture('dashboard') !== null;
const d = describe.skipIf(!hasFixtures);

vi.mock('../../services/apiClient.js', () => ({
  api: {
    get: vi.fn((url) => {
      const map = {
        '/business-manager/dashboard': 'dashboard',
        '/business-manager/activity': 'activity',
        '/business-manager/configurations': 'configurations',
        '/business-manager/environments': 'environments',
      };
      for (const [key, file] of Object.entries(map)) if (url === key) return Promise.resolve({ data: fixture(file) });
      if (url.endsWith('/versions')) return Promise.resolve({ data: [fixture('version')] });
      if (url.endsWith('/schema')) return Promise.resolve({ data: fixture('schema') });
      if (url.endsWith('/relations')) return Promise.resolve({ data: fixture('relations') });
      if (url.endsWith('/dependencies')) return Promise.resolve({ data: fixture('dependencies') });
      if (url.endsWith('/menus')) return Promise.resolve({ data: fixture('menus') });
      if (url.endsWith('/reports')) return Promise.resolve({ data: fixture('reports') });
      if (url.endsWith('/gate-status')) return Promise.resolve({ data: fixture('gate-status') });
      if (/\/versions\/[0-9a-f-]+$/.test(url)) return Promise.resolve({ data: fixture('version') });
      if (url === '/business-manager/applications') return Promise.resolve({ data: fixture('applications') });
      if (/\/applications\/[0-9a-f-]+$/.test(url)) return Promise.resolve({ data: fixture('applications')[0] });
      if (url.startsWith('/business-manager/features/')) return Promise.resolve({ data: fixture('features') });
      return Promise.resolve({ data: [] });
    }),
    post: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

vi.mock('../../contexts/TenantProvider.jsx', () => ({
  useTenant: () => ({ activeTenant: { id: '6d25428f-31d7-4b48-b983-34e6072404ab', name: 'Techzone Test' } }),
}));

// Les tests déclarent les imports après les mocks (hoisting vitest gère l'ordre).
const { default: BMOverview } = await import('./BMOverview.jsx');
const { BMApplicationsRoute } = await import('./BMApplicationsRoute.jsx');
const { default: BMWorkspaceRoute } = await import('./BMWorkspaceRoute.jsx');
const { Routes, Route } = await import('react-router-dom');

const VER = fixture('version');
const APP = fixture('applications')?.[0];
const MENUS = fixture('menus') || [];

// BMWorkspaceRoute lit useParams() : il faut une Route déclarée, pas un rendu direct.
function WorkspaceAt(path) {
  return (
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/business-manager/applications/:applicationId/versions/:versionId/:section" element={<BMWorkspaceRoute />} />
      </Routes>
    </MemoryRouter>
  );
}

d('Recette de rendu BM avec données réelles du backend', () => {
  it('Écran 1 — Vue d’ensemble : KPI, applications récentes, activité, santé', async () => {
    render(<MemoryRouter><BMOverview /></MemoryRouter>);
    expect(await screen.findByText('Plateforme opérationnelle')).toBeInTheDocument();
    expect(screen.getByText('Applications récentes')).toBeInTheDocument();
    expect(screen.getByText('Cycle de vie des versions')).toBeInTheDocument();
    expect(screen.getByText('Activité récente')).toBeInTheDocument();
    expect(screen.getByText('TechZone Core Platform')).toBeInTheDocument(); // donnée réelle du seed
  });

  it('Écran 2 — Applications : cards réelles, code, statut, ouvrir', async () => {
    render(<MemoryRouter><BMApplicationsRoute /></MemoryRouter>);
    expect(await screen.findByText('Payment Integration Hub')).toBeInTheDocument();
    expect(screen.getAllByText(/Ouvrir l’application/).length).toBe(2); // 2 applications réelles
  });

  it('Écran 3 — Modèles de données : entité réelle, tableau, badges', async () => {
    let caught = null;
    let container;
    try {
      const rendered = render(WorkspaceAt(`/business-manager/applications/${APP.id}/versions/${VER.id}/data-model`));
      container = rendered.container;
    } catch (error) { caught = error; }
    if (caught) console.log('RENDER_THROW:', caught.message);
    if (!(await screen.findByText('Client', {}, { timeout: 4000 }).catch(() => null))) {
      console.log('HTML_SNIPPET:', (container?.innerHTML || '(null)').slice(0, 400));
    }
    expect(await screen.findByText('Client', {}, { timeout: 4000 })).toBeInTheDocument(); // entité créée en recette
    expect(screen.getByText('Entités')).toBeInTheDocument();
  });

  it('Écran 4 — Fonctionnalités : feature réelle + dépendances (endpoint dédié)', async () => {
    render(WorkspaceAt(`/business-manager/applications/${APP.id}/versions/${VER.id}/features`));
    expect(await screen.findByText('Gestion des clients', {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('Écran 5 — Navigation : menu réel avec icône/ordre/visibilité', async () => {
    render(WorkspaceAt(`/business-manager/applications/${APP.id}/versions/${VER.id}/navigation`));
    expect(await screen.findByText('Menu principal', {}, { timeout: 4000 })).toBeInTheDocument();
    // Parcours réel : l'onglet par défaut liste les menus ; les items exigent
    // l'onglet « Éléments » puis la sélection du menu parent.
    fireEvent.click(screen.getByRole('tab', { name: 'Éléments' }));
    fireEvent.change(await screen.findByLabelText('Menu'), { target: { value: MENUS[0].id } });
    expect(await screen.findByText('Accueil', {}, { timeout: 4000 })).toBeInTheDocument();
  });

  it('Écran 7 — Validation & publication : workflow, gate réel, historique', async () => {
    render(WorkspaceAt(`/business-manager/applications/${APP.id}/versions/${VER.id}/validation`));
    expect(await screen.findByText('Workflow de publication', {}, { timeout: 4000 })).toBeInTheDocument();
    expect(await screen.findByText(/PASS/)).toBeInTheDocument(); // gate réel PASS de la recette
    // « Historique des validations » existe à la fois comme onglet et comme titre de carte.
    expect(screen.getAllByText('Historique des validations').length).toBeGreaterThan(0);
  });
});
