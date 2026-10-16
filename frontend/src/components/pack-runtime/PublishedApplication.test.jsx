import { configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PublishedApplication from './PublishedApplication.jsx';
import { UiRenderer } from '../../features/ui-builder/renderer/Renderer.jsx';
import { api } from '../../services/apiClient.js';

configure({ asyncUtilTimeout: 5000 });
vi.mock('../../services/apiClient.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
const tree = (text) => ({ root: 'text', nodes: { text: { id: 'text', type: 'Text', props: { text }, children: [] } } });
const definition = (version = 'version-a') => ({
  schemaVersion: '1.1', applicationVersionId: version, businessContext: { applicationVersionId: version, entities: [] },
  navigation: { items: [{ id: 'home', pageKey: 'home', label: 'Accueil' }, { id: 'detail', pageKey: 'detail', label: 'Détail' }] },
  pages: [{ key: 'home', components: tree('Contenu publié') }, { key: 'detail', components: tree('Détail publié') }],
});
const manifest = (ui = definition()) => ({ definition: { ui: { applicationVersionId: 'version-a', definition: ui } } });
const renderPublished = () => render(<PublishedApplication packCode="test" packVersion="1.0.0" tenantId="tenant-a" />);
beforeEach(() => api.get.mockResolvedValue({ data: manifest() }));

describe('Published application — shared renderer and version isolation', () => {
  it('renders the same definition as preview and navigates published pages', async () => {
    const preview = render(<UiRenderer tree={definition().pages[0].components} mode="preview" />);
    const html = preview.container.innerHTML;
    preview.unmount();
    renderPublished();
    await screen.findByText('Contenu publié');
    expect(screen.getByLabelText('Application publiée').innerHTML).toContain(html);
    fireEvent.click(screen.getByRole('button', { name: 'Détail' }));
    expect(screen.getByText('Détail publié')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith('/runtime/manifests/test/1.0.0');
  });
  it.each([
    { ...definition(), applicationVersionId: 'foreign' },
    { ...definition(), businessContext: { applicationVersionId: 'foreign', entities: [] } },
    { ...definition(), navigation: null },
    { ...definition(), pages: {} },
    { ...definition(), schemaVersion: 'unsupported' },
  ])('rejects mismatched or malformed published artifacts', async ui => {
    api.get.mockResolvedValue({ data: manifest(ui) });
    renderPublished();
    expect(await screen.findByRole('alert')).toHaveTextContent('Interface publiée indisponible');
    expect(screen.queryByText('Contenu publié')).not.toBeInTheDocument();
  });
  it('does not reuse an old tenant response after switching tenant', async () => {
    let resolveOld;
    api.get.mockImplementationOnce(() => new Promise(resolve => { resolveOld = resolve; }));
    const view = renderPublished();
    view.rerender(<PublishedApplication packCode="test" packVersion="1.0.0" tenantId="tenant-b" />);
    await screen.findByText('Contenu publié');
    resolveOld({ data: manifest({ ...definition(), pages: [{ key: 'home', components: tree('Ancien tenant') }] }) });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Ancien tenant')).not.toBeInTheDocument();
  });
});
