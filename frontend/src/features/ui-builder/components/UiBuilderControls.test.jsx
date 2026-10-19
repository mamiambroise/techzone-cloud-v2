import { configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UiFormsBuilder from './UiFormsBuilder.jsx';
import UiPagesManager from './UiPagesManager.jsx';
import UiVisualEditor from './UiVisualEditor.jsx';
import uiBuilderReducer from '../store/uiBuilderSlice.js';
import { api } from '../../../services/apiClient.js';

// Context loading includes several effects and API responses before the canvas mounts.
configure({ asyncUtilTimeout: 5000 });

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

function renderWithStore(ui, path = '/ui', showLocation = false) {
  const store = configureStore({ reducer: { uiBuilder: uiBuilderReducer } });
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        {ui}
        {showLocation && <LocationDisplay />}
      </MemoryRouter>
    </Provider>,
  );
  return { store, ...view };
}

function LocationDisplay() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
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
  api.patch.mockImplementation(async (url, body) => ({
    data: { ...PAGES.find((page) => url.endsWith(`/${page.id}`)), ...body },
  }));
});

describe('UI Builder callback regressions', () => {
  it('opens the generic editor route on the first available page', async () => {
    const { store } = renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/editor',
      true,
    );

    await screen.findByTestId('ui-visual-editor');
    await waitFor(() => expect(store.getState().uiBuilder.selectedPageId).toBe('page-a'));
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/ui/builder/page-a'));
  });

  it('redirige un deep link inconnu vers une page existante', async () => {
    const { store } = renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/deleted-page', true,
    );
    await screen.findByTestId('ui-visual-editor');
    await waitFor(() => expect(store.getState().uiBuilder.selectedPageId).toBe('page-a'));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/ui/builder/page-a');
  });

  it('keeps a manual picker choice after resolving a deep-link page', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/page-a',
      true,
    );

    await screen.findByTestId('ui-visual-editor');
    await user.selectOptions(screen.getByLabelText("Page en cours d'édition"), 'form-page');

    await waitFor(() => expect(store.getState().uiBuilder.selectedPageId).toBe('form-page'));
    await waitFor(() => expect(screen.getByTestId('current-path')).toHaveTextContent('/ui/builder/form-page'));
  });

  it('sélectionne une page depuis le panneau Pages et synchronise le deep link', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/page-a',
      true,
    );

    await screen.findByTestId('ui-visual-editor');
    await user.click(screen.getByRole('tab', { name: 'Pages' }));
    await user.click(screen.getByRole('button', { name: /Customer form/ }));

    expect(store.getState().uiBuilder.selectedPageId).toBe('form-page');
    expect(screen.getByTestId('current-path')).toHaveTextContent('/ui/builder/form-page');
  });

  it('sélectionne un composant depuis l’arborescence des calques', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/page-a',
    );

    await screen.findByTestId('ui-visual-editor');
    await user.click(screen.getByRole('button', { name: 'Typographie' }));
    await user.click(screen.getByRole('button', { name: 'Ajouter Titre à la sélection' }));
    const headingId = store.getState().uiBuilder.selectedComponentId;

    await user.click(screen.getByRole('tab', { name: 'Calques' }));
    await user.click(screen.getByRole('treeitem', { name: 'Conteneur' }));
    await user.click(screen.getByRole('treeitem', { name: 'Titre' }));

    expect(store.getState().uiBuilder.selectedComponentId).toBe(headingId);
  });

  it('propose de créer une page quand la version ne contient aucune page', async () => {
    api.get.mockImplementation(async (url) => {
      if (url === '/business-manager/applications') return { data: [{ id: 'app-a', name: 'Application A' }] };
      if (url === '/business-manager/applications/app-a/versions') return { data: [{ id: 'version-a', version: '1.0.0', status: 'DRAFT' }] };
      if (url === '/ui-builder/pages/version-a') return { data: [] };
      if (url === '/ui-builder/overview/version-a') return { data: { applicationVersion: { editable: true } } };
      if (url === '/ui-builder/business-context/version-a') return { data: { entities: [] } };
      return { data: [] };
    });

    renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/editor',
    );

    expect(await screen.findByRole('link', { name: 'Créer une page' })).toHaveAttribute('href', '/ui/pages');
  });

  it('sauvegarde la visibilité responsive dans la configuration responsive du composant', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/page-a',
    );

    await screen.findByTestId('ui-visual-editor');
    await user.click(screen.getByRole('button', { name: 'Typographie' }));
    await user.click(screen.getByRole('button', { name: 'Ajouter Titre à la sélection' }));
    await user.click(screen.getByRole('tab', { name: 'Responsive' }));
    const visibilityControls = screen.getAllByLabelText('Visibilité');
    await user.selectOptions(visibilityControls[2], 'hidden');

    const selectedId = store.getState().uiBuilder.selectedComponentId;
    expect(store.getState().uiBuilder.tree.nodes[selectedId].responsive.MOBILE.visible).toBe('hidden');
    expect(store.getState().uiBuilder.tree.nodes[selectedId].props.MOBILE).toBeUndefined();
  });

  it('ajoute un composant par glisser-déposer et réordonne un composant existant', async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore(
      <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>,
      '/ui/builder/page-a',
    );

    await screen.findByTestId('ui-visual-editor');
    await user.click(screen.getByRole('button', { name: 'Typographie' }));

    const dataTransfer = () => {
      const values = new Map();
      return {
        effectAllowed: '',
        setData: (type, value) => values.set(type, value),
        getData: (type) => values.get(type) || '',
      };
    };
    const headingTransfer = dataTransfer();
    fireEvent.dragStart(screen.getByText('Titre').closest('li'), { dataTransfer: headingTransfer });
    fireEvent.drop(screen.getByRole('button', { name: 'Composant Container' }), { dataTransfer: headingTransfer });
    const headingId = store.getState().uiBuilder.tree.nodes.root.children[0];
    expect(store.getState().uiBuilder.tree.nodes[headingId].type).toBe('Heading');

    await user.click(screen.getByRole('button', { name: 'Ajouter Texte à la sélection' }));
    const textId = store.getState().uiBuilder.tree.nodes.root.children[1];
    const moveTransfer = dataTransfer();
    fireEvent.dragStart(screen.getByRole('button', { name: 'Composant Text' }), { dataTransfer: moveTransfer });
    moveTransfer.setData('text/ui-component-id', textId);
    fireEvent.drop(screen.getByRole('button', { name: 'Composant Heading' }), { dataTransfer: moveTransfer });

    expect(store.getState().uiBuilder.tree.nodes.root.children).toEqual([textId, headingId]);
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
