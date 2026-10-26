import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SubNavBar from './SubNavBar.jsx';

vi.mock('../auth/AuthProvider.jsx', () => ({
  useAuth: () => ({ user: { permissions: ['*'], isSuperAdmin: true } }),
}));

function renderTabs(path) {
  return render(<MemoryRouter initialEntries={[path]}><SubNavBar /></MemoryRouter>);
}

describe('ModuleTabs in the global shell', () => {
  it('keeps tenant Billing tabs separate from platform administration tabs', () => {
    renderTabs('/billing/overview');
    expect(screen.getByRole('link', { name: 'Mon abonnement' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Factures & paiements' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Offres & tarifs' })).toBeNull();
  });

  it('selects only platform Billing tabs on a platform route', () => {
    renderTabs('/billing/admin/catalog');
    expect(screen.getByRole('link', { name: 'Offres & tarifs' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Diagnostics & audit' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mon abonnement' })).toBeNull();
  });

  it('consolidates the ERP destinations into the shared tabs', () => {
    renderTabs('/erp');
    ['Vue d’ensemble', 'Ressources', 'Connexions', 'Mappings', 'Paramètres & diagnostics'].forEach((label) => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    });
  });
});
