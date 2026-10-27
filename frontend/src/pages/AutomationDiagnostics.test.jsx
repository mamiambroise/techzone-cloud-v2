import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AutomationLayout from '../components/automation/AutomationLayout.jsx';
import { createAppStore } from '../store/index.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { automationService } from '../services/apiClient.js';
import AutomationDiagnostics from './AutomationDiagnostics.jsx';

vi.mock('../auth/AuthProvider.jsx', () => ({ useAuth: vi.fn() }));

vi.mock('../services/apiClient.js', () => ({
  automationService: { history: vi.fn() },
}));

function renderDiagnostics() {
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={['/automation/diagnostics']}>
        <AutomationLayout><AutomationDiagnostics /></AutomationLayout>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: { permissions: ['automation:read'] } });
});

describe('AutomationDiagnostics', () => {
  it('shows a real blocked-count badge and module banner from server history', async () => {
    automationService.history.mockResolvedValue({
      data: [
        { executionId: 'execution-1', status: 'BLOCKED', startedAt: '2026-10-27T12:00:00.000Z' },
        { executionId: 'execution-2', status: 'FAILED', startedAt: '2026-10-27T12:01:00.000Z' },
      ],
    });

    renderDiagnostics();

    expect(await screen.findByRole('status', { name: '1 exécution bloquée' })).toHaveTextContent('1');
    expect(screen.getByRole('alert', { name: 'Mode RUNTIME_BLOCKED' })).toHaveTextContent('1 exécution est marquée BLOCKED');
  });

  it('does not show a blocked badge when the server history has no blocked records', async () => {
    automationService.history.mockResolvedValue({ data: [{ executionId: 'execution-1', status: 'SUCCEEDED' }] });

    renderDiagnostics();

    expect(await screen.findByText('Aucun incident dans l’historique reçu')).toBeInTheDocument();
    expect(screen.queryByRole('status', { name: /exécutions bloquées/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('alert', { name: 'Mode RUNTIME_BLOCKED' })).not.toBeInTheDocument();
  });
});
