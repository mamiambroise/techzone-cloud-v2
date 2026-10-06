/**
 * Tests UI Builder — résolution du contexte Tenant → Application → Version.
 *
 * Couvre le défaut du sélecteur Version : chargement des versions réelles,
 * purge au changement d'application, auto-sélection quand l'application
 * n'expose qu'une version, et état explicite quand il n'y en a aucune.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useUiBuilderContext, {
  contextStorageKey, readStoredContext, reconcileVersionId,
} from './useUiBuilderContext.js';
import { api } from '../../../services/apiClient.js';

vi.mock('../../../services/apiClient.js', () => ({ api: { get: vi.fn() } }));

const TENANT = 'tenant-a';

const APPS = [
  { id: 'app-a', name: 'Application A' },
  { id: 'app-b', name: 'Application B' },
];

const VERSIONS_A = [
  { id: 'ver-a1', version: '1.0.0', status: 'DRAFT' },
  { id: 'ver-a2', version: '1.1.0', status: 'ACTIVE' },
];
const VERSIONS_B = [{ id: 'ver-b1', version: '2.0.0', status: 'DRAFT' }];

/** Routeur d'API simulé : applications + versions par application. */
function mockApi({ apps = APPS, versionsByApp = { 'app-a': VERSIONS_A, 'app-b': VERSIONS_B }, fail } = {}) {
  api.get.mockImplementation(async (url) => {
    if (fail === 'versions' && url.includes('/versions')) throw Object.assign(new Error('boom'), { normalized: { type: 'ERROR' } });
    if (url === '/business-manager/applications') return { data: apps };
    const match = url.match(/^\/business-manager\/applications\/([^/]+)\/versions$/);
    if (match) return { data: versionsByApp[match[1]] ?? [] };
    return { data: [] };
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('useUiBuilderContext — vers API réelles', () => {
  it('reconcileVersionId ne conserve que les versions de l’application courante', () => {
    expect(reconcileVersionId(VERSIONS_A, 'ver-b1')).toBe('');
    expect(reconcileVersionId(VERSIONS_A, 'ver-a2')).toBe('ver-a2');
    expect(reconcileVersionId(VERSIONS_B, '')).toBe('ver-b1');
    expect(reconcileVersionId([], 'ver-a2')).toBe('');
    expect(reconcileVersionId(undefined, 'ver-a2')).toBe('');
  });

  it('charge les applications du tenant puis les versions de l’application choisie', async () => {
    mockApi();
    const { result } = renderHook(() => useUiBuilderContext({ tenantId: TENANT }));

    await waitFor(() => expect(result.current.applicationsStatus).toBe('LOADED'));
    expect(result.current.applications.map((a) => a.id)).toEqual(['app-a', 'app-b']);

    act(() => result.current.selectApplication('app-a'));

    await waitFor(() => expect(result.current.versionsStatus).toBe('LOADED'));
    expect(api.get).toHaveBeenCalledWith('/business-manager/applications/app-a/versions');
    expect(result.current.versions.map((v) => v.id)).toEqual(['ver-a1', 'ver-a2']);
    expect(result.current.versionId).toBe('');
  });

  it('purge les versions de l’application précédente au changement d’application', async () => {
    mockApi();
    const { result } = renderHook(() => useUiBuilderContext({ tenantId: TENANT }));
    await waitFor(() => expect(result.current.applicationsStatus).toBe('LOADED'));

    act(() => result.current.selectApplication('app-a'));
    await waitFor(() => expect(result.current.versionsStatus).toBe('LOADED'));
    act(() => result.current.selectVersion('ver-a2'));
    await waitFor(() => expect(result.current.versionId).toBe('ver-a2'));

    act(() => result.current.selectApplication('app-b'));

    expect(result.current.versionId).toBe('');
    expect(result.current.versions).toEqual([]);

    await waitFor(() => expect(result.current.versionsStatus).toBe('LOADED'));
    expect(result.current.versions.map((v) => v.id)).toEqual(['ver-b1']);
    // Version unique : auto-sélection, jamais de version héritée de app-a.
    expect(result.current.versionId).toBe('ver-b1');
    expect(JSON.parse(sessionStorage.getItem(contextStorageKey(TENANT)))).toEqual({ applicationId: 'app-b', versionId: 'ver-b1' });
  });

  it('sélectionne automatiquement une version unique et exige un choix si plusieurs', async () => {
    mockApi();
    const { result } = renderHook(() => useUiBuilderContext({ tenantId: TENANT }));
    await waitFor(() => expect(result.current.applicationsStatus).toBe('LOADED'));

    act(() => result.current.selectApplication('app-a'));
    await waitFor(() => expect(result.current.versionsStatus).toBe('LOADED'));
    expect(result.current.versionId).toBe('');

    act(() => result.current.selectVersion('ver-a1'));
    await waitFor(() => expect(result.current.versionId).toBe('ver-a1'));
  });

  it('expose un état EMPTY explicite quand l’application n’a aucune version', async () => {
    mockApi({ versionsByApp: { 'app-a': [] } });
    const { result } = renderHook(() => useUiBuilderContext({ tenantId: TENANT }));
    await waitFor(() => expect(result.current.applicationsStatus).toBe('LOADED'));

    act(() => result.current.selectApplication('app-a'));

    await waitFor(() => expect(result.current.versionsStatus).toBe('EMPTY'));
    expect(result.current.versions).toEqual([]);
    expect(result.current.versionId).toBe('');
  });

  it('conserve les applications quand le chargement des versions échoue', async () => {
    mockApi({ fail: 'versions' });
    const { result } = renderHook(() => useUiBuilderContext({ tenantId: TENANT }));
    await waitFor(() => expect(result.current.applicationsStatus).toBe('LOADED'));

    act(() => result.current.selectApplication('app-a'));

    await waitFor(() => expect(result.current.versionsStatus).toBe('ERROR'));
    expect(result.current.applications).toHaveLength(2);
    expect(result.current.versionId).toBe('');
  });

  it('restaure le contexte persisté du tenant et purge une application inconnue', async () => {
    mockApi();
    sessionStorage.setItem(contextStorageKey(TENANT), JSON.stringify({ applicationId: 'app-b', versionId: 'ver-b1' }));

    const { result } = renderHook(() => useUiBuilderContext({ tenantId: TENANT }));
    await waitFor(() => expect(result.current.versionId).toBe('ver-b1'));
    expect(result.current.applicationId).toBe('app-b');
    expect(result.current.version?.version).toBe('2.0.0');

    sessionStorage.setItem(contextStorageKey('tenant-b'), JSON.stringify({ applicationId: 'app-ghost', versionId: 'ver-x' }));
    const ghost = renderHook(() => useUiBuilderContext({ tenantId: 'tenant-b' }));
    await waitFor(() => expect(ghost.result.current.applicationsStatus).toBe('LOADED'));
    await waitFor(() => expect(ghost.result.current.applicationId).toBe(''));
    expect(ghost.result.current.versionId).toBe('');
  });

  it('ne charge aucune donnée sans tenant actif', async () => {
    mockApi();
    const { result } = renderHook(() => useUiBuilderContext({ tenantId: undefined }));
    expect(result.current.applicationsStatus).toBe('IDLE');
    expect(api.get).not.toHaveBeenCalled();
  });

  it('readStoredContext tolère un payload corrompu', () => {
    sessionStorage.setItem(contextStorageKey(TENANT), '{invalide');
    expect(readStoredContext(TENANT)).toEqual({ applicationId: '', versionId: '' });
  });
});