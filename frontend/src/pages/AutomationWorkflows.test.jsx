import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AutomationWorkflows from './AutomationWorkflows.jsx';
import { automationService } from '../services/apiClient.js';

vi.mock('../services/apiClient.js', () => ({
  automationService: {
    workflows: vi.fn(),
    executions: vi.fn(),
    actions: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
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
});
