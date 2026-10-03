import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';

let collapsed = false;
let principal = { displayName: 'Compte de recette', permissions: ['*'], isAdmin: true };
let tenant = { activeTenant: { id: 'tenant-a' }, loading: false, error: null };

vi.mock('react-redux', () => ({
  useDispatch: () => action => {
    if (action?.type === 'platform/setSidebarCollapsed') collapsed = action.payload;
  },
  useSelector: selector => selector({ platform: { sidebarCollapsed: collapsed } }),
}));
vi.mock('../auth/AuthProvider.jsx', () => ({ useAuth: () => ({ user: principal, logout: vi.fn() }) }));
vi.mock('../contexts/TenantProvider.jsx', () => ({ useTenant: () => tenant }));

const renderSidebar = (path = '/dashboard', props = {}) =>
  render(<MemoryRouter initialEntries={[path]}><Sidebar isOpen={false} onClose={() => {}} {...props} /></MemoryRouter>);

// Un module à une seule entrée est rendu comme un lien, sinon comme un accordéon.
const group = name =>
  screen.queryByRole('button', { name }) ?? screen.getByRole('link', { name });
const submenuOf = id => document.getElementById(`submenu-${id}`);
const MODULE_IDS = {
  'Business Manager': 'bm',
  'UI Builder': 'ui',
  Automatisation: 'automation',
  'Pack Manager': 'packs',
  Runtime: 'runtime',
  Données: 'data',
  'ERP / Dolibarr': 'erp',
  'API & Intégrations': 'api',
  Registry: 'registry',
};

beforeEach(() => {
  collapsed = false;
  principal = { displayName: 'Compte de recette', permissions: ['*'], isAdmin: true };
  tenant = { activeTenant: { id: 'tenant-a' }, loading: false, error: null };
  localStorage.clear();
});
afterEach(cleanup);

describe('Sections (RG-NAV-025)', () => {
  it('renders the five global sections as level 2 headings', () => {
    renderSidebar();
    const headings = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent);
    expect(headings).toEqual(['ACCUEIL', 'CONSTRUCTION', 'EXÉCUTION', 'DONNÉES & INTÉGRATIONS', 'PLATEFORME']);
  });

  it('exposes a labelled navigation landmark', () => {
    renderSidebar();
    expect(screen.getByRole('complementary', { name: 'Navigation principale' })).toBeInTheDocument();
  });
});

describe('Accordion (RG-NAV-021)', () => {
  it('renders the eight real UI Builder destinations for a principal with ui-builder:read', () => {
    principal = { displayName: 'UI builder reader', permissions: ['ui-builder:read'], isAdmin: false };
    renderSidebar('/ui');
    expect(group('UI Builder')).toHaveAttribute('aria-expanded', 'true');
    const labels = within(submenuOf('ui')).getAllByRole('link').map((link) => link.textContent);
    expect(labels).toEqual(['Vue d’ensemble', 'Pages', 'Éditeur visuel', 'Composants', 'Formulaires', 'Navigation', 'Thème', 'Aperçu & Test']);
  });

  it('does not render UI Builder without ui-builder:read', () => {
    principal = { displayName: 'Operator', permissions: ['automation:read'], isAdmin: false };
    renderSidebar('/dashboard');
    expect(screen.queryByRole('button', { name: 'UI Builder' })).toBeNull();
  });
  it('expands a module on click and collapses it on a second click', () => {
    renderSidebar('/dashboard');
    const packs = group('Pack Manager');
    expect(packs).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(packs);
    expect(group('Pack Manager')).toHaveAttribute('aria-expanded', 'true');
    expect(within(submenuOf('packs')).getByRole('link', { name: 'Publication' })).toBeInTheDocument();
    fireEvent.click(group('Pack Manager'));
    expect(group('Pack Manager')).toHaveAttribute('aria-expanded', 'false');
  });

  it('navigates when a child is clicked', () => {
    renderSidebar('/dashboard');
    fireEvent.click(group('Pack Manager'));
    const link = within(submenuOf('packs')).getByRole('link', { name: 'Validation & Manifest' });
    expect(link).toHaveAttribute('href', '/packs/validation');
  });

  it('keeps a hidden submenu out of the accessibility tree and tab order', () => {
    renderSidebar('/dashboard');
    expect(submenuOf('packs').closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'true');
    expect(submenuOf('packs').closest('[inert]')).not.toBeNull();
  });

  it('persists the expanded modules without storing sensitive data', () => {
    renderSidebar('/dashboard');
    fireEvent.click(group('Runtime'));
    expect(JSON.parse(localStorage.getItem('techzone.nav.expanded'))).toMatchObject({ runtime: true });
    expect(JSON.stringify(localStorage.getItem('techzone.nav.expanded'))).not.toMatch(/tenant|token|user|secret/i);
  });
});

