import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AutomationWorkflows from './AutomationWorkflows.jsx';
import { automationService } from '../services/apiClient.js';
import { useAuth } from '../auth/AuthProvider.jsx';

vi.mock('../auth/AuthProvider.jsx', () => ({ useAuth: vi.fn() }));

vi.mock('../services/apiClient.js', () => ({
  automationService: {
    workflows: vi.fn(),
    executions: vi.fn(),
    actions: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  useAuth.mockReturnValue({ user: { permissions: ['automation:execute'] } });
  automationService.workflows.mockResolvedValue({ data: [] });
  automationService.executions.mockResolvedValue({ data: [] });
  automationService.actions.mockResolvedValue({ data: [] });
});

describe('AutomationWorkflows', () => {
  it('renders the quick-start actions without an undefined icon crash', async () => {
    render(<AutomationWorkflows />);

    expect(await screen.findByRole('heading', { name: 'Workflows' })).toBeInTheDocument();
    expect(screen.getByText(/D.marrer rapidement/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Notification/ })).toBeInTheDocument();
  });

  it('keeps workflow mutations unavailable to read-only users', async () => {
    useAuth.mockReturnValue({ user: { permissions: ['automation:read'] } });
    render(<AutomationWorkflows />);

    expect(await screen.findByRole('heading', { name: 'Workflows' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nouveau workflow' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Notification/ })).not.toBeInTheDocument();
  });
});
