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

function renderEditor() {
  const store = configureStore({ reducer: { uiBuilder: uiBuilderReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/ui/builder/page-a']}>
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
