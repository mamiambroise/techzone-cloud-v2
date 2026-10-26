import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AutomationHistory from './AutomationHistory.jsx';
import { automationService } from '../services/apiClient.js';

vi.mock('../services/apiClient.js', () => ({
  automationService: {
    history: vi.fn(),
    metrics: vi.fn(),
  },
}));

describe('AutomationHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    automationService.history.mockResolvedValue({
      data: [
        {
          executionId: 'exec-a1',
          traceId: 'trace-001',
          workflowCode: 'invoice.approval',
          triggerCode: 'invoice.created',
          status: 'FAILED',
          startedAt: '2026-10-20T10:00:00.000Z',
          duration: 1500,
          retryCount: 1,
        },
        {
          executionId: 'exec-b2',
          traceId: 'trace-002',
          workflowCode: 'invoice.approval',
          triggerCode: 'invoice.created',
          status: 'SUCCEEDED',
          startedAt: '2026-10-20T11:00:00.000Z',
          duration: 2500,
          retryCount: 0,
        },
      ],
    });
    automationService.metrics.mockResolvedValue({
      data: {
        executionsCount: 2,
        succeededCount: 1,
        failedCount: 1,
        timeoutCount: 0,
      },
    });
  });

  it('shows API execution details and filters them by trace ID', async () => {
    render(<AutomationHistory />);

    expect(await screen.findByText('exec-a1')).toBeInTheDocument();
    expect(screen.getAllByText('invoice.created')).toHaveLength(2);
    expect(screen.getByText('1,5 s')).toBeInTheDocument();
    expect(screen.getByText('trace-001')).toBeInTheDocument();
    expect(screen.getByLabelText('Filtrer par trace ID')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filtrer par trace ID'), { target: { value: 'trace-002' } });

    expect(screen.queryByText('exec-a1')).not.toBeInTheDocument();
    expect(screen.getByText('exec-b2')).toBeInTheDocument();
  });

  it('shows the empty state when the API returns no executions', async () => {
    automationService.history.mockResolvedValue({ data: [] });
    automationService.metrics.mockResolvedValue({
      data: { executionsCount: 0, succeededCount: 0, failedCount: 0, timeoutCount: 0 },
    });

    render(<AutomationHistory />);

    expect(await screen.findByText('Aucune exécution retournée par le moteur.')).toBeInTheDocument();
  });
});
