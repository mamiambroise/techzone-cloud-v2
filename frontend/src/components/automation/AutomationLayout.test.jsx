import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AutomationLayout from './AutomationLayout.jsx';

vi.mock('../../auth/AuthProvider.jsx', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useAuth: vi.fn() };
});

import { useAuth } from '../../auth/AuthProvider.jsx';

function renderLayout(user, path = '/automation') {
  useAuth.mockReturnValue({ user });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AutomationLayout><div>Page Automation</div></AutomationLayout>
    </MemoryRouter>,
  );
}

describe('AutomationLayout', () => {
  it('renders the module navigation and highlights the active section', () => {
    renderLayout({ permissions: ['automation:read'] }, '/automation/workflows');

    expect(screen.getByRole('complementary', { name: 'Navigation Automation' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Workflows' }).some((link) => link.getAttribute('aria-current') === 'page')).toBe(true);
    expect(screen.getAllByRole('link', { name: 'Planifications' })).toHaveLength(2);
    expect(screen.getByText('Page Automation')).toBeInTheDocument();
  });

  it('shows a 403 state when the read permission is missing', () => {
    renderLayout({ permissions: [] });

    expect(screen.getByRole('heading', { name: 'Accès refusé' })).toBeInTheDocument();
    expect(screen.queryByText('Page Automation')).not.toBeInTheDocument();
  });
});
