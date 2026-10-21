import { configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RuntimePage from './RuntimePage.jsx';
import { api } from '../../services/apiClient.js';

configure({ asyncUtilTimeout: 6000 });

const state = vi.hoisted(() => ({ tenant: { id: 'tenant-a', name: 'Boutique A' }, user: { id: 'user-a', permissions: ['*'] }, rows: [], contexts: [] }));
vi.mock('../../contexts/TenantProvider.jsx', () => ({ useTenant: () => ({ activeTenant: state.tenant }) }));
vi.mock('../../auth/AuthProvider.jsx', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('../../services/apiClient.js', () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock('./PublishedApplication.jsx', () => ({ default: () => <div>Application métier ouverte</div> }));
const app = { id: 'app-a', name: 'Techzone Boutique Pro' };
function executable() {
  return { id: 'r1', applicationId: app.id, environment: 'DEV', status: 'EXECUTABLE', startedAt: new Date().toISOString(), result: { expiresAt: new Date(Date.now() + 3600000).toISOString() }, diagnostics: [], steps: [], effectiveManifest: { executable: true, content: { executable: true, status: 'EXECUTABLE', source: { packCode: 'BOUTIQUE', packVersion: '1.1.0' }, scope: { tenantId: 'tenant-a', businessVersionId: 'v1' }, businessConfiguration: { application: { name: app.name, version: '1.1.0' } } } } };
}
function fixture(path) {
  if (path === '/runtime/dashboard') return { counters: { total: state.rows.length, blocked: state.rows.filter(r => r.status === 'BLOCKED').length } };
  if (path === '/runtime/resolutions') return state.rows;
  if (path === '/runtime/contexts') return state.contexts;
  if (path === '/business-manager/applications') return [app];
  if (path === '/business-manager/environments') return [{ id: 'env-a', code: 'DEV', name: 'Développement', status: 'ACTIVE' }];
  if (path === '/pack-manager/registry') return [{ id: 'p1', name: 'Boutique', code: 'BOUTIQUE', versionNumber: '1.1.0' }];
  if (path === '/runtime/cache/status') return { available: true, layer: 'L1_MEMORY', entries: 0, metrics: { hit: 0, miss: 0, invalidated: 0 } };
  if (path === '/runtime/cache/entries') return [];
  if (path === '/runtime/providers/health') return { providers: [{ code: 'LOCAL_CONTRACT_STORE', state: 'UP' }] };
  if (path === '/business-manager/applications/app-a/versions') return [{ id: 'v1', version: '1.1.0', status: 'READY' }];
  if (path === '/runtime/resolutions/r1') return state.rows[0];
  if (path.endsWith('/diagnostics')) return state.rows[0]?.diagnostics || [];
  throw new Error(`Unexpected API: ${path}`);
}
function mount(path = '/runtime') { return render(<MemoryRouter initialEntries={[path]}><RuntimePage /></MemoryRouter>); }
beforeEach(() => {
  sessionStorage.clear();
  state.tenant = { id: 'tenant-a', name: 'Boutique A' }; state.user = { id: 'user-a', permissions: ['*'] }; state.rows = []; state.contexts = [];
  api.get.mockImplementation(path => Promise.resolve({ data: fixture(path) }));
  api.post.mockResolvedValue({ data: {} });
});
describe('Pack Runtime workspace', () => {
  it('renders the overview on a trailing-slash route', async () => {
    mount('/runtime/');
    expect(await screen.findByRole('heading', { name: 'Vue d’ensemble Runtime' })).toBeInTheDocument();
    await screen.findByText('Aucune résolution enregistrée');
  });
  it('waits for a tenant before making requests', () => {
    state.tenant = null; mount();
    expect(screen.getByText('Sélectionnez un tenant')).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });
  it('keeps resolution browsing usable when an independent provider fails', async () => {
    api.get.mockImplementation(path => path === '/runtime/cache/status' ? Promise.reject({ normalized: { statusCode: 503, message: 'Cache indisponible' } }) : Promise.resolve({ data: fixture(path) }));
    mount();
    expect(await screen.findByText('Aucune résolution enregistrée')).toBeInTheDocument();
    expect(await screen.findByText('Cache indisponible')).toBeInTheDocument();
  });
  it('does not request administrative cache or provider data without permission', async () => {
    state.user = { id: 'reader', permissions: ['runtime.resolution.read'] }; mount('/runtime/resolutions');
    await screen.findByText('Aucune résolution enregistrée');
    expect(api.get.mock.calls.some(([path]) => path.includes('/cache/') || path.includes('/providers/'))).toBe(false);
    expect(screen.queryByRole('link', { name: 'Lancer un pack' })).not.toBeInTheDocument();
  });
  it('ignores late catalog responses after switching tenants', async () => {
    let finishOld;
    api.get.mockImplementation(path => path === '/business-manager/applications' && state.tenant.id === 'tenant-a'
      ? new Promise(resolve => { finishOld = resolve; }) : Promise.resolve({ data: fixture(path) }));
    const view = mount();
    await waitFor(() => expect(finishOld).toBeTypeOf('function'));
    state.tenant = { id: 'tenant-b', name: 'Boutique B' };
    view.rerender(<MemoryRouter><RuntimePage /></MemoryRouter>);
    await screen.findByText('Boutique B');
    finishOld({ data: [{ id: 'old-app', name: 'Ancien catalogue du tenant A' }] });
    await waitFor(() => expect(screen.queryByText('Ancien catalogue du tenant A')).not.toBeInTheDocument());
  });
  it('resolves only a complete context selected from server catalogs', async () => {
    mount('/runtime/resolver');
    await waitFor(() => expect(screen.getByLabelText('Application')).not.toBeDisabled());
    fireEvent.change(screen.getByLabelText('Application'), { target: { value: 'app-a' } });
    await screen.findByRole('option', { name: '1.1.0 · READY' });
    fireEvent.change(screen.getByLabelText('Version de l’application'), { target: { value: 'v1' } });
    fireEvent.change(screen.getByLabelText('Pack et version publiée'), { target: { value: 'BOUTIQUE@1.1.0' } });
    fireEvent.change(screen.getByLabelText('Environnement'), { target: { value: 'DEV' } });
    fireEvent.click(screen.getByRole('button', { name: 'Résoudre le pack' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/runtime/resolve', { applicationId: 'app-a', businessVersionId: 'v1', packCode: 'BOUTIQUE', packVersion: '1.1.0', environment: 'DEV' }, expect.objectContaining({ errorHandling: 'local' })));
  });
  it('blocks the renderer and activation on a blocked resolution', async () => {
    state.rows = [{ ...executable(), status: 'BLOCKED', diagnostics: [{ code: 'CAPABILITY_MISSING', message: 'Capacité requise absente' }], effectiveManifest: { executable: false, content: { executable: false } } }];
    mount('/runtime/resolutions?resolution=r1');
    await screen.findByText('Exécution bloquée');
    expect(screen.queryByRole('button', { name: 'Activer l’application' })).not.toBeInTheDocument();
    expect(screen.queryByText('Application métier ouverte')).not.toBeInTheDocument();
  });
  it('requires explicit opening after an active, ready context', async () => {
    state.rows = [executable()]; state.contexts = [{ id: 'c1', resolutionId: 'r1', status: 'ACTIVE', readiness: 'READY', environment: 'DEV', applicationId: app.id }];
    mount('/runtime/context?resolution=r1');
    const open = await screen.findByRole('button', { name: 'Ouvrir l’application' });
    expect(screen.queryByText('Application métier ouverte')).not.toBeInTheDocument();
    fireEvent.click(open);
    expect(await screen.findByText('Application métier ouverte')).toBeInTheDocument();
  });
  it('requires confirmation before scoped cache invalidation', async () => {
    mount('/runtime/cache');
    const button = await screen.findByRole('button', { name: 'Invalider le cache' });
    fireEvent.click(button);
    expect(api.post).not.toHaveBeenCalled();
    const dialog = await screen.findByRole('dialog');
    const buttons = dialog.querySelectorAll('button');
    buttons[buttons.length - 1].focus();
    fireEvent.keyDown(buttons[buttons.length - 1], { key: 'Tab' });
    expect(buttons[0]).toHaveFocus();
    fireEvent.click(dialog.querySelector('button:last-child'));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/runtime/cache/invalidate', { scope: 'TENANT' }, expect.anything()));
  });
});
