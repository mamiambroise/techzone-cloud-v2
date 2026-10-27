import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AutomationLayout from './AutomationLayout.jsx';
import { useAutomationMode } from './AutomationModeContext.jsx';
import { createAppStore } from '../../store/index.js';

vi.mock('../../auth/AuthProvider.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useAuth: vi.fn() };
});

import { useAuth } from '../../auth/AuthProvider.jsx';

function ModeControls() {
  const { setBanner, reportError } = useAutomationMode();
  return (
    <>
      <button type="button" onClick={() => setBanner({ kind: 'SIMULATION', message: 'Aucun effet métier.' })}>Simuler</button>
      <button type="button" onClick={() => reportError({ normalized: { code: 'AUTOMATION_RUNTIME_BLOCKED' } })}>Bloquer</button>
    </>
  );
}

function renderLayout(user, path = '/automation', preloadedState, children = <div>Page Automation</div>) {
  useAuth.mockReturnValue({ user });
  const store = createAppStore(preloadedState);
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <AutomationLayout>{children}</AutomationLayout>
      </MemoryRouter>
    </Provider>,
  );
}

describe('AutomationLayout', () => {
  it('renders content without creating a second module navigation', () => {
    renderLayout({ permissions: ['automation:read'] }, '/automation/workflows');

    expect(screen.queryByRole('complementary', { name: 'Navigation Automation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Navigation Automation mobile' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Contexte Automation' })).toBeInTheDocument();
    expect(screen.getByText('Page Automation')).toBeInTheDocument();
  });

  it('shows the selected application, its active version, and the real provider mode', () => {
    renderLayout({ permissions: ['automation:read'] }, '/automation', {
      applications: {
        applications: [{ id: 'app-orders', name: 'Orders' }],
        versions: [{ id: 'version-2', applicationId: 'app-orders', version: '2.0.0', status: 'ACTIVE' }],
        selectedAppId: 'app-orders',
      },
      integration: { providerMode: 'MOCK' },
    });

    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('2.0.0')).toBeInTheDocument();
    expect(screen.getByLabelText('Mode connecteurs : MOCK')).toBeInTheDocument();
    expect(screen.getByRole('status', { name: 'Mode MOCK' })).toHaveTextContent('pages Automation restent servies par l’API moteur');
  });

  it('shows and dismisses a simulation banner only when a simulation is reported', () => {
    renderLayout({ permissions: ['automation:read'] }, '/automation', undefined, <ModeControls />);

    fireEvent.click(screen.getByRole('button', { name: 'Simuler' }));
    expect(screen.getByRole('status', { name: 'Mode SIMULATION' })).toHaveTextContent('Aucun effet métier.');

    fireEvent.click(screen.getByRole('button', { name: 'Fermer la bannière SIMULATION' }));
    expect(screen.queryByRole('status', { name: 'Mode SIMULATION' })).not.toBeInTheDocument();
  });

  it('shows runtime-blocked only after a blocked API result is reported', () => {
    renderLayout({ permissions: ['automation:read'] }, '/automation', undefined, <ModeControls />);

    fireEvent.click(screen.getByRole('button', { name: 'Bloquer' }));
    expect(screen.getByRole('alert', { name: 'Mode RUNTIME_BLOCKED' })).toHaveTextContent('refusé');
  });

  it('shows a 403 state when the read permission is missing', () => {
    renderLayout({ permissions: [] });

    expect(screen.getByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument();
    expect(screen.queryByText('Page Automation')).not.toBeInTheDocument();
  });
});
