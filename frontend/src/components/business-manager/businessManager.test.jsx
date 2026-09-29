import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import BMOverview from './BMOverview.jsx';
import { BMApplicationsRoute } from './BMApplicationsRoute.jsx';
import { BMApplicationNewRoute } from './BMApplicationNewRoute.jsx';

vi.mock('../../services/api/platformApplicationsService.js', () => ({
  __esModule: true,
  getApplications: () => Promise.resolve([]),
  createApplication: () => Promise.resolve({ id: '1' }),
  updateApplication: () => Promise.resolve({}),
  archiveApplication: () => Promise.resolve({}),
}));

vi.mock('../../services/api/platformEnvironmentsService.js', () => ({
  __esModule: true,
  getEnvironments: () => Promise.resolve([]),
  createEnvironment: () => Promise.resolve({}),
  updateEnvironment: () => Promise.resolve({}),
  getEnvironmentHistory: () => Promise.resolve([]),
}));

vi.mock('../../contexts/TenantProvider.jsx',()=>({useTenant:()=>({activeTenant:{id:'tenant-test'}})}));
vi.mock('../../services/apiClient.js',()=>({api:{get:vi.fn(async url=>({data:url.endsWith('/dashboard')?{status:'HEALTHY',alerts:[]}:[]}))}}));

describe('BMOverview', () => {
  it('renders without crashing', () => {
    render(<MemoryRouter><BMOverview /></MemoryRouter>);
    expect(screen.getByText('Business Manager')).toBeInTheDocument();
    expect(screen.getByText('Pilotez vos applications métier depuis un seul espace.')).toBeInTheDocument();
  });

  it('renders section cards', () => {
    render(<MemoryRouter><BMOverview /></MemoryRouter>);
    expect(screen.getAllByText('Applications').length).toBeGreaterThan(0);
    expect(screen.getByText('Cycle de vie des versions')).toBeInTheDocument();
    expect(screen.getByText('Santé plateforme')).toBeInTheDocument();
  });
});

describe('BMApplicationsRoute', () => {
  it('renders the applications page header', async () => {
    render(
      <MemoryRouter>
        <BMApplicationsRoute />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading',{name:'Applications',level:1})).toBeInTheDocument();
    await screen.findByText(/Aucune application/i);
  });

  it('shows empty state message', async () => {
    render(
      <MemoryRouter>
        <BMApplicationsRoute />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByText(/Aucune application/i)).toBeInTheDocument();
    });
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
