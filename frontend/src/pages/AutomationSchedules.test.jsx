import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AutomationSchedules from './AutomationSchedules.jsx';
import { automationService } from '../services/apiClient.js';

vi.mock('../services/apiClient.js', () => ({
  automationService: {
    schedules: vi.fn(),
    workflows: vi.fn(),
    scheduleStatus: vi.fn(),
    createSchedule: vi.fn(),
    updateSchedule: vi.fn(),
    deleteSchedule: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  automationService.schedules.mockResolvedValue({
    data: [{
      id: 'schedule-1',
      enabled: true,
      frequencyMinutes: 60,
      timezone: 'Europe/Paris',
      nextRunAt: '2026-10-22T15:00:00.000Z',
      lastRunStatus: null,
      lastRunAt: null,
      lastRunError: null,
      workflow: { code: 'workflow.invoice', name: 'Validation des factures' },
    }],
  });
  automationService.workflows.mockResolvedValue({
    data: [{ code: 'workflow.invoice', nom: 'Validation des factures', lifecycle: 'ACTIVE' }],
  });
  automationService.scheduleStatus.mockResolvedValue({ data: { enabled: false } });
});

describe('AutomationSchedules', () => {
  it('loads persisted schedules and reports when the server worker is disabled', async () => {
    render(<AutomationSchedules />);

    expect(await screen.findByRole('heading', { name: 'Planifications' })).toBeInTheDocument();
    expect(await screen.findByText('Validation des factures')).toBeInTheDocument();
    expect(screen.getByText(/worker serveur est désactivé/)).toBeInTheDocument();
    expect(automationService.schedules).toHaveBeenCalledOnce();
  });
});
