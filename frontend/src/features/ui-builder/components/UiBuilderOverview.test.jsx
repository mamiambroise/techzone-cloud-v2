/**
 * Tests UI Builder — Vue d'ensemble (dashboard).
 *
 * Vérifie que le dashboard consomme uniquement la réponse réelle de
 * `GET /api/ui-builder/overview/:applicationVersionId` : KPI, progression,
 * pages récentes, validation, CTA principale et accès rapides.
 */
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';

import UiBuilderOverview from './UiBuilderOverview.jsx';
import uiBuilderReducer from '../store/uiBuilderSlice.js';
import { ROUTES } from '../../../app/routes.js';
import { api } from '../../../services/apiClient.js';

vi.mock('../../../services/apiClient.js', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('../../../contexts/TenantProvider.jsx', () => ({ useTenant: () => ({ activeTenant: { id: 'tenant-a', name: 'Tenant A' } }) }));

const APPLICATION = { id: 'app-a', name: 'Application A' };
const VERSIONS = [{ id: 'ver-1', version: '1.0.0', status: 'DRAFT' }];

const OVERVIEW = {
  application: { id: 'app-a', name: 'Application A', code: 'APP' },
  applicationVersion: { id: 'ver-1', version: '1.0.0', status: 'DRAFT', editable: true },
  uiProject: { applicationVersionId: 'ver-1', source: 'UI_PAGES_AND_THEME', resolved: true, pageCount: 2, hasTheme: true, themeRevision: 3 },
  counts: { pages: 2, components: 7, forms: 1, bindings: 3, navigationItems: 2, hiddenPages: 0, errors: 2, warnings: 1 },
  themeConfigured: true,
  lastSavedAt: '2026-02-03T08:30:00.000Z',
  progression: [
    { id: 'pages', label: 'Pages', status: 'READY', detail: '2 page(s) renseignée(s)' },
    { id: 'bindings', label: 'Bindings', status: 'IN_PROGRESS', detail: '3 binding(s), erreurs à corriger' },
    { id: 'navigation', label: 'Navigation', status: 'READY', detail: '2 entrée(s) visible(s)' },
    { id: 'theme', label: 'Thème', status: 'READY', detail: 'Design tokens enregistrés' },
    { id: 'responsive', label: 'Responsive', status: 'READY', detail: 'Breakpoints tablette et mobile définis' },
    { id: 'validation', label: 'Validation', status: 'IN_PROGRESS', detail: '2 erreur(s) bloquante(s)' },
  ],
  validation: {
    status: 'INVALID',
    counts: { errors: 2, warnings: 1, infos: 0 },
    checkedAt: '2026-02-03T08:31:00.000Z',
    truncated: false,
    issues: [
      { level: 'ERROR', code: 'ROUTE_INVALID', message: 'Route invalide : "clients"', pageId: 'page-1', pageKey: 'clients' },
      { level: 'ERROR', code: 'COMPONENT_UNKNOWN', message: 'Composant non pris en charge : "Grid".', pageId: 'page-2', pageKey: 'clients-detail', componentId: 'c-9' },
      { level: 'WARNING', code: 'NO_PAGES', message: 'Aucune page définie pour cette version.' },
    ],
  },
  lastPages: [
    { id: 'page-2', key: 'clients-detail', title: 'Détail client', type: 'DETAIL', status: 'READY', route: '/clients/:id', visibility: 'ALWAYS', updatedAt: '2026-02-03T08:00:00.000Z', components: 4, bindings: 2 },
    { id: 'page-1', key: 'clients', title: 'Clients', type: 'LIST', status: 'DRAFT', route: '/clients', visibility: 'ALWAYS', updatedAt: '2026-01-30T08:00:00.000Z', components: 3, bindings: 1 },
  ],
};

function mockApi(overview = OVERVIEW) {
  api.get.mockImplementation(async (url) => {
    if (url === '/business-manager/applications') return { data: [APPLICATION] };
    if (url === '/business-manager/applications/app-a/versions') return { data: VERSIONS };
    if (url === '/ui-builder/pages/ver-1') return { data: OVERVIEW.lastPages };
    if (url === '/ui-builder/overview/ver-1') return { data: overview };
    if (url.startsWith('/ui-builder/business-context')) return { data: { entities: [] } };
    return { data: [] };
  });
  api.post.mockResolvedValue({ data: {} });
}

function renderOverview(preloadedState = {}) {
  const store = configureStore({
    reducer: { uiBuilder: uiBuilderReducer },
    preloadedState: { uiBuilder: { applicationVersionId: 'ver-1' } },
  });
  store.dispatch({ type: 'uiBuilder/setContext', payload: { applicationVersionId: 'ver-1' } });
  Object.assign(store.getState().uiBuilder, preloadedState);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/ui']}>
        <UiBuilderOverview />
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem('ui-builder-context:tenant-a', JSON.stringify({ applicationId: 'app-a', versionId: 'ver-1' }));
  mockApi();
});

