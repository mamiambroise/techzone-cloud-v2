import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AutomationActions from './AutomationActions.jsx';
import { automationService } from '../services/apiClient.js';

vi.mock('../services/apiClient.js', () => ({
  automationService: { actions: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  automationService.actions.mockResolvedValue({
    data: [{
      code: 'notification.send',
      category: 'NOTIFICATION',
      version: '1.0',
      timeout: 5000,
      retryable: true,
      idempotent: true,
      executable: false,
    }],
  });
});

describe('AutomationActions', () => {
  it('shows the server action catalog and distinguishes actions without handlers', async () => {
    render(<AutomationActions />);

    expect(await screen.findByRole('heading', { name: 'Actions' })).toBeInTheDocument();
    expect(await screen.findByText('notification.send')).toBeInTheDocument();
    expect(screen.getByText('Handler indisponible')).toBeInTheDocument();
    expect(screen.getByText(/toute exécution est refusée/)).toBeInTheDocument();
  });
});
