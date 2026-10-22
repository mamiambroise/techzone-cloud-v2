import { configure, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UiVisualEditor from './UiVisualEditor.jsx';
import uiBuilderReducer from '../store/uiBuilderSlice.js';
import { api } from '../../../services/apiClient.js';

// Context loading includes several effects and API responses before the canvas mounts.
configure({ asyncUtilTimeout: 5000 });

vi.mock('../../../services/apiClient.js', () => ({ api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock('../../../contexts/TenantProvider.jsx', () => ({ useTenant: () => ({ activeTenant: { id: 'tenant-a', name: 'Tenant A' } }) }));

const PAGE = {
  id: 'page-a', key: 'clients', title: 'Clients', route: '/clients', type: 'LIST', layout: 'SIDEBAR', visibility: 'ALWAYS', order: 0,
  components: { root: 'root', nodes: { root: { id: 'root', type: 'Container', props: { padding: 'md', gap: 'md' }, bindings: {}, actions: [], children: [] } } },
};

function renderEditor(entry = '/ui/builder/page-a') {
  const store = configureStore({ reducer: { uiBuilder: uiBuilderReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes><Route path="/ui/builder/:pageId" element={<UiVisualEditor />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem('ui-builder-context:tenant-a', JSON.stringify({ applicationId: 'app-a', versionId: 'version-a' }));
  api.get.mockImplementation(async (url) => {
    if (url === '/business-manager/applications') return { data: [{ id: 'app-a', name: 'Gestion WiFi & Services' }] };
    if (url === '/business-manager/applications/app-a/versions') return { data: [{ id: 'version-a', version: '1.0.0', status: 'DRAFT' }] };
    if (url === '/ui-builder/pages/version-a') return { data: [PAGE] };
    if (url === '/ui-builder/overview/version-a') return { data: { applicationVersion: { editable: true } } };
    if (url.startsWith('/ui-builder/business-context/')) return { data: { entities: [] } };
    return { data: [] };
  });
});

describe('UI Builder visual editor', () => {
  it('opens the component panel from the compact mobile control without changing the selected page', async () => {
    const user = userEvent.setup();
    renderEditor();

    await screen.findByLabelText('Canvas');
    const panel = screen.getByLabelText('Bibliothèque de composants');
    expect(panel).toHaveClass('hidden');

    await user.click(screen.getByRole('button', { name: 'Composants' }));
    expect(panel).not.toHaveClass('hidden');
    expect(screen.getByDisplayValue('Clients — /clients')).toBeInTheDocument();
  });
});

 describe('UI Builder specification context and validation links', () => {
  it('keeps tenant context visible and opens a component from a validation link', async () => {
    renderEditor('/ui/builder/page-a?component=root');
    await screen.findByLabelText('Canvas');
    expect(screen.getByRole('region', { name: 'Contexte UI Builder' })).toHaveTextContent('Tenant A');
    expect(await screen.findByRole('tab', { name: 'Avancé' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Avancé' }));
    expect(screen.getByText('Définition du composant en lecture seule.')).toBeInTheDocument();
  });
  it('opens the first valid page from the generic editor route', async () => {
    renderEditor('/ui/builder/editor');
    await screen.findByLabelText('Canvas');
    expect(screen.getByDisplayValue('Clients — /clients')).toBeInTheDocument();
  });

   it('uses the UI Builder indigo accent for navigation and canvas selection', async () => {
     renderEditor('/ui/builder/page-a');
     await screen.findByLabelText('Canvas');

     expect(screen.getByRole('link', { name: 'Éditeur visuel' })).toHaveClass('border-indigo-600', 'text-indigo-700');
     expect(screen.getByRole('button', { name: 'Composant Container' })).toHaveClass('outline-indigo-500');
     expect(screen.getByRole('region', { name: 'Contexte UI Builder' })).toHaveClass('relative', 'sm:sticky');
     expect(screen.getByRole('region', { name: 'Contexte UI Builder' })).toHaveTextContent('Aucune modification');
   });
 });
