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

describe('BMOverview', () => {
  it('renders without crashing', () => {
    render(<BMOverview />);
    expect(screen.getByText('Business Manager')).toBeInTheDocument();
    expect(screen.getByText("Vue d'ensemble du Business Manager")).toBeInTheDocument();
  });

  it('renders section cards', () => {
    render(<BMOverview />);
    expect(screen.getByText('Applications')).toBeInTheDocument();
    expect(screen.getByText('Environnements')).toBeInTheDocument();
    expect(screen.getByText('Contrats')).toBeInTheDocument();
  });
});

describe('BMApplicationsRoute', () => {
  it('renders the applications page header', () => {
    render(
      <MemoryRouter>
        <BMApplicationsRoute />
      </MemoryRouter>
    );
    expect(screen.getByText('Applications')).toBeInTheDocument();
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
