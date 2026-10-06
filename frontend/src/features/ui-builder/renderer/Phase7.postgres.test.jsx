// Opt-in acceptance against a dedicated real backend. No transport mocks.
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup, within } from '@testing-library/react';
import axios from 'axios';
import { api } from '../../../services/apiClient.js';
import PublishedApplication from '../../../components/pack-runtime/PublishedApplication.jsx';
import { UiRenderer } from './Renderer.jsx';

describe.skipIf(!process.env.PH7_FIXTURES)('Phase 7 published applications / PostgreSQL', () => {
  it('renders A → B → A, typed create, relation options, enum, detail/update and read-only preview', async () => {
    const fixtures = JSON.parse(process.env.PH7_FIXTURES || '[]');
    api.defaults.baseURL = process.env.PH7_API_BASE || 'http://127.0.0.1:3107/api';
    api.defaults.adapter = axios.getAdapter('http');
    for (const [index, f] of [fixtures[0], fixtures[1], fixtures[0]].entries()) {
      api.defaults.headers.common.Cookie = f.cookie;
      const wifi = f.code === 'WIFI_SERVICES', entity = wifi ? 'Customer' : 'Product';
      const identifier = (wifi ? 'RT-WIFI-' : 'RT-IT-') + process.env.PH7_STAMP;
      render(<PublishedApplication packCode={f.code.toLowerCase()} packVersion="1.0.0" tenantId={f.tenantId} />);
      await waitFor(() => expect(screen.getByRole('navigation', { name: 'Pages de l’application' })).toBeTruthy());
      fireEvent.click(screen.getByRole('button', { name: `${entity} — list` }));
      await waitFor(() => expect(screen.getByText(wifi ? 'CLI-WIFI-001' : 'PRD-IT-001')).toBeTruthy());
      if (index < 2) {
        fireEvent.click(screen.getByRole('button', { name: 'Créer' }));
        fireEvent.change(screen.getByLabelText(wifi ? 'code' : 'reference'), { target: { value: identifier } });
        fireEvent.change(screen.getByLabelText('name'), { target: { value: `Runtime ${entity}` } });
        if (!wifi) {
          const category = screen.getByLabelText('category');
          await waitFor(() => expect(within(category).getByRole('option', { name: 'Ordinateurs' })).toBeTruthy());
          fireEvent.change(category, { target: { value: within(category).getByRole('option', { name: 'Ordinateurs' }).value } });
          fireEvent.change(screen.getByLabelText('salePrice'), { target: { value: '250000.50' } });
        }
        fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
        await waitFor(() => expect(screen.getByText('Enregistrement créé.')).toBeTruthy());
      }
      fireEvent.click(screen.getByRole('button', { name: `${entity} — list` }));
      fireEvent.change(screen.getByLabelText('Champ de recherche'), { target: { value: wifi ? 'code' : 'reference' } });
      fireEvent.change(screen.getByLabelText('Rechercher'), { target: { value: identifier } });
      await waitFor(() => expect(screen.getByText(identifier)).toBeTruthy());
      expect(screen.queryByText((wifi ? 'RT-IT-' : 'RT-WIFI-') + process.env.PH7_STAMP)).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: 'Détail' }));
      await waitFor(() => expect(screen.getByLabelText('name').disabled).toBe(true));
      expect(screen.getByLabelText('name').value).toContain('Runtime');
      if (index < 2) {
        fireEvent.click(screen.getByRole('button', { name: `${entity} — list` }));
        fireEvent.change(screen.getByLabelText('Champ de recherche'), { target: { value: wifi ? 'code' : 'reference' } });
        fireEvent.change(screen.getByLabelText('Rechercher'), { target: { value: identifier } });
        await waitFor(() => expect(screen.getByText(identifier)).toBeTruthy());
        fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
        await waitFor(() => expect(screen.getByLabelText('name').value).toContain('Runtime'));
        if (!wifi) await waitFor(() => { expect(screen.getByLabelText('category').disabled).toBe(false); expect(screen.getByLabelText('category').value).not.toBe(''); });
        fireEvent.change(screen.getByLabelText('name'), { target: { value: `Runtime ${entity} modifié` } });
        fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
        await waitFor(() => expect(screen.getByText('Enregistrement modifié.')).toBeTruthy());
      }
      cleanup();
    }
    const f = fixtures[0]; api.defaults.headers.common.Cookie = f.cookie;
    const manifest = (await api.get('/runtime/manifests/wifi_services/1.0.0')).data;
    const definition = manifest.definition.ui.definition;
    const page = definition.pages.find(p => p.key === 'subscription-create');
    render(<UiRenderer tree={page.components} businessContext={definition.businessContext} mode="preview" />);
    await waitFor(() => expect(within(screen.getByLabelText('customer')).getByRole('option', { name: 'Client WIFI 1' })).toBeTruthy());
    expect(within(screen.getByLabelText('status')).getByRole('option', { name: 'SUSPENDED' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Enregistrer' }).disabled).toBe(true);
    cleanup();
  }, 90000);
});