/** Carte KPI (label unique dans son conteneur) pour éviter les homonymes de la navigation. */
function kpiCard(label) {
  const node = screen.getAllByText(label).find((element) => element.tagName === 'P');
  return node.parentElement.parentElement;
}

describe('UI Builder — Vue d’ensemble (dashboard)', () => {
  it('affiche les KPI réels du backend', async () => {
    renderOverview();
    await screen.findByText('Progression de la conception');

    expect(within(kpiCard('Pages')).getByText('2')).toBeInTheDocument();
    expect(within(kpiCard('Pages')).getByText('2 visible(s) dans la navigation')).toBeInTheDocument();
    expect(within(kpiCard('Composants')).getByText('7')).toBeInTheDocument();
    expect(within(kpiCard('Composants')).getByText('3 binding(s) Data Runtime')).toBeInTheDocument();
    expect(within(kpiCard('Formulaires')).getByText('1')).toBeInTheDocument();
    expect(within(kpiCard('Formulaires')).getByText('thème configuré')).toBeInTheDocument();
    expect(within(kpiCard('Erreurs')).getByText('2')).toBeInTheDocument();
    expect(within(kpiCard('Avertissements')).getByText('1')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/ui-builder/overview/ver-1');
  });

  it('affiche les états de progression réels sans pourcentage arbitraire', async () => {
    renderOverview();
    await screen.findByText('Progression de la conception');

    expect(screen.getByText('3 binding(s), erreurs à corriger')).toBeInTheDocument();
    expect(screen.getByText('2 erreur(s) bloquante(s)')).toBeInTheDocument();
    expect(screen.getAllByText('Prêt').length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText('En cours').length).toBe(2);
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('liste les pages récemment modifiées avec type, statut et action éditeur', async () => {
    renderOverview();
    await screen.findByText('Pages récemment modifiées');

    expect(screen.getByText('Détail client')).toBeInTheDocument();
    expect(screen.getByText(/^\/clients\/:id · Détail · 4 composant\(s\) · maj /)).toBeInTheDocument();
    expect(screen.getByText(/^\/clients · Liste · 3 composant\(s\) · maj /)).toBeInTheDocument();
    expect(screen.getByText('READY')).toBeInTheDocument();
    expect(screen.getByText('DRAFT')).toBeInTheDocument();
    const links = screen.getAllByText('Ouvrir dans l’éditeur →');
    expect(links[0]).toHaveAttribute('href', '/ui/builder/page-2');
  });

  it('expose les problèmes de validation réels et permet d’ouvrir la page concernée', async () => {
    renderOverview();
    const card = await screen.findByRole('heading', { name: 'Validation' });
    const validationCard = card.closest('section');

    expect(within(validationCard).getByText('Route invalide : "clients"')).toBeInTheDocument();
    expect(within(validationCard).getByText('Composant non pris en charge : "Grid".')).toBeInTheDocument();
    expect(within(validationCard).getByText('Invalide')).toBeInTheDocument();
    const issueLinks = within(validationCard).getAllByText('Ouvrir →');
    expect(issueLinks).toHaveLength(2);
    expect(issueLinks[0]).toHaveAttribute('href', '/ui/builder/page-1');
    expect(issueLinks[1]).toHaveAttribute('href', '/ui/builder/page-2');
  });

  it('la CTA principale ouvre la page la plus récemment modifiée', async () => {
    renderOverview();
    const cta = await screen.findByText('Continuer la conception');
    expect(cta.closest('a')).toHaveAttribute('href', '/ui/builder/page-2');
  });

  it('la CTA principale tombe sur la création de page quand aucune page n’existe', async () => {
    mockApi({ ...OVERVIEW, counts: { ...OVERVIEW.counts, pages: 0 }, lastPages: [], validation: { ...OVERVIEW.validation, issues: [], counts: { errors: 0, warnings: 1, infos: 0 } } });
    renderOverview();

    expect(await screen.findByText('Aucune page créée')).toBeInTheDocument();
    const emptyState = screen.getByText('Aucune page créée').closest('section');
    expect(within(emptyState).getByText('Créer une page').closest('a')).toHaveAttribute('href', ROUTES.uiPages);
    expect(screen.getByText('Continuer la conception').closest('a')).toHaveAttribute('href', ROUTES.uiPages);
    expect(screen.getByText('Aucun problème détecté')).toBeInTheDocument();
  });

  it('expose les 6 accès rapides vers les routes existantes', async () => {
    renderOverview();
    await screen.findByText('Accès rapides');

    const quickAccess = screen.getByRole('heading', { name: 'Accès rapides' }).closest('section');
    const expected = [
      ['Créer une page', ROUTES.uiPages],
      ['Ouvrir l’éditeur', '/ui/builder/page-2'],
      ['Générer un formulaire', ROUTES.uiForms],
      ['Configurer la navigation', ROUTES.uiNavigation],
      ['Modifier le thème', ROUTES.uiThemes],
      ['Aperçu & Test', ROUTES.uiPreview],
    ];
    for (const [label, href] of expected) {
      expect(within(quickAccess).getByText(label).closest('a')).toHaveAttribute('href', href);
    }
  });

  it('affiche la version et la dernière sauvegarde réelles', async () => {
    renderOverview();
    await screen.findByText('Dernière sauvegarde');

    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    // L'application apparaît dans l'en-tête de contexte et dans le sélecteur du shell.
    expect(screen.getAllByText('Application A').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Version éditable · DRAFT')).toBeInTheDocument();
  });
});

describe('UI Builder — Vue d’ensemble (sélecteur Version)', () => {
  it('liste les versions réelles de l’application sélectionnée', async () => {
    api.get.mockImplementation(async (url) => {
      if (url === '/business-manager/applications') return { data: [APPLICATION] };
      if (url === '/business-manager/applications/app-a/versions') return { data: [{ id: 'ver-1', version: '1.0.0', status: 'DRAFT' }, { id: 'ver-2', version: '2.0.0', status: 'ACTIVE' }] };
      if (url === '/ui-builder/overview/ver-2') return { data: OVERVIEW };
      return { data: [] };
    });
    sessionStorage.setItem('ui-builder-context:tenant-a', JSON.stringify({ applicationId: 'app-a', versionId: '' }));

    renderOverview();

    const versionSelect = await screen.findByLabelText('Version');
    expect(versionSelect.disabled).toBe(false);
    await vi.waitFor(() => expect(within(versionSelect).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Sélectionner une version',
      '1.0.0 — DRAFT',
      '2.0.0 — ACTIVE',
    ]));
  });

  it('affiche un état explicite quand l’application n’a aucune version', async () => {
    api.get.mockImplementation(async (url) => {
      if (url === '/business-manager/applications') return { data: [APPLICATION] };
      if (url === '/business-manager/applications/app-a/versions') return { data: [] };
      return { data: [] };
    });
    sessionStorage.setItem('ui-builder-context:tenant-a', JSON.stringify({ applicationId: 'app-a', versionId: '' }));

    renderOverview();

    expect(await screen.findByText('Aucune version disponible pour cette application.')).toBeInTheDocument();
    expect(screen.getByText('Gérer les versions →').closest('a')).toHaveAttribute('href', ROUTES.bm);
    expect(screen.queryByText('Progression de la conception')).not.toBeInTheDocument();
  });

  it('guide vers le Business Manager quand le tenant n’a aucune application', async () => {
    api.get.mockImplementation(async (url) => (url === '/business-manager/applications' ? { data: [] } : { data: [] }));
    sessionStorage.clear();

    renderOverview();

    expect(await screen.findByText(/Aucune application dans ce tenant/)).toBeInTheDocument();
    expect(screen.getByText('Ouvrir le Business Manager →').closest('a')).toHaveAttribute('href', ROUTES.bm);
  });
});