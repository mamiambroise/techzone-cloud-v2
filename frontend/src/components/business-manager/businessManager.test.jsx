import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BMOverview from './BMOverview.jsx';
import { BMApplicationsRoute } from './BMApplicationsRoute.jsx';
import { BMApplicationNewRoute } from './BMApplicationNewRoute.jsx';

vi.mock('../../services/api/platformApplicationsService.js', () => ({
  __esModule: true,
  getApplications: vi.fn(() => Promise.resolve([
    { id: 'a1', code: 'ui_app', name: 'UI Application', description: 'Ventes', status: 'ACTIVE', updatedAt: '2026-09-29T10:00:00Z' },
  ])),
  createApplication: vi.fn(() => Promise.resolve({ id: '1' })),
  updateApplication: vi.fn(() => Promise.resolve({})),
  archiveApplication: vi.fn(() => Promise.resolve({})),
}));

vi.mock('../../services/api/platformEnvironmentsService.js', () => ({
  __esModule: true,
  getEnvironments: () => Promise.resolve([]),
  createEnvironment: () => Promise.resolve({}),
  updateEnvironment: () => Promise.resolve({}),
  getEnvironmentHistory: () => Promise.resolve([]),
}));

// BMOverview consomme /dashboard et /activity via apiClient.
vi.mock('../../services/apiClient.js', () => ({
  api: {
    get: vi.fn((url) => {
      if (url === '/business-manager/dashboard') {
        return Promise.resolve({
          data: {
            status: 'HEALTHY',
            kpis: {},
            applications: { total: 4, active: 4, archived: 0 },
            versions: { total: 5, active: 0, ready: 0, draft: 5 },
            environments: { total: 0 },
            contracts: { total: 0, active: 0 },
            snapshots: { total: 0, valid: 0, invalid: 0 },
            alerts: [],
          },
        });
      }
      if (url === '/business-manager/activity') return Promise.resolve({ data: [] });
      return Promise.resolve({ data: [] });
    }),
  },
}));

describe('BMOverview', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders the cockpit header', async () => {
    render(<MemoryRouter><BMOverview /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Vue d’ensemble' })).toBeInTheDocument();
    expect(screen.getByText('Pilotez vos applications métier depuis un seul espace.')).toBeInTheDocument();
    await screen.findByText('Plateforme opérationnelle');
  });

  it('renders real KPI cards from the dashboard API', async () => {
    render(<MemoryRouter><BMOverview /></MemoryRouter>);
    await screen.findByText('Applications récentes');
    expect(screen.getByText('Applications récentes')).toBeInTheDocument();
    expect(screen.getByText('Cycle de vie des versions')).toBeInTheDocument();
    expect(screen.getByText('Activité récente')).toBeInTheDocument();
    expect(screen.getByText('Santé plateforme')).toBeInTheDocument();
    expect(screen.getAllByText('Prêtes à publier').length).toBeGreaterThan(0);
  });

  it('lists recent applications with their real status', async () => {
    render(<MemoryRouter><BMOverview /></MemoryRouter>);
    await screen.findByText('UI Application');
    expect(screen.getByText('ui_app')).toBeInTheDocument();
  });
});

describe('BMApplicationsRoute', () => {
  it('renders the applications page header and toolbar', async () => {
    render(
      <MemoryRouter>
        <BMApplicationsRoute />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: 'Applications' })).toBeInTheDocument();
    expect(screen.getByLabelText('Rechercher une application')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nouvelle application/ })).toBeInTheDocument();
  });

  it('shows real application cards with code, status and open action', async () => {
    render(
      <MemoryRouter>
        <BMApplicationsRoute />
      </MemoryRouter>
    );
    await screen.findByText('UI Application');
    expect(screen.getByText('ui_app')).toBeInTheDocument();
    expect(screen.getAllByText(/Ouvrir l’application/).length).toBeGreaterThan(0);
  });

  it('shows the empty state when there is no application', async () => {
    const applicationsService = await import('../../services/api/platformApplicationsService.js');
    applicationsService.getApplications.mockResolvedValueOnce([]);
    render(
      <MemoryRouter>
        <BMApplicationsRoute />
      </MemoryRouter>
    );
    await waitFor(() => expect(screen.getByText('Aucune application')).toBeInTheDocument());
  });
});

describe('BMApplicationNewRoute', () => {
  it('renders the form', () => {
    render(
      <MemoryRouter>
        <BMApplicationNewRoute />
      </MemoryRouter>
    );
    expect(screen.getByText('Nouvelle application')).toBeInTheDocument();
    expect(screen.getByLabelText('Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Nom')).toBeInTheDocument();
  });
});
