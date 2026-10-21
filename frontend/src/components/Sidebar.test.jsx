import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

let collapsed = false;
let principal = { displayName: 'Compte de recette', permissions: ['*'], isAdmin: true };
let tenant = { activeTenant: { id: 'tenant-a' }, loading: false, error: null };

vi.mock('react-redux', () => ({
  useDispatch: () => (action) => { if (action?.type === 'platform/setSidebarCollapsed') collapsed = action.payload; },
  useSelector: (selector) => selector({ platform: { sidebarCollapsed: collapsed } }),
}));
vi.mock('../auth/AuthProvider.jsx', () => ({ useAuth: () => ({ user: principal, logout: vi.fn() }) }));
vi.mock('../contexts/TenantProvider.jsx', () => ({ useTenant: () => tenant }));

const renderSidebar = (path = '/dashboard', props = {}) => render(<MemoryRouter initialEntries={[path]}><Sidebar isOpen={false} onClose={() => {}} {...props} /></MemoryRouter>);

beforeEach(() => { collapsed = false; principal = { displayName: 'Compte de recette', permissions: ['*'], isAdmin: true }; tenant = { activeTenant: { id: 'tenant-a' }, loading: false, error: null }; });
afterEach(cleanup);

describe('Navigation principale à un niveau', () => {
  it('renders the V3 sections and one route-backed link per module', () => {
    renderSidebar();
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual(['ACCUEIL', 'CRÉATION D’APPLICATIONS', 'PUBLICATION & EXÉCUTION', 'DONNÉES & INTÉGRATIONS', 'SUPERVISION', 'COMMERCIAL', 'ADMINISTRATION & INFRASTRUCTURE']);
    expect(screen.getByRole('link', { name: 'Business Manager' })).toHaveAttribute('href', '/business-manager/applications');
    expect(screen.getByRole('link', { name: 'Pack Manager' })).toHaveAttribute('href', '/packs');
    expect(document.querySelector('[id^="submenu-"]')).toBeNull();
  });

  it('marks the owning module active for deep links', () => {
    renderSidebar('/packs/validation');
    expect(screen.getByRole('link', { name: 'Pack Manager' })).toHaveAttribute('aria-current', 'page');
  });

  it('never reveals a module outside the user permissions', () => {
    principal = { displayName: 'Opérateur', permissions: ['automation:read'], isAdmin: false };
    renderSidebar('/automation');
    expect(screen.getByRole('link', { name: 'Automatisation' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pack Manager' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'UI Builder' })).toBeNull();
  });

  it('filters modules without exposing their internal destinations', () => {
    renderSidebar();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Rechercher dans le menu' }), { target: { value: 'pack' } });
    expect(screen.getByRole('link', { name: 'Pack Manager' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Pack Runtime' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Publication' })).toBeNull();
  });

  it('keeps icon links accessible in collapsed mode and exposes a tooltip', () => {
    collapsed = true;
    renderSidebar();
    const item = screen.getByRole('link', { name: 'Pack Manager' });
    fireEvent.mouseEnter(item);
    expect(screen.getByRole('tooltip')).toHaveTextContent('Pack Manager');
  });

  it('uses a dialog and close control on mobile', () => {
    renderSidebar('/dashboard', { isOpen: true });
    expect(screen.getByRole('dialog', { name: 'Navigation principale' })).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument();
  });
});