describe('Active state and deep links (RG-NAV-019, RG-NAV-020)', () => {
  it('marks the active child with aria-current and keeps its parent expanded', () => {
    renderSidebar('/packs/validation');
    expect(group('Pack Manager')).toHaveAttribute('aria-expanded', 'true');
    expect(group('Pack Manager')).toHaveAttribute('aria-label', 'Pack Manager');
    expect(within(submenuOf('packs')).getByRole('link', { name: 'Validation & Manifest' })).toHaveAttribute('aria-current', 'page');
    expect(within(submenuOf('packs')).getByRole('link', { name: 'Packs' })).not.toHaveAttribute('aria-current');
  });

it.each([
    ['/erp/clients', 'ERP / Dolibarr', 'Ressources'],
    ['/runtime/cache', 'Runtime', 'Cache'],
    ['/business-manager/applications/app-1/versions/v1', 'Business Manager', 'Applications'],
    ['/data-runtime', 'Données', 'Vue d’ensemble'],
    ['/automation/workflows', 'Automatisation', 'Workflows'],
  ])('keeps %s inside its expanded parent and active child', (path, parent, child) => {
    renderSidebar(path);
    expect(group(parent)).toHaveAttribute('aria-expanded', 'true');
    expect(within(submenuOf(MODULE_IDS[parent])).getByRole('link', { name: child })).toHaveAttribute('aria-current', 'page');
  });

  it('marks the active module itself when it has no children', () => {
    renderSidebar('/dashboard');
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toHaveAttribute('aria-current', 'page');
  });
});

