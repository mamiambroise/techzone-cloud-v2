import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Provider } from 'react-redux';
import { act } from 'react';

import { AuthContext } from '../auth/AuthProvider.jsx';
import { TenantProvider, useTenant } from '../contexts/TenantProvider.jsx';
import { iamAuthService } from '../services/authService.js';
import { createAppStore } from '../store/index.js';
import { TENANT_SCOPED_SLICES } from '../store/tenantScope.js';

vi.mock('../services/authService.js', () => ({
  iamAuthService: { me: vi.fn(), refresh: vi.fn(), getTenants: vi.fn(), switchTenant: vi.fn() },
  getDeviceFingerprint: vi.fn(),
}));

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

/** Sonde qui expose le contexte tenant à la fois en affichage et en actions. */
let ctx;
function Probe() {
  ctx = useTenant();
  return <p data-testid="tenant">{ctx.activeTenant?.id ?? 'none'}</p>;
}

/** Charge des données serveur pour le tenant courant, comme le ferait un module. */
const loadDataFor = (store, tag) => {
  store.dispatch({ type: 'applications/fetchApplications/fulfilled', payload: [{ id: `app-${tag}` }] });
  store.dispatch({ type: 'environments/fetchEnvironments/fulfilled', payload: [{ id: `env-${tag}`, code: tag }] });
};

const serverData = (store) =>
  JSON.stringify(
    TENANT_SCOPED_SLICES.map((s) => store.getState()[s]),
  );

function mount(store, tenants) {
  iamAuthService.getTenants.mockResolvedValue({ data: tenants });
  iamAuthService.switchTenant.mockResolvedValue({ data: { activeTenant: tenants[0]?.id } });
  render(
    <Provider store={store}>
      <AuthContext.Provider value={{ user: { id: 'u1' }, authState: 'AUTHENTICATED', refreshPrincipal: vi.fn() }}>
        <TenantProvider>
          <Probe />
        </TenantProvider>
      </AuthContext.Provider>
    </Provider>,
  );
}

describe('switchTenant — isolation des données entre tenants', () => {
  it('A -> B -> A : aucune donnée du tenant précédent ne reste visible', async () => {
    const store = createAppStore();
    mount(store, [
      { id: 'tenant-a', name: 'A', status: 'ACTIVE' },
      { id: 'tenant-b', name: 'B', status: 'ACTIVE' },
    ]);

    await waitFor(() => expect(ctx.tenants).toHaveLength(2));
    // L'utilisateur choisit explicitement A (aucun auto-switch quand >1 tenant).
    await act(async () => {
      await ctx.switchTenant('tenant-a');
    });
    expect(screen.getByTestId('tenant').textContent).toBe('tenant-a');

    // --- Tenant A : on charge des données ---
    loadDataFor(store, 'a');
    const dataA = serverData(store);
    expect(dataA).toContain('app-a');

    // --- Passage à B ---
    await act(async () => {
      await ctx.switchTenant('tenant-b');
    });
    expect(screen.getByTestId('tenant').textContent).toBe('tenant-b');
    // Immediately after the switch, nothing of A remains.
    expect(serverData(store)).not.toContain('app-a');
    loadDataFor(store, 'b');
    expect(serverData(store)).toContain('app-b');
    expect(serverData(store)).not.toContain('app-a');

    // --- Retour à A ---
    await act(async () => {
      await ctx.switchTenant('tenant-a');
    });
    expect(serverData(store)).not.toContain('app-b');
    loadDataFor(store, 'a');
    expect(serverData(store)).toContain('app-a');
    expect(serverData(store)).not.toContain('app-b');
  });

  it('conserve l’état global (préférences d’interface) pendant la purge', async () => {
    const store = createAppStore();
    store.dispatch({ type: 'platform/toggleSidebarCollapsed' });
    store.dispatch({ type: 'platform/addToast', payload: { type: 'info', title: 'T', message: 'M' } });
    loadDataFor(store, 'a');

    mount(store, [
      { id: 'tenant-a', name: 'A', status: 'ACTIVE' },
      { id: 'tenant-b', name: 'B', status: 'ACTIVE' },
    ]);
    await waitFor(() => expect(ctx.tenants).toHaveLength(2));
    await act(async () => {
      await ctx.switchTenant('tenant-a');
    });

    const s = store.getState();
    expect(s.platform.sidebarCollapsed).toBe(true);
    expect(s.platform.toasts).toHaveLength(1);
  });
});

describe('switchTenant — refus et échec', () => {
  it('refuse un tenant non listé sans purger ni changer de contexte', async () => {
    const store = createAppStore();
    mount(store, [{ id: 'tenant-a', name: 'A', status: 'ACTIVE' }]);
    await waitFor(() => expect(ctx.tenants).toHaveLength(1));
    await act(async () => {
      await ctx.switchTenant('tenant-a');
    });
    loadDataFor(store, 'a');
    const before = serverData(store);

    await expect(ctx.switchTenant('tenant-zzz-intrusif')).rejects.toThrow();
    expect(serverData(store)).toBe(before);
    expect(screen.getByTestId('tenant').textContent).toBe('tenant-a');
    // Le serveur n'a jamais été sollicité pour un tenant non autorisé.
    expect(iamAuthService.switchTenant).not.toHaveBeenCalledWith('tenant-zzz-intrusif');
  });

  it('ne purge rien quand le serveur refuse la bascule', async () => {
    const store = createAppStore();
    mount(store, [
      { id: 'tenant-a', name: 'A', status: 'ACTIVE' },
      { id: 'tenant-b', name: 'B', status: 'ACTIVE' },
    ]);
    await waitFor(() => expect(ctx.tenants).toHaveLength(2));
    await act(async () => {
      await ctx.switchTenant('tenant-a');
    });
    loadDataFor(store, 'a');
    const before = serverData(store);

    iamAuthService.switchTenant.mockRejectedValueOnce(new Error('membership refusée'));
    await expect(ctx.switchTenant('tenant-b')).rejects.toThrow();
    // Contexte et données inchangés : pas de purge partielle.
    expect(screen.getByTestId('tenant').textContent).toBe('tenant-a');
    expect(serverData(store)).toBe(before);
  });
});