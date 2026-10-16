import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UiFormsBuilder from './UiFormsBuilder.jsx';
import UiPagesManager from './UiPagesManager.jsx';
import UiVisualEditor from './UiVisualEditor.jsx';
import uiBuilderReducer from '../store/uiBuilderSlice.js';
import { api } from '../../../services/apiClient.js';

vi.mock('../../../services/apiClient.js', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('../../../contexts/TenantProvider.jsx', () => ({ useTenant: () => ({ activeTenant: { id: 'tenant-a', name: 'Tenant A' } }) }));

const ROOT = {
  root: 'root',
  nodes: {
    root: { id: 'root', type: 'Container', props: { padding: 'md', gap: 'md', align: 'start' }, bindings: {}, actions: [], children: [] },
  },
};

const PAGES = [
  { id: 'page-a', key: 'clients', title: 'Clients', route: '/clients', type: 'LIST', layout: 'SIDEBAR', visibility: 'ALWAYS', order: 0, components: ROOT },
  { id: 'form-page', key: 'customer-form', title: 'Customer form', route: '/customers/new', type: 'FORM', layout: 'SIDEBAR', visibility: 'ALWAYS', order: 1, components: ROOT },
];

function renderWithStore(ui, path = '/ui') {
  const store = configureStore({ reducer: { uiBuilder: uiBuilderReducer } });
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>
    </Provider>,
  );
  return { store, ...view };
}

function selectWithOption(value) {
  return screen.getAllByRole('combobox').find((select) =>
    Array.from(select.options).some((option) => option.value === value),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem('ui-builder-context:tenant-a', JSON.stringify({ applicationId: 'app-a', versionId: 'version-a' }));
  api.get.mockImplementation(async (url) => {
    if (url === '/business-manager/applications') return { data: [{ id: 'app-a', name: 'Application A' }] };
    if (url === '/business-manager/applications/app-a/versions') return { data: [{ id: 'version-a', version: '1.0.0', status: 'DRAFT' }] };
    if (url === '/ui-builder/pages/version-a') return { data: PAGES };
    if (url === '/ui-builder/overview/version-a') return { data: { applicationVersion: { editable: true } } };
    if (url === '/ui-builder/business-context/version-a') {
      return { data: { entities: [{ code: 'customer', name: 'Customer', fields: [{ id: 'name', code: 'name', label: 'Name', type: 'TEXT', required: true }] }] } };
    }
    return { data: [] };
  });
  api.post.mockResolvedValue({
    data: { ...PAGES[0], id: 'created-page', key: 'orders', title: 'Orders', route: '/orders', type: 'FORM' },
  });
  api.patch.mockResolvedValue({ data: PAGES[1] });
});

describe('UI Builder callback regressions', () => {
  it('opens the generic editor route on the first available page', async () => {
    const { store } = renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/editor',
    );

    await screen.findByTestId('ui-visual-editor');
    await waitFor(() => expect(store.getState().uiBuilder.selectedPageId).toBe('page-a'));
  });

  it('keeps a manual picker choice after resolving a deep-link page', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/page-a',
    );

    await screen.findByTestId('ui-visual-editor');
    await user.selectOptions(screen.getByLabelText("Page en cours d'édition"), 'form-page');

    await waitFor(() => expect(store.getState().uiBuilder.selectedPageId).toBe('form-page'));
  });

  it('updates an inspector select using the BmSelect value callback', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/page-a',
    );

    await screen.findByTestId('ui-visual-editor');
    const padding = screen.getAllByRole('combobox').find((select) => select.getAttribute('aria-label') === 'Espacement interne');
    expect(padding).toBeTruthy();
    await user.selectOptions(padding, 'lg');

    expect(store.getState().uiBuilder.tree.nodes.root.props.padding).toBe('lg');
  });

  it('uses select values when creating a page and a string when filtering pages', async () => {
    const user = userEvent.setup();
    renderWithStore(<UiPagesManager />);

    await screen.findByPlaceholderText('customers-list');
    await user.type(screen.getByPlaceholderText('customers-list'), 'orders');
    await user.type(screen.getByPlaceholderText('/customers'), '/orders');
    await user.type(screen.getByPlaceholderText('Liste des clients'), 'Orders');
    const pageType = selectWithOption('FORM');
    expect(pageType).toBeTruthy();
    await user.selectOptions(pageType, 'FORM');
    await user.click(screen.getByRole('button', { name: /Cr/ }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/ui-builder/pages', expect.objectContaining({ key: 'orders', type: 'FORM' })));

    await user.type(screen.getByRole('searchbox'), 'no-match');
    expect(await screen.findByText(/Aucun/)).toBeInTheDocument();
  }, 15_000);

  it('enables form composition after both BmSelect controls receive values', async () => {
    const user = userEvent.setup();
    renderWithStore(<UiFormsBuilder />);

    const compose = await screen.findByRole('button', { name: /Composer/ });
    expect(compose).toBeDisabled();

    const entity = selectWithOption('customer');
    const page = selectWithOption('form-page');
    expect(entity).toBeTruthy();
    expect(page).toBeTruthy();
    await user.selectOptions(entity, 'customer');
    await user.selectOptions(page, 'form-page');

    expect(compose).not.toBeDisabled();
  });
});