describe('Collapsed mode and tooltips (RG-NAV-023)', () => {
  it('keeps icons and exposes a tooltip on hover', () => {
    collapsed = true;
    renderSidebar('/dashboard');
    expect(screen.queryByRole('searchbox')).toBeNull();
    const trigger = group('Pack Manager');
    fireEvent.mouseEnter(trigger);
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toHaveTextContent('Pack Manager');
    fireEvent.mouseLeave(trigger.closest('[data-navigation-group]'));
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('exposes the tooltip on keyboard focus too', () => {
    collapsed = true;
    renderSidebar('/dashboard');
    fireEvent.focus(group('ERP / Dolibarr'));
    expect(screen.getByRole('tooltip')).toHaveTextContent('ERP / Dolibarr');
  });

  it('keeps every module reachable by its accessible name while collapsed', () => {
    collapsed = true;
    renderSidebar('/dashboard');
    ['Tableau de bord', 'Business Manager', 'UI Builder', 'Automatisation', 'Pack Manager', 'Runtime', 'Données', 'ERP / Dolibarr', 'API & Intégrations', 'Registry'].forEach(name => {
      expect(group(name)).toBeInTheDocument();
    });
  });

  it('reopens the sidebar when a collapsed module is activated', () => {
    collapsed = true;
    renderSidebar('/dashboard');
    expect(screen.queryByRole('searchbox')).toBeNull();
    fireEvent.click(group('Pack Manager'));
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(group('Pack Manager')).toHaveAttribute('aria-expanded', 'true');
    expect(within(submenuOf('packs')).getByRole('link', { name: 'Publication' })).toBeInTheDocument();
  });
});

describe('Module availability badge', () => {
  it('marks a fully planned module as Bientôt without hiding it', () => {
    renderSidebar('/dashboard');
    expect(group('Registry')).toBeInTheDocument();
    expect(within(group('Registry')).getByText('Bientôt')).toBeInTheDocument();
  });

  it('marks only the unavailable child of a partially available module', () => {
    renderSidebar('/dashboard');
    fireEvent.click(group('Automatisation'));
    const items = within(submenuOf('automation')).getAllByRole('link');
    const flagged = items.filter(link => within(link).queryByText('Bientôt')).map(link => link.textContent.replace('Bientôt', ''));
    expect(flagged).toEqual(['Actions', 'Planifications', 'Modèles', 'Diagnostics', 'Formules']);
  });
});

describe('Sidebar search never reveals a hidden module', () => {
  it('filters only the entries already visible for the principal', () => {
    principal = { displayName: 'Opérateur', permissions: ['erp:read', 'automation:read'], isAdmin: false };
    renderSidebar('/dashboard');
    fireEvent.change(screen.getByLabelText('Rechercher dans le menu'), { target: { value: 'Pack' } });
    expect(screen.queryByRole('button', { name: 'Pack Manager' })).toBeNull();
  });

  it('reports when nothing matches', () => {
    renderSidebar('/dashboard');
    fireEvent.change(screen.getByLabelText('Rechercher dans le menu'), { target: { value: 'zzzz' } });
    expect(screen.getByText('Aucun résultat.')).toBeInTheDocument();
  });
});

describe('IAM filtering of the sidebar', () => {
  it('shows only the dashboard while the tenant context is unresolved', () => {
    tenant = { activeTenant: null, loading: true, error: null };
    renderSidebar('/dashboard');
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Pack Manager' })).toBeNull();
    expect(screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual(['ACCUEIL']);
  });

  it('keeps the safe fallback when the tenant context fails', () => {
    tenant = { activeTenant: null, loading: false, error: new Error('down') };
    renderSidebar('/dashboard');
    expect(screen.queryByRole('button', { name: 'Runtime' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Tableau de bord' })).toBeInTheDocument();
  });

  it('recomputes the navigation when the tenant changes', () => {
    tenant = { activeTenant: { id: 'tenant-b' }, loading: false, error: null };
    const { rerender } = renderSidebar('/dashboard');
    expect(screen.getByRole('button', { name: 'Pack Manager' })).toBeInTheDocument();
    tenant = { activeTenant: { id: 'tenant-c' }, loading: false, error: null };
    rerender(<MemoryRouter initialEntries={['/dashboard']}><Sidebar isOpen={false} onClose={() => {}} /></MemoryRouter>);
    expect(screen.getByRole('button', { name: 'Pack Manager' })).toBeInTheDocument();
  });
});

describe('Mobile drawer and accessibility (RG-NAV-022, RG-NAV-021)', () => {
  it('behaves as a modal dialog with a close control when opened', () => {
    renderSidebar('/dashboard', { isOpen: true });
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByTestId('sidebar-overlay')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer le menu' })).toBeInTheDocument();
  });

  it('closes the drawer on Escape', () => {
    const onClose = vi.fn();
    renderSidebar('/dashboard', { isOpen: true, onClose });
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('restores focus and unlocks scrolling when the drawer closes', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    const { unmount } = renderSidebar('/dashboard', { isOpen: true });
    unmount();
    expect(document.body.style.overflow).toBe('');
    trigger.remove();
  });

  it('gives every collapsible module an accessible name and state', () => {
    renderSidebar('/packs/validation');
    const packs = group('Pack Manager');
    expect(packs).toHaveAttribute('aria-label', 'Pack Manager');
    expect(packs).toHaveAttribute('aria-controls', 'submenu-packs');
    expect(packs).toHaveAttribute('aria-expanded');
  });

  it('keeps a very long module scrollable instead of overflowing', () => {
    renderSidebar('/dashboard');
    const nav = document.querySelector('#main-sidebar nav');
    expect(nav).toBeTruthy();
    expect(nav.className).toMatch(/overflow-y-auto/);
    expect(screen.getAllByRole('button', { name: /^(Business Manager|UI Builder|Automatisation|Pack Manager|Runtime|Données|ERP \/ Dolibarr|API & Intégrations)$/ }).length).toBe(8);
  });
});
