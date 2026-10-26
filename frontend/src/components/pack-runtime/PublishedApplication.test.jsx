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
const manifest = (ui = definition()) => ({ hash: 'hash-a', definition: { ui: { applicationVersionId: 'version-a', definition: ui } } });
const gate = (tenantId = 'tenant-a') => ({
  content: {
    executable: true,
    status: 'EXECUTABLE',
    scope: { tenantId },
    source: { packCode: 'test', packVersion: '1.0.0', manifestHash: 'hash-a' },
  },
});
const renderPublished = () => render(<PublishedApplication packCode="test" packVersion="1.0.0" tenantId="tenant-a" resolutionId="resolution-a" effectiveManifest={gate()} />);
const businessContext = {
  applicationVersionId: 'version-a',
  entities: [{ code: 'Customer', fields: [{ code: 'name', type: 'TEXT' }] }],
};
const dataTableTree = () => ({
  root: 'table',
  nodes: {
    table: {
      id: 'table',
      type: 'DataTable',
      props: { title: 'Customers' },
      bindings: { rows: { kind: 'ENTITY_LIST', entity: 'Customer' } },
      children: [],
    },
  },
});
beforeEach(() => {
  api.get.mockResolvedValue({ data: manifest() });
  api.post.mockResolvedValue({ data: { items: [], total: 0 } });
});

describe('Published application — shared renderer and version isolation', () => {
  it('uses the published theme tokens in the runtime renderer', async () => {
    const ui = { ...definition(), theme: { colors: { primary: '#6258D7' }, spacing: { container: 960 } } };
    api.get.mockResolvedValueOnce({ data: manifest(ui) });
    render(<PublishedApplication packCode="test" packVersion="1.0.0" tenantId="tenant-a" resolutionId="resolution-a" effectiveManifest={gate()} />);
    await screen.findByText('Contenu publié');
    const renderer = screen.getByLabelText('Application publiée').querySelector('.ui-renderer');

    expect(renderer.style.getPropertyValue('--ui-primary')).toBe('#6258D7');
    expect(renderer.style.getPropertyValue('--ui-container-width')).toBe('960px');
  });

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
    view.rerender(<PublishedApplication packCode="test" packVersion="1.0.0" tenantId="tenant-b" resolutionId="resolution-b" effectiveManifest={gate('tenant-b')} />);
    await screen.findByText('Contenu publié');
    resolveOld({ data: manifest({ ...definition(), pages: [{ key: 'home', components: tree('Ancien tenant') }] }) });
    await waitFor(() => expect(api.get).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Ancien tenant')).not.toBeInTheDocument();
  });
});

describe('SEC-UI-121 Runtime gate', () => {
  it.each([
    [undefined, undefined],
    ['resolution-a', { content: { ...gate().content, executable: false } }],
    ['resolution-a', { content: { ...gate().content, status: 'BLOCKED' } }],
    ['resolution-a', gate('tenant-b')],
  ])('does not load or render a blocked or foreign runtime', (resolutionId, effectiveManifest) => {
    api.get.mockClear();
    render(<PublishedApplication packCode="test" packVersion="1.0.0" tenantId="tenant-a" resolutionId={resolutionId} effectiveManifest={effectiveManifest} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Interface bloquée');
    expect(api.get).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Application publiée')).not.toBeInTheDocument();
  });

  it('blocks a different pack or version before loading the immutable manifest', () => {
    api.get.mockClear();
    render(<PublishedApplication packCode="other" packVersion="2.0.0" tenantId="tenant-a" resolutionId="resolution-a" effectiveManifest={gate()} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Interface bloquée');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('SEC-UI-111 refuses a manifest different from the resolved hash', async () => {
    api.get.mockResolvedValue({ data: { ...manifest(), hash: 'other-hash' } });
    renderPublished();
    expect(await screen.findByRole('alert')).toHaveTextContent('Interface publiée indisponible');
  });

  it('forwards the server-validated resolution proof to published Data Runtime reads', async () => {
    const ui = {
      ...definition(),
      businessContext,
      pages: [{ key: 'home', components: dataTableTree() }],
    };
    const effectiveManifest = {
      content: { ...gate().content, ui: { definition: ui } },
    };
    render(<PublishedApplication packCode="test" packVersion="1.0.0" tenantId="tenant-a" resolutionId="resolution-a" effectiveManifest={effectiveManifest} />);

    await screen.findByRole('navigation', { name: 'Pages de l’application' });
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/data-runtime/query',
      expect.objectContaining({ resource: 'bm:version-a:Customer' }),
      expect.objectContaining({ headers: { 'X-Runtime-Resolution-Id': 'resolution-a' } }),
    ));
  });

  it('never reads live Data Runtime records in editor preview', async () => {
    render(<UiRenderer tree={dataTableTree()} businessContext={businessContext} mode="preview" />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Aperçu protégé');
    expect(api.post).not.toHaveBeenCalled();
  });
});
