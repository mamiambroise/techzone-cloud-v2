// Opt-in real HTTP recipe. No API mocks or demo data. Spawned by ph6-runtime.cjs.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import axios from 'axios';
import { api } from '../../../services/apiClient.js';
import { UiRenderer } from './Renderer.jsx';
import { getBusinessContext, getUiDefinition } from '../services/uiBuilderService.js';

describe.skipIf(!process.env.PH6_COOKIE)('Renderer with real PostgreSQL backend', () => {
  it('loads persisted BM/UI definitions, submits typed Form and refreshes DataTable', async () => {
    api.defaults.baseURL = 'http://127.0.0.1:3106/api';
    api.defaults.headers.common.Cookie = process.env.PH6_COOKIE;
    api.defaults.adapter = axios.getAdapter('http');
    const version = process.env.PH6_VERSION;
    const context = await getBusinessContext(version);
    const definition = await getUiDefinition(version);
    const page = definition.pages.find(p => p.key === 'ph6-recipe');
    expect(page).toBeTruthy();
    render(<UiRenderer tree={page.components} businessContext={context} mode="runtime" />);
    await waitFor(() => expect(screen.getByText('PH6-C002')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('code'), { target: { value: 'PH6-UI-C001' } });
    fireEvent.change(screen.getByLabelText('name'), { target: { value: 'PH6 UI Customer' } });
    fireEvent.change(screen.getByLabelText('email'), { target: { value: 'ph6-ui@example.test' } });
    fireEvent.click(screen.getByLabelText('active'));
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    await waitFor(() => expect(screen.getByText('Enregistrement créé.')).toBeTruthy());
    await waitFor(() => expect(screen.getByText('PH6-UI-C001')).toBeTruthy());
    cleanup();
  }, 20000);
});
