import { configure, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import UiThemeBuilder from './UiThemeBuilder.jsx';
import uiBuilderReducer from '../store/uiBuilderSlice.js';
import { api } from '../../../services/apiClient.js';

configure({ asyncUtilTimeout: 5000 });

vi.mock('../../../services/apiClient.js', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));
vi.mock('../../../contexts/TenantProvider.jsx', () => ({
  useTenant: () => ({ activeTenant: { id: 'tenant-a', name: 'Tenant A' } }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  sessionStorage.setItem('ui-builder-context:tenant-a', JSON.stringify({ applicationId: 'app-a', versionId: 'version-a' }));
  api.get.mockImplementation(async (url) => {
    if (url === '/business-manager/applications') return { data: [{ id: 'app-a', name: 'Application A' }] };
    if (url === '/business-manager/applications/app-a/versions') return { data: [{ id: 'version-a', version: '1.0.0', status: 'DRAFT' }] };
    if (url === '/ui-builder/overview/version-a') return { data: { applicationVersion: { editable: true } } };
    if (url === '/ui-builder/pages/version-a') return { data: [] };
    if (url === '/ui-builder/business-context/version-a') return { data: { entities: [] } };
    if (url === '/ui-builder/uidefinition/version-a') return { data: { theme: null } };
    return { data: [] };
  });
  api.put.mockImplementation(async (_url, body) => ({ data: { tokens: body.tokens } }));
});

function renderThemeBuilder() {
  const store = configureStore({ reducer: { uiBuilder: uiBuilderReducer } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/ui/themes']}>
        <UiThemeBuilder />
      </MemoryRouter>
    </Provider>,
  );
}

describe('UI Builder theme editor', () => {
  it('applies a palette, previews device modes, and saves governed design tokens', async () => {
    const user = userEvent.setup();
    renderThemeBuilder();

    await screen.findByRole('heading', { name: 'Personnaliser le design du site' });
    await user.click(screen.getByRole('button', { name: 'Indigo' }));
    expect(screen.getByRole('button', { name: 'Tablette' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Mobile' }));
    expect(screen.getByRole('button', { name: 'Mobile' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Enregistrer le design' }));

    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/ui-builder/theme', expect.objectContaining({
      applicationVersionId: 'version-a',
      tokens: expect.objectContaining({
        colors: expect.objectContaining({ primary: '#6258D7', primarySoft: '#F1F0FF' }),
      }),
    })));
  });
});
