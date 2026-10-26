import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AutomationCockpit from './AutomationCockpit.jsx';
import { automationClient } from '../api/automation/client.ts';

vi.mock('../api/automation/client.ts', () => ({
  automationClient: {
    cockpit: vi.fn(),
    history: vi.fn(),
    metrics: vi.fn(),
  },
}));

const populatedResponse = () => {
  automationClient.cockpit.mockResolvedValue({
    data: {
      rules: { total: 4, active: 3 },
      workflows: { total: 2, active: 1 },
      triggers: { total: 1, enabled: 1 },
      attention: 1,
    },
  });
  automationClient.history.mockResolvedValue({
    data: [
      { executionId: 'exec-today', status: 'SUCCEEDED', startedAt: new Date().toISOString() },
      { executionId: 'exec-failed', status: 'FAILED', startedAt: new Date().toISOString() },
      { executionId: 'exec-retrying', status: 'RETRYING', startedAt: new Date().toISOString() },
    ],
  });
  automationClient.metrics.mockResolvedValue({
    data: {
      executionsCount: 3,
      succeededCount: 1,
      failedCount: 1,
      runningCount: 0,
      averageDuration: 1500,
    },
  });
};

const renderPage = () => render(<MemoryRouter><AutomationCockpit /></MemoryRouter>);

describe('AutomationCockpit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    populatedResponse();
  });

  it('shows real KPI values and charts from the API responses', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Vue d’ensemble' })).toBeInTheDocument();
    expect(screen.getByText('Rules Active').closest('article')).toHaveTextContent('3');
    expect(screen.getByText('Executions Today').closest('article')).toHaveTextContent('3');
    expect(screen.getByText('1,5 s')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Nombre d’exécutions par jour/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Répartition des statuts/ })).toBeInTheDocument();
  });

  it('shows an explicit empty state when the API reports no Automation data', async () => {
    automationClient.cockpit.mockResolvedValue({
      data: { rules: { total: 0 }, workflows: { total: 0 }, triggers: { total: 0 }, attention: 0 },
    });
    automationClient.history.mockResolvedValue({ data: [] });
    automationClient.metrics.mockResolvedValue({ data: { executionsCount: 0 } });
    renderPage();

    expect(await screen.findByText('Aucune donnée Automation disponible')).toBeInTheDocument();
    expect(screen.queryByText('Average Duration')).not.toBeInTheDocument();
  });

  it('shows an API error and retries on request', async () => {
    automationClient.cockpit.mockRejectedValueOnce({
      normalized: { code: 'AUTOMATION_PROVIDER_UNAVAILABLE' },
    });
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Un fournisseur requis est indisponible.');
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));

    await waitFor(() => expect(automationClient.cockpit).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('heading', { name: 'Vue d’ensemble' })).toBeInTheDocument();
  });
});
